from __future__ import annotations

import os
from datetime import UTC, datetime
from uuid import uuid4

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.api.deps import DB, require_role
from app.core.config import settings
from app.models.report import ReportPublic
from app.utils.uploads import validate_upload

router = APIRouter()


@router.post("/reports/{report_id}/upload-after", response_model=ReportPublic)
async def upload_after_image(
    report_id: str,
    after_image: UploadFile = File(...),
    *,
    payload: dict = Depends(require_role("cleaner")),
    database: DB,
):
    validate_upload(after_image)
    rid = ObjectId(report_id)
    report = await database.reports.find_one({"_id": rid})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    cleaner_id = ObjectId(payload["sub"])
    if report.get("assigned_cleaner_id") != cleaner_id:
        raise HTTPException(status_code=403, detail="Not assigned to this report")

    if report["status"] != "Assigned":
        raise HTTPException(status_code=409, detail="Only Assigned reports can be cleaned")

    filename = f"after_{uuid4().hex}_{after_image.filename}"
    filepath = os.path.join(settings.upload_dir, filename)

    contents = await after_image.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    after_url = f"/uploads/{filename}"
    now = datetime.now(UTC)

    await database.reports.update_one(
        {"_id": rid},
        {"$set": {"status": "Cleaned", "after_image_url": after_url, "cleaned_at": now}},
    )

    updated = await database.reports.find_one({"_id": rid})
    return ReportPublic(**updated)
