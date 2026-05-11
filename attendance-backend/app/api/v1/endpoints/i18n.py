from fastapi import APIRouter, Request

from app.i18n import load_locale, get_locale_from_request

router = APIRouter(prefix="/i18n", tags=["Internationalization"])


@router.get("/messages")
def get_messages(request: Request):
    locale = get_locale_from_request(request)
    return {"locale": locale, "messages": load_locale(locale)}


@router.get("/locales")
def get_available_locales():
    return {
        "locales": [
            {"code": "en", "name": "English"},
            {"code": "hi", "name": "हिंदी"},
            {"code": "ta", "name": "தமிழ்"},
        ]
    }
