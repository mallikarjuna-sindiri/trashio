from __future__ import annotations

from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, Request, UploadFile, status

from app.api.deps import DB, require_role
from app.models.report import ReportCreate, ReportPublic, report_doc_from_create
from app.utils.uploads import apply_public_urls, save_upload_with_thumbnail

router = APIRouter()


@router.post("/", response_model=ReportPublic, status_code=status.HTTP_201_CREATED)
async def create_report(
    description: str = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    before_image: UploadFile = File(...),
    request: Request,
    *,
    payload: dict = Depends(require_role("citizen")),
    database: DB,
):
    citizen_id = ObjectId(payload["sub"])
    before_url, before_thumb_url = await save_upload_with_thumbnail(before_image, "before")
    report_payload = ReportCreate(description=description, location={"lat": lat, "lng": lng})
    doc = report_doc_from_create(citizen_id, report_payload, before_url, before_thumb_url)

    result = await database.reports.insert_one(doc)
    created = await database.reports.find_one({"_id": result.inserted_id})
    return ReportPublic(**apply_public_urls(request, created))


@router.get("/my", response_model=list[ReportPublic])
async def my_reports(
    request: Request,
    *,
    payload: dict = Depends(require_role("citizen")),
    database: DB,
):
    citizen_id = ObjectId(payload["sub"])
    cursor = database.reports.find({"citizen_id": citizen_id}).sort("created_at", -1)
    return [ReportPublic(**apply_public_urls(request, doc)) async for doc in cursor]


@router.get("/assigned", response_model=list[ReportPublic])
async def assigned_reports(
    request: Request,
    *,
    payload: dict = Depends(require_role("cleaner")),
    database: DB,
):
    cleaner_id = ObjectId(payload["sub"])
    cursor = database.reports.find({"assigned_cleaner_id": cleaner_id}).sort("assigned_at", -1)
    return [ReportPublic(**apply_public_urls(request, doc)) async for doc in cursor]
