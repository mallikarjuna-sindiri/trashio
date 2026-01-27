from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.api import api_router
from app.core.config import settings
from app.db.mongo import close, connect
from app.db.startup import ensure_indexes


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.upload_dir, exist_ok=True)
    connect()
    await ensure_indexes()
    yield
    close()


class CacheControlStaticFiles(StaticFiles):
    def __init__(self, *args, cache_control: str, **kwargs):
        super().__init__(*args, **kwargs)
        self.cache_control = cache_control

    async def get_response(self, path: str, scope):
        response = await super().get_response(path, scope)
        if response.status_code == 200:
            response.headers["Cache-Control"] = self.cache_control
        return response


app = FastAPI(title="Trashio API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount(
    "/uploads",
    CacheControlStaticFiles(
        directory=settings.upload_dir,
        check_dir=False,
        cache_control="public, max-age=31536000, immutable",
    ),
    name="uploads",
)

app.include_router(api_router, prefix="/api")
