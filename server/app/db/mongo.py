from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings


class Mongo:
    client: AsyncIOMotorClient | None = None
    last_error: str | None = None


mongo = Mongo()


def connect() -> None:
    try:
        # connect=False avoids forcing an immediate connection/DNS resolution at startup.
        mongo.client = AsyncIOMotorClient(settings.mongodb_uri, connect=False)
        mongo.last_error = None
    except Exception as exc:
        mongo.client = None
        mongo.last_error = str(exc)


def close() -> None:
    if mongo.client is not None:
        mongo.client.close()


def db():
    if mongo.client is None:
        raise RuntimeError(mongo.last_error or "Mongo client not initialized")
    return mongo.client[settings.mongodb_db]
