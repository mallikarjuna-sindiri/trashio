from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


SERVER_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(SERVER_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    mongodb_uri: str
    mongodb_db: str = "trashio"

    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7

    cors_origins: str = "http://localhost:5173"

    upload_dir: str = "./uploads"
    max_upload_mb: int = 8
    image_thumb_px: int = 640

    ai_service_url: str = "http://localhost:9000"
    ai_service_timeout: float = 10.0
    citizen_reward_amount: float = 10.0
    cleaner_payment_amount: float = 20.0

    google_client_id: str | None = None

    reset_token_expire_minutes: int = 30
    reset_password_url_base: str = "http://localhost:5173/reset-password"

    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str | None = None
    smtp_use_tls: bool = True

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()  # type: ignore[call-arg]
