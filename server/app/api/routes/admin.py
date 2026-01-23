from __future__ import annotations

from datetime import UTC, datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, EmailStr

from app.api.deps import DB, require_role
from app.core.security import hash_password
from app.models.common import MongoModel
from app.models.user import UserCreate, UserPublic, user_doc_from_create
from app.models.report import ReportPublic, ReportStatus

router = APIRouter()


class VerifyRequest(BaseModel):
    action: str = Field(pattern="^(approve|reject)$")
    reason: str | None = Field(default=None, max_length=200)


class AssignRequest(BaseModel):
    cleaner_id: str


class VerifyCleaningRequest(BaseModel):
    action: str = Field(pattern="^(approve|reject)$")
    reason: str | None = Field(default=None, max_length=200)


class UpdateStatusRequest(BaseModel):
    status: ReportStatus


class CleanerOption(MongoModel):
    full_name: str
    email: EmailStr


@router.post("/users", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    *,
    admin_payload: dict = Depends(require_role("admin")),
    database: DB,
):
    if payload.role != "admin":
        raise HTTPException(status_code=400, detail="Only admin users can be created here")
    existing = await database.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    password_hash = hash_password(payload.password)
    doc = user_doc_from_create(payload, password_hash)
    result = await database.users.insert_one(doc)
    created = await database.users.find_one({"_id": result.inserted_id})
    return UserPublic(**created)


@router.get("/reports", response_model=list[ReportPublic])
async def list_reports(
    status_filter: str | None = None,
    *,
    payload: dict = Depends(require_role("admin")),
    database: DB,
):
    query: dict = {}
    if status_filter:
        query["status"] = status_filter
    cursor = database.reports.find(query).sort("created_at", -1)
    return [ReportPublic(**doc) async for doc in cursor]


@router.get("/cleaners", response_model=list[CleanerOption])
async def list_cleaners(
    *,
    payload: dict = Depends(require_role("admin")),
    database: DB,
):
    cursor = (
        database.users.find(
            {"role": "cleaner", "is_active": True},
            {"password_hash": 0},
        )
        .sort("created_at", -1)
    )
    return [CleanerOption(**doc) async for doc in cursor]


@router.post("/reports/{report_id}/verify", response_model=ReportPublic)
async def verify_report(
    report_id: str,
    body: VerifyRequest,
    *,
    payload: dict = Depends(require_role("admin")),
    database: DB,
):
    if not ObjectId.is_valid(report_id):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid report id")
    rid = ObjectId(report_id)
    report = await database.reports.find_one({"_id": rid})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report["status"] != "Pending":
        raise HTTPException(status_code=409, detail="Only Pending reports can be verified")

    admin_id = ObjectId(payload["sub"])
    now = datetime.now(UTC)

    if body.action == "approve":
        update = {"$set": {"status": "Verified", "verified_by_admin_id": admin_id, "verified_at": now}}
    else:
        update = {
            "$set": {
                "status": "Rejected",
                "verified_by_admin_id": admin_id,
                "verified_at": now,
                "rejected_reason": body.reason or "Rejected by admin",
            }
        }

    await database.reports.update_one({"_id": rid}, update)
    updated = await database.reports.find_one({"_id": rid})
    return ReportPublic(**updated)


@router.post("/reports/{report_id}/assign", response_model=ReportPublic)
async def assign_cleaner(
    report_id: str,
    body: AssignRequest,
    *,
    payload: dict = Depends(require_role("admin")),
    database: DB,
):
    if not ObjectId.is_valid(report_id):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid report id")
    if not ObjectId.is_valid(body.cleaner_id):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid cleaner id")
    rid = ObjectId(report_id)
    report = await database.reports.find_one({"_id": rid})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report["status"] != "Verified":
        raise HTTPException(status_code=409, detail="Only Verified reports can be assigned")

    cleaner = await database.users.find_one({"_id": ObjectId(body.cleaner_id), "role": "cleaner", "is_active": True})
    if not cleaner:
        raise HTTPException(status_code=404, detail="Cleaner not found")

    admin_id = ObjectId(payload["sub"])
    now = datetime.now(UTC)

    await database.reports.update_one(
        {"_id": rid},
        {
            "$set": {
                "status": "Assigned",
                "assigned_cleaner_id": ObjectId(body.cleaner_id),
                "assigned_by_admin_id": admin_id,
                "assigned_at": now,
            }
        },
    )

    updated = await database.reports.find_one({"_id": rid})
    return ReportPublic(**updated)


@router.post("/reports/{report_id}/verify-cleaning", response_model=ReportPublic)
async def verify_cleaning(
    report_id: str,
    body: VerifyCleaningRequest,
    *,
    payload: dict = Depends(require_role("admin")),
    database: DB,
):
    if not ObjectId.is_valid(report_id):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid report id")
    rid = ObjectId(report_id)
    report = await database.reports.find_one({"_id": rid})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report["status"] != "Cleaned":
        raise HTTPException(status_code=409, detail="Only Cleaned reports can be verified")

    admin_id = ObjectId(payload["sub"])
    now = datetime.now(UTC)

    if body.action == "approve":
        update = {"$set": {"status": "Approved", "cleaning_verified_by_admin_id": admin_id, "cleaning_verified_at": now}}
    else:
        update = {
            "$set": {
                "status": "Assigned",
                "cleaning_verified_by_admin_id": admin_id,
                "cleaning_verified_at": now,
                "rejected_reason": body.reason or "Cleaning rejected by admin",
                "after_image_url": None,
                "cleaned_at": None,
            }
        }

    await database.reports.update_one({"_id": rid}, update)
    updated = await database.reports.find_one({"_id": rid})
    return ReportPublic(**updated)


@router.patch("/reports/{report_id}/status", response_model=ReportPublic)
async def update_report_status(
    report_id: str,
    body: UpdateStatusRequest,
    *,
    payload: dict = Depends(require_role("admin")),
    database: DB,
):
    if not ObjectId.is_valid(report_id):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid report id")
    rid = ObjectId(report_id)
    report = await database.reports.find_one({"_id": rid})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    update: dict = {"$set": {"status": body.status}}
    if body.status == "Rejected" and not report.get("rejected_reason"):
        update["$set"]["rejected_reason"] = "Updated by admin"
    if body.status != "Rejected" and report.get("rejected_reason"):
        update["$set"]["rejected_reason"] = None

    await database.reports.update_one({"_id": rid}, update)
    updated = await database.reports.find_one({"_id": rid})
    return ReportPublic(**updated)


@router.delete("/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    report_id: str,
    *,
    payload: dict = Depends(require_role("admin")),
    database: DB,
):
    if not ObjectId.is_valid(report_id):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid report id")
    rid = ObjectId(report_id)
    result = await database.reports.delete_one({"_id": rid})
    if result.deleted_count == 0:
        return None
    return None
