from __future__ import annotations

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}


def validate_upload(file: UploadFile) -> None:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPG/PNG/WEBP allowed.",
        )

    # Size validation: FastAPI doesn't expose size before reading.
    # We enforce via MAX_UPLOAD_MB by reading and writing in endpoints (simple MVP).
    # If needed later, enforce via reverse proxy limits + streaming.
    if settings.max_upload_mb <= 0:
        return
