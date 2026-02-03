from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings


def _timeout() -> httpx.Timeout:
    return httpx.Timeout(settings.ai_service_timeout)


async def analyze_before(payload: dict[str, Any]) -> dict[str, Any] | None:
    try:
        async with httpx.AsyncClient(base_url=settings.ai_service_url, timeout=_timeout()) as client:
            response = await client.post("/analyze/before", json=payload)
            response.raise_for_status()
            return response.json()
    except (httpx.RequestError, httpx.HTTPStatusError):
        return None


async def analyze_after(payload: dict[str, Any]) -> dict[str, Any] | None:
    try:
        async with httpx.AsyncClient(base_url=settings.ai_service_url, timeout=_timeout()) as client:
            response = await client.post("/analyze/after", json=payload)
            response.raise_for_status()
            return response.json()
    except (httpx.RequestError, httpx.HTTPStatusError):
        return None
