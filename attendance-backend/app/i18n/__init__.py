import json
from pathlib import Path
from typing import Optional

from starlette.types import ASGIApp, Receive, Scope, Send
from starlette.requests import Request
from starlette.responses import Response

LOCALES_DIR = Path(__file__).parent / "locales"
_cache = {}  # type: dict


def load_locale(locale: str) -> dict:
    if locale in _cache:
        return _cache[locale]
    locale_file = LOCALES_DIR / locale / "messages.json"
    if not locale_file.exists():
        locale_file = LOCALES_DIR / "en" / "messages.json"
    with open(locale_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    _cache[locale] = data
    return data


def get_locale_from_request(request: Request) -> str:
    # Check query param first
    locale = request.query_params.get("lang")
    if locale and (LOCALES_DIR / locale / "messages.json").exists():
        return locale

    # Check Accept-Language header
    accept_lang = request.headers.get("Accept-Language", "en")
    for part in accept_lang.split(","):
        lang = part.split(";")[0].strip().lower()
        if lang.startswith("hi"):
            return "hi"
        elif lang.startswith("ta"):
            return "ta"
        elif lang.startswith("en"):
            return "en"

    return "en"


class LocaleMiddleware:
    """
    Pure ASGI middleware — WebSocket-safe.
    BaseHTTPMiddleware breaks WebSocket; this raw ASGI approach does not.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        # Only process HTTP requests; pass WebSocket/lifespan through untouched
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope)
        scope["state"] = getattr(scope, "state", {}) if not isinstance(scope.get("state"), dict) else scope["state"]
        locale = get_locale_from_request(request)
        scope.setdefault("state", {})
        scope["state"]["locale"] = locale
        scope["state"]["translations"] = load_locale(locale)

        # Wrap send to inject Content-Language header
        async def send_with_locale(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers.append((b"content-language", locale.encode()))
                message["headers"] = headers
            await send(message)

        await self.app(scope, receive, send_with_locale)
