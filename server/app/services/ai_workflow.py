from __future__ import annotations

from datetime import UTC, datetime
from math import asin, cos, radians, sin, sqrt
from typing import Any

from bson import ObjectId

from app.core.config import settings
from app.models.payment import PaymentCreate, payment_doc_from_create
from app.services.ai_client import analyze_after, analyze_before


def image_path_from_url(url: str) -> str | None:
    if not url:
        return None
    if url.startswith("/uploads/"):
        filename = url.removeprefix("/uploads/")
        return f"{settings.upload_dir}/{filename}"
    return None


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    c = 2 * asin(sqrt(a))
    return r * c


def _now() -> datetime:
    return datetime.now(UTC)


async def _create_notification(database, user_id: ObjectId, notif_type: str, title: str, message: str, meta: dict | None = None) -> None:
    await database.notifications.insert_one(
        {
            "user_id": user_id,
            "type": notif_type,
            "title": title,
            "message": message,
            "meta": meta or {},
            "read": False,
            "created_at": _now(),
        }
    )


async def _select_nearest_cleaner(database, location: dict[str, float], exclude_cleaner_id: ObjectId | None = None):
    cleaners = [
        doc
        async for doc in database.users.find(
            {"role": "cleaner", "is_active": True},
            {"password_hash": 0},
        )
    ]
    if exclude_cleaner_id:
        cleaners = [cleaner for cleaner in cleaners if cleaner.get("_id") != exclude_cleaner_id]

    if not cleaners:
        return None

    with_locations = []
    for cleaner in cleaners:
        loc = cleaner.get("location")
        if loc and "lat" in loc and "lng" in loc:
            with_locations.append(cleaner)

    if with_locations:
        lat = location.get("lat")
        lng = location.get("lng")
        if lat is not None and lng is not None:
            with_locations.sort(key=lambda c: _haversine_km(lat, lng, c["location"]["lat"], c["location"]["lng"]))
            return with_locations[0]

    # Fallback: pick least assigned cleaner
    scored: list[tuple[int, dict[str, Any]]] = []
    for cleaner in cleaners:
        assigned = await database.reports.count_documents(
            {"assigned_cleaner_id": cleaner["_id"], "status": "Assigned"}
        )
        scored.append((assigned, cleaner))
    scored.sort(key=lambda item: item[0])
    return scored[0][1]


async def process_new_report(database, report: dict) -> dict:
    payload = {
        "report_id": str(report["_id"]),
        "image_path": image_path_from_url(report.get("before_image_url", "")),
        "lat": report.get("location", {}).get("lat"),
        "lng": report.get("location", {}).get("lng"),
    }

    ai = await analyze_before(payload)
    if not ai:
        return report

    ai_flags = list(ai.get("flags", []))
    image_hash = ai.get("image_hash")
    if image_hash:
        dup_count = await database.reports.count_documents(
            {"before_image_hash": image_hash, "_id": {"$ne": report["_id"]}}
        )
        if dup_count > 0:
            ai_flags.append("duplicate_before_image")

    if "duplicate_before_image" in ai_flags:
        ai["decision"] = "reject"
        ai.setdefault("reason", "Duplicate image detected")

    now = _now()

    if ai.get("decision") == "reject":
        update = {
            "$set": {
                "status": "Rejected",
                "rejected_reason": ai.get("reason") or "Rejected by AI",
                "ai_decision": "reject",
                "ai_reason": ai.get("reason"),
                "ai_flags": ai_flags,
                "ai_locked": True,
                "before_image_hash": image_hash,
                "severity": ai.get("severity"),
                "priority": ai.get("priority"),
                "verified_by_ai": True,
                "verified_at": now,
            }
        }
        await database.reports.update_one({"_id": report["_id"]}, update)
        return await database.reports.find_one({"_id": report["_id"]})

    cleaner = await _select_nearest_cleaner(database, report.get("location", {}))

    update_fields: dict[str, Any] = {
        "status": "Verified",
        "ai_decision": "approve",
        "ai_reason": None,
        "ai_flags": ai_flags,
        "ai_locked": True,
        "before_image_hash": image_hash,
        "severity": ai.get("severity"),
        "priority": ai.get("priority"),
        "verified_by_ai": True,
        "verified_at": now,
    }

    if cleaner:
        update_fields.update(
            {
                "status": "Assigned",
                "assigned_cleaner_id": cleaner["_id"],
                "assigned_by_admin_id": None,
                "assigned_by_ai": True,
                "assigned_at": now,
            }
        )

    await database.reports.update_one({"_id": report["_id"]}, {"$set": update_fields})
    updated = await database.reports.find_one({"_id": report["_id"]})

    await _create_notification(
        database,
        report["citizen_id"],
        "report_reviewed",
        "Report reviewed",
        "AI approved your report and assigned a cleaner." if cleaner else "AI approved your report. Waiting for cleaner assignment.",
        {"report_id": str(report["_id"]), "status": update_fields["status"]},
    )

    if cleaner:
        await _create_notification(
            database,
            cleaner["_id"],
            "task_assigned",
            "New task assigned",
            "A new cleanup task has been assigned to you.",
            {"report_id": str(report["_id"]), "priority": update_fields.get("priority")},
        )

    return updated


