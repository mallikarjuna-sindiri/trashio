from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Annotated

from bson import ObjectId
from pydantic import BaseModel, Field
from pydantic.functional_validators import BeforeValidator
from pydantic import PlainSerializer
from pydantic.json_schema import WithJsonSchema


def _validate_object_id(v: Any) -> ObjectId:
    if isinstance(v, ObjectId):
        return v
    if isinstance(v, str) and ObjectId.is_valid(v):
        return ObjectId(v)
    raise ValueError("Invalid ObjectId")


PyObjectId = Annotated[
    ObjectId,
    BeforeValidator(_validate_object_id),
    PlainSerializer(lambda x: str(x), return_type=str),
    WithJsonSchema({"type": "string", "examples": ["507f1f77bcf86cd799439011"]}),
]


class MongoModel(BaseModel):
    id: PyObjectId | None = Field(default=None, alias="_id")

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
    }


def now_utc() -> datetime:
    return datetime.now(UTC)
