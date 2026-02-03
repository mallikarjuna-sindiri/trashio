from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.models.common import MongoModel, PyObjectId, now_utc

ReportStatus = Literal["Pending", "Verified", "Assigned", "Cleaned", "Approved", "Completed", "Rejected"]
ReportPriority = Literal["Low", "Medium", "High"]


class GeoPoint(BaseModel):
    lat: float
    lng: float


class ReportCreate(BaseModel):
    description: str = Field(min_length=3, max_length=500)
    location: GeoPoint


class ReportPublic(MongoModel):
    citizen_id: PyObjectId
    description: str
    location: GeoPoint

    before_image_url: str
    before_image_thumb_url: str | None = None

    status: ReportStatus
    created_at: datetime

    priority: ReportPriority | None = None
    severity: float | None = None
    ai_decision: str | None = None
    ai_reason: str | None = None
    ai_flags: list[str] = Field(default_factory=list)
    ai_locked: bool = False
    before_image_hash: str | None = None
    after_image_hash: str | None = None

    verified_by_admin_id: PyObjectId | None = None
    verified_at: datetime | None = None
    verified_by_ai: bool = False

    assigned_cleaner_id: PyObjectId | None = None
    assigned_by_admin_id: PyObjectId | None = None
    assigned_at: datetime | None = None
    assigned_by_ai: bool = False

    after_image_url: str | None = None
    after_image_thumb_url: str | None = None
    cleaned_at: datetime | None = None

    cleaning_verified_by_admin_id: PyObjectId | None = None
    cleaning_verified_at: datetime | None = None
    cleaning_verified_by_ai: bool = False

    rejected_reason: str | None = None

    reclean_required: bool = False


def report_doc_from_create(
    citizen_id: PyObjectId,
    payload: ReportCreate,
    before_url: str,
    before_thumb_url: str | None,
) -> dict:
    return {
        "citizen_id": citizen_id,
        "description": payload.description,
        "location": payload.location.model_dump(),
        "before_image_url": before_url,
        "before_image_thumb_url": before_thumb_url,
        "status": "Pending",
        "priority": None,
        "severity": None,
        "ai_decision": None,
        "ai_reason": None,
        "ai_flags": [],
        "ai_locked": False,
        "before_image_hash": None,
        "after_image_hash": None,
        "created_at": now_utc(),
        "verified_by_admin_id": None,
        "verified_at": None,
        "verified_by_ai": False,
        "assigned_cleaner_id": None,
        "assigned_by_admin_id": None,
        "assigned_at": None,
        "assigned_by_ai": False,
        "after_image_url": None,
        "after_image_thumb_url": None,
        "cleaned_at": None,
        "cleaning_verified_by_admin_id": None,
        "cleaning_verified_at": None,
        "cleaning_verified_by_ai": False,
        "rejected_reason": None,
        "reclean_required": False,
    }