async def process_cleaning_verification(database, report: dict) -> dict:
    payload = {
        "report_id": str(report["_id"]),
        "before_image_path": image_path_from_url(report.get("before_image_url", "")),
        "after_image_path": image_path_from_url(report.get("after_image_url", "")),
    }

    ai = await analyze_after(payload)
    if not ai:
        return report

    ai_flags = list(ai.get("flags", []))
    before_hash = ai.get("before_image_hash")
    after_hash = ai.get("after_image_hash")
    if before_hash and after_hash and before_hash == after_hash:
        ai_flags.append("before_after_hash_match")

    if after_hash:
        dup_after = await database.reports.count_documents(
            {"after_image_hash": after_hash, "_id": {"$ne": report["_id"]}}
        )
        if dup_after > 0:
            ai_flags.append("duplicate_after_image")

    now = _now()

    if ai.get("decision") == "accept" and not ai_flags:
        await database.reports.update_one(
            {"_id": report["_id"]},
            {
                "$set": {
                    "status": "Approved",
                    "cleaning_verified_by_ai": True,
                    "cleaning_verified_at": now,
                    "after_image_hash": after_hash,
                    "ai_decision": "accept",
                    "ai_flags": ai_flags,
                    "reclean_required": False,
                }
            },
        )

        if report.get("assigned_cleaner_id"):
            cleaner_payment = payment_doc_from_create(
                PaymentCreate(
                    report_id=report["_id"],
                    user_id=report["assigned_cleaner_id"],
                    amount=settings.cleaner_payment_amount,
                    payment_type="cleaner_payment",
                )
            )
            cleaner_payment.update({"status": "Issued", "issued_at": now})
            await database.payments.insert_one(cleaner_payment)

        citizen_reward = payment_doc_from_create(
            PaymentCreate(
                report_id=report["_id"],
                user_id=report["citizen_id"],
                amount=settings.citizen_reward_amount,
                payment_type="citizen_reward",
            )
        )
        citizen_reward.update({"status": "Issued", "issued_at": now})
        await database.payments.insert_one(citizen_reward)

        await _create_notification(
            database,
            report["citizen_id"],
            "reward_issued",
            "Reward issued",
            "Your report was verified as cleaned. Reward issued.",
            {"report_id": str(report["_id"]), "amount": settings.citizen_reward_amount},
        )
        if report.get("assigned_cleaner_id"):
            await _create_notification(
                database,
                report["assigned_cleaner_id"],
                "payment_issued",
                "Payment issued",
                "Cleanup verified. Payment issued.",
                {"report_id": str(report["_id"]), "amount": settings.cleaner_payment_amount},
            )

        return await database.reports.find_one({"_id": report["_id"]})

    if ai.get("decision") == "reclean":
        await database.reports.update_one(
            {"_id": report["_id"]},
            {
                "$set": {
                    "status": "Assigned",
                    "ai_decision": "reclean",
                    "ai_flags": ai_flags,
                    "reclean_required": True,
                    "after_image_url": None,
                    "after_image_thumb_url": None,
                    "cleaned_at": None,
                    "after_image_hash": after_hash,
                }
            },
        )

        if report.get("assigned_cleaner_id"):
            await _create_notification(
                database,
                report["assigned_cleaner_id"],
                "reclean_requested",
                "Re-clean requested",
                "AI detected partial cleaning. Please re-clean and upload a new photo.",
                {"report_id": str(report["_id"])},
            )

        return await database.reports.find_one({"_id": report["_id"]})

    new_cleaner = await _select_nearest_cleaner(database, report.get("location", {}), report.get("assigned_cleaner_id"))
    update_fields: dict[str, Any] = {
        "status": "Assigned",
        "ai_decision": "reject",
        "ai_flags": ai_flags,
        "reclean_required": False,
        "after_image_url": None,
        "after_image_thumb_url": None,
        "cleaned_at": None,
        "after_image_hash": after_hash,
    }

    if new_cleaner:
        update_fields.update(
            {
                "assigned_cleaner_id": new_cleaner["_id"],
                "assigned_by_ai": True,
                "assigned_at": now,
            }
        )

    await database.reports.update_one({"_id": report["_id"]}, {"$set": update_fields})

    if report.get("assigned_cleaner_id"):
        await _create_notification(
            database,
            report["assigned_cleaner_id"],
            "task_reassigned",
            "Task reassigned",
            "Cleaning was rejected. Task has been reassigned.",
            {"report_id": str(report["_id"])},
        )

    if new_cleaner:
        await _create_notification(
            database,
            new_cleaner["_id"],
            "task_assigned",
            "New task assigned",
            "A cleanup task has been assigned to you.",
            {"report_id": str(report["_id"]), "priority": report.get("priority")},
        )

    return await database.reports.find_one({"_id": report["_id"]})
