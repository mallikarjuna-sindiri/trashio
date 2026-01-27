from __future__ import annotations

from datetime import UTC, datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.api.deps import DB, require_role
from app.models.report import ReportPublic
from app.utils.uploads import save_upload_with_thumbnail

router = APIRouter()


@router.post("/reports/{report_id}/upload-after", response_model=ReportPublic)
async def upload_after_image(
    report_id: str,
    after_image: UploadFile = File(...),
    *,
    payload: dict = Depends(require_role("cleaner")),
    database: DB,
):
    rid = ObjectId(report_id)
    report = await database.reports.find_one({"_id": rid})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    cleaner_id = ObjectId(payload["sub"])
    if report.get("assigned_cleaner_id") != cleaner_id:
        raise HTTPException(status_code=403, detail="Not assigned to this report")

    if report["status"] != "Assigned":
        raise HTTPException(status_code=409, detail="Only Assigned reports can be cleaned")

    after_url, after_thumb_url = await save_upload_with_thumbnail(after_image, "after")
    now = datetime.now(UTC)

    await database.reports.update_one(
        {"_id": rid},
        {
            "$set": {
                "status": "Cleaned",
                "after_image_url": after_url,
                "after_image_thumb_url": after_thumb_url,
                "cleaned_at": now,
            }
        },
    )

    updated = await database.reports.find_one({"_id": rid})
    return ReportPublic(**updated)
