import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "assuredhr")

client = AsyncIOMotorClient(MONGO_URL)
db: AsyncIOMotorDatabase = client[DB_NAME]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def find_many(collection: str, query: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    docs = await db[collection].find(query or {}).to_list(length=5000)
    for doc in docs:
        doc["id"] = str(doc.pop("_id"))
    return docs


async def find_one(collection: str, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    doc = await db[collection].find_one(query)
    if not doc:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc


async def insert_one(collection: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    payload = {**payload, "created_at": now_iso(), "updated_at": now_iso()}
    result = await db[collection].insert_one(payload)
    created = await db[collection].find_one({"_id": result.inserted_id})
    created["id"] = str(created.pop("_id"))
    return created


async def update_one(collection: str, doc_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    from bson import ObjectId

    try:
        object_id = ObjectId(doc_id)
    except Exception:
        return None

    payload = {**payload, "updated_at": now_iso()}
    await db[collection].update_one({"_id": object_id}, {"$set": payload})
    doc = await db[collection].find_one({"_id": object_id})
    if not doc:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc
