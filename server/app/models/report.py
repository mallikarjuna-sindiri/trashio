from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.models.common import MongoModel, PyObjectId, now_utc

ReportStatus = Literal["Pending", "Verified", "Assigned", "Cleaned", "Approved", "Completed", "Rejected"]


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

    verified_by_admin_id: PyObjectId | None = None
    verified_at: datetime | None = None

    assigned_cleaner_id: PyObjectId | None = None
    assigned_by_admin_id: PyObjectId | None = None
    assigned_at: datetime | None = None

    after_image_url: str | None = None
    after_image_thumb_url: str | None = None
    cleaned_at: datetime | None = None

    cleaning_verified_by_admin_id: PyObjectId | None = None
    cleaning_verified_at: datetime | None = None

    rejected_reason: str | None = None


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
        "created_at": now_utc(),
        "verified_by_admin_id": None,
        "verified_at": None,
        "assigned_cleaner_id": None,
        "assigned_by_admin_id": None,
        "assigned_at": None,
        "after_image_url": None,
        "after_image_thumb_url": None,
        "cleaned_at": None,
        "cleaning_verified_by_admin_id": None,
        "cleaning_verified_at": None,
        "rejected_reason": None,
    }
