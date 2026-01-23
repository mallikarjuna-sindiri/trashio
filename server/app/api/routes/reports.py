from __future__ import annotations

import os
from uuid import uuid4

from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.api.deps import DB, require_role
from app.core.config import settings
from app.models.report import ReportCreate, ReportPublic, report_doc_from_create
from app.utils.uploads import validate_upload

router = APIRouter()


@router.post("/", response_model=ReportPublic, status_code=status.HTTP_201_CREATED)
async def create_report(
    description: str = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    before_image: UploadFile = File(...),
    *,
    payload: dict = Depends(require_role("citizen")),
    database: DB,
):
    validate_upload(before_image)

    citizen_id = ObjectId(payload["sub"])
    filename = f"before_{uuid4().hex}_{before_image.filename}"
    filepath = os.path.join(settings.upload_dir, filename)

    contents = await before_image.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    before_url = f"/uploads/{filename}"
    report_payload = ReportCreate(description=description, location={"lat": lat, "lng": lng})
    doc = report_doc_from_create(citizen_id, report_payload, before_url)

    result = await database.reports.insert_one(doc)
    created = await database.reports.find_one({"_id": result.inserted_id})
    return ReportPublic(**created)


@router.get("/my", response_model=list[ReportPublic])
async def my_reports(*, payload: dict = Depends(require_role("citizen")), database: DB):
    citizen_id = ObjectId(payload["sub"])
    cursor = database.reports.find({"citizen_id": citizen_id}).sort("created_at", -1)
    return [ReportPublic(**doc) async for doc in cursor]


@router.get("/assigned", response_model=list[ReportPublic])
async def assigned_reports(*, payload: dict = Depends(require_role("cleaner")), database: DB):
    cleaner_id = ObjectId(payload["sub"])
    cursor = database.reports.find({"assigned_cleaner_id": cleaner_id}).sort("assigned_at", -1)
    return [ReportPublic(**doc) async for doc in cursor]
