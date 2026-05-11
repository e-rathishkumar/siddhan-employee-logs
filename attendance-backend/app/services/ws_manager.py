"""
WebSocket manager for real-time push notifications to employee apps.

Employees connect with their JWT token, join a room keyed by employee UUID.
Backend broadcasts events (check_in, check_out, kiosk_detect, dashboard_update)
to connected clients.
"""

import asyncio
import logging
from typing import Dict, Optional, Set

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages active WebSocket connections per employee."""

    def __init__(self):
        # employee_id (str) -> set of active websockets
        self._connections: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        """Store reference to the main event loop (call from lifespan)."""
        self._loop = loop

    async def connect(self, employee_id: str, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            if employee_id not in self._connections:
                self._connections[employee_id] = set()
            self._connections[employee_id].add(websocket)
        logger.info("WS connected: employee %s (total: %d)", employee_id, len(self._connections[employee_id]))

    async def disconnect(self, employee_id: str, websocket: WebSocket):
        async with self._lock:
            if employee_id in self._connections:
                self._connections[employee_id].discard(websocket)
                if not self._connections[employee_id]:
                    del self._connections[employee_id]
        logger.info("WS disconnected: employee %s", employee_id)

    async def send_to_employee(self, employee_id: str, data: dict):
        """Send a JSON message to all connections for a specific employee."""
        async with self._lock:
            connections = self._connections.get(employee_id, set()).copy()

        if not connections:
            return

        dead = []
        for ws in connections:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)

        if dead:
            async with self._lock:
                for ws in dead:
                    if employee_id in self._connections:
                        self._connections[employee_id].discard(ws)
                    if employee_id in self._connections and not self._connections[employee_id]:
                        del self._connections[employee_id]

    def notify_employee(self, employee_id: str, data: dict):
        """
        Sync-safe broadcast — works from BOTH sync and async FastAPI endpoints.
        Schedules the coroutine on the main event loop from any thread.
        """
        loop = self._loop
        if loop is None:
            # Try to get the running loop (works from async context)
            try:
                loop = asyncio.get_running_loop()
            except RuntimeError:
                logger.warning("No event loop available for WS broadcast")
                return

        coro = self.send_to_employee(employee_id, data)

        try:
            # Check if we're already in the event loop thread
            if loop.is_running():
                try:
                    # If called from async context (same thread), create task
                    asyncio.ensure_future(coro, loop=loop)
                except RuntimeError:
                    # Called from a different thread (sync endpoint in threadpool)
                    asyncio.run_coroutine_threadsafe(coro, loop)
            else:
                asyncio.run_coroutine_threadsafe(coro, loop)
        except Exception:
            logger.debug("WS broadcast failed for employee %s", employee_id)

    async def broadcast(self, data: dict):
        """Send a JSON message to ALL connected employees."""
        async with self._lock:
            all_connections = [
                (eid, ws)
                for eid, conns in self._connections.items()
                for ws in conns
            ]

        for eid, ws in all_connections:
            try:
                await ws.send_json(data)
            except Exception:
                await self.disconnect(eid, ws)


# Singleton instance
manager = ConnectionManager()
