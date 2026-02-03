from __future__ import annotations

from io import BytesIO
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from PIL import Image, ImageOps

from app.core.config import settings

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}

CONTENT_TYPE_EXT = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
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


def path_from_upload_url(url: str) -> str:
    if not url.startswith("/uploads/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid upload URL")
    filename = url.removeprefix("/uploads/")
    return f"{settings.upload_dir}/{filename}"


async def save_upload_with_thumbnail(file: UploadFile, prefix: str) -> tuple[str, str]:
    validate_upload(file)

    contents = await file.read()
    if settings.max_upload_mb > 0:
        max_bytes = settings.max_upload_mb * 1024 * 1024
        if len(contents) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Max {settings.max_upload_mb}MB allowed.",
            )

    ext = CONTENT_TYPE_EXT.get(file.content_type or "", ".jpg")
    filename = f"{prefix}_{uuid4().hex}{ext}"
    filepath = f"{settings.upload_dir}/{filename}"

    with open(filepath, "wb") as f:
        f.write(contents)

    try:
        image = Image.open(BytesIO(contents))
        image = ImageOps.exif_transpose(image)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGB")

        image.thumbnail((settings.image_thumb_px, settings.image_thumb_px))
        thumb_filename = f"{prefix}_thumb_{uuid4().hex}.webp"
        thumb_path = f"{settings.upload_dir}/{thumb_filename}"

        if image.mode == "RGBA":
            image = image.convert("RGB")

        image.save(thumb_path, format="WEBP", quality=72, method=6)
    except Exception as exc:  # pragma: no cover - defensive for corrupt files
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image file.",
        ) from exc

    return f"/uploads/{filename}", f"/uploads/{thumb_filename}"
