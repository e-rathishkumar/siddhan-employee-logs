from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    # App
    app_name: str = "Siddhan Logs Backend"
    app_version: str = "1.0.0"
    app_env: str = "development"
    app_debug: bool = False
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    allowed_origins: str = "*"

    # Database
    database_url: str = "sqlite:///./attendai.db"

    # JWT
    jwt_secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7

    # Face Recognition
    face_match_threshold: float = 0.55

    # Timezone for attendance (IANA timezone name)
    timezone: str = "Asia/Kolkata"

    # Rate Limiting
    rate_limit_per_minute: int = 60

    # Default Admin (used for initial seed)
    default_admin_email: str = "admin@siddhan.com"
    default_admin_password: str = "Siddhan@123"
    default_admin_name: str = "System Administrator"

    # Localization
    default_locale: str = "en"
    supported_locales: str = "en,hi,ta"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    @property
    def locale_list(self) -> List[str]:
        return [loc.strip() for loc in self.supported_locales.split(",")]

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
