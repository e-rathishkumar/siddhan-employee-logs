"""
WebSocket endpoint for employee real-time updates.

Employees connect at: ws://<host>/api/v1/ws/{token}
The token is their JWT access token — used to identify the employee.
"""

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import jwt, JWTError

from app.core.config import get_settings
from app.db.base import SessionLocal
from app.models import Employee
from app.services.ws_manager import manager

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter()


@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    """
    WebSocket connection authenticated via JWT token in the URL path.

    Sends JSON events:
      {"event": "attendance_update", "data": {...}}
      {"event": "kiosk_detect", "data": {...}}
      {"event": "dashboard_update", "data": {...}}
    """
    # Decode JWT to get user ID, then resolve to employee ID
    user_id = None
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        user_id = payload.get("sub")
    except JWTError:
        logger.debug("WS auth failed: invalid or expired token")

    if not user_id:
        await websocket.accept()
        await websocket.close(code=4001, reason="Invalid or expired token")
        return

    # Resolve user_id → employee_id so connection key matches notify_employee() calls
    employee_id = None
    try:
        db = SessionLocal()
        try:
            emp = db.query(Employee).filter(
                Employee.user_id == user_id,
                Employee.is_active == True,
            ).first()
            if emp:
                employee_id = str(emp.id)
        finally:
            db.close()
    except Exception:
        logger.debug("WS: failed to resolve employee for user %s", user_id)

    if not employee_id:
        await websocket.accept()
        await websocket.close(code=4002, reason="No employee profile found")
        return

    await manager.connect(employee_id, websocket)

    try:
        # Send initial confirmation with employee_id
        await websocket.send_json({"event": "connected", "data": {"employee_id": employee_id}})

        # Keep connection alive — listen for pings/messages
        while True:
            data = await websocket.receive_text()
            # Client can send "ping" to keep alive
            if data == "ping":
                await websocket.send_json({"event": "pong"})
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.debug("WS error for employee %s", employee_id)
    finally:
        await manager.disconnect(employee_id, websocket)
