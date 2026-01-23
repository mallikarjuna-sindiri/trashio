from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.models.common import MongoModel, PyObjectId, now_utc

PaymentType = Literal["citizen_reward", "cleaner_payment"]
PaymentStatus = Literal["Pending", "Issued", "Failed"]


class PaymentCreate(BaseModel):
    report_id: PyObjectId
    user_id: PyObjectId
    amount: float = Field(gt=0)
    payment_type: PaymentType


class PaymentPublic(MongoModel):
    report_id: PyObjectId
    user_id: PyObjectId
    amount: float
    payment_type: PaymentType
    status: PaymentStatus
    created_at: datetime
    issued_at: datetime | None = None


def payment_doc_from_create(payload: PaymentCreate) -> dict:
    return {
        "report_id": payload.report_id,
        "user_id": payload.user_id,
        "amount": payload.amount,
        "payment_type": payload.payment_type,
        "status": "Pending",
        "created_at": now_utc(),
        "issued_at": None,
    }
