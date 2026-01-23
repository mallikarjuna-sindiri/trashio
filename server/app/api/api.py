from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import admin, auth, cleaner, reports, users

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(cleaner.router, prefix="/cleaner", tags=["cleaner"])
