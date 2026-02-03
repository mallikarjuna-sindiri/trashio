from __future__ import annotations

from bson import ObjectId


async def select_available_cleaner(database, exclude_cleaner_id: ObjectId | None = None) -> ObjectId | None:
    query = {"role": "cleaner", "is_active": True}
    if exclude_cleaner_id:
        query["_id"] = {"$ne": exclude_cleaner_id}

    cleaners = await database.users.find(query).to_list(length=500)
    if not cleaners:
        return None

    cleaner_ids = [c["_id"] for c in cleaners]
    workload = {
        cid: await database.reports.count_documents({
            "assigned_cleaner_id": cid,
            "status": {"$in": ["Assigned", "Cleaned"]},
        })
        for cid in cleaner_ids
    }

    return min(cleaner_ids, key=lambda cid: (workload.get(cid, 0), str(cid)))
