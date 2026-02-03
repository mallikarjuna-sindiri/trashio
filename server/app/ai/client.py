from __future__ import annotations

import mimetypes
import os
from datetime import datetime
from typing import Literal

import httpx
from pydantic import BaseModel

from app.core.config import settings


class AIReportDecision(BaseModel):
    decision: Literal["approve", "reject"]
    trash_present: bool
    severity: str | None = None
    priority: str | None = None
    confidence: float | None = None
    trash_score: float | None = None
    before_hash: str | None = None
    fraud_flags: list[str] = []
    reason: str | None = None
    processed_at: datetime | None = None


class AICleaningDecision(BaseModel):
    decision: Literal["cleaned", "partial", "not_cleaned"]
    confidence: float | None = None
    score_delta: float | None = None
    before_hash: str | None = None
    after_hash: str | None = None
    fraud_flags: list[str] = []
    reason: str | None = None
    processed_at: datetime | None = None


class AIServiceError(RuntimeError):
    pass


def _guess_mime(path: str) -> str:
    mime, _ = mimetypes.guess_type(path)
    return mime or "application/octet-stream"


async def analyze_report(before_image_path: str, lat: float, lng: float) -> AIReportDecision:
    url = f"{settings.ai_service_url.rstrip('/')}/ai/analyze-report"
    try:
        async with httpx.AsyncClient(timeout=settings.ai_timeout_seconds) as client:
            with open(before_image_path, "rb") as f:
                files = {"before_image": (os.path.basename(before_image_path), f, _guess_mime(before_image_path))}
                data = {"lat": str(lat), "lng": str(lng)}
                response = await client.post(url, data=data, files=files)
        response.raise_for_status()
        return AIReportDecision.model_validate(response.json())
    except Exception as exc:  # pragma: no cover - network/availability
        raise AIServiceError("AI service unavailable") from exc


async def verify_cleaning(before_image_path: str, after_image_path: str) -> AICleaningDecision:
    url = f"{settings.ai_service_url.rstrip('/')}/ai/verify-cleaning"
    try:
        async with httpx.AsyncClient(timeout=settings.ai_timeout_seconds) as client:
            with open(before_image_path, "rb") as before, open(after_image_path, "rb") as after:
                files = {
                    "before_image": (os.path.basename(before_image_path), before, _guess_mime(before_image_path)),
                    "after_image": (os.path.basename(after_image_path), after, _guess_mime(after_image_path)),
                }
                response = await client.post(url, files=files)
        response.raise_for_status()
        return AICleaningDecision.model_validate(response.json())
    except Exception as exc:  # pragma: no cover - network/availability
        raise AIServiceError("AI service unavailable") from exc
