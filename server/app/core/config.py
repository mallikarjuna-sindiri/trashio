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

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()  # type: ignore[call-arg]
