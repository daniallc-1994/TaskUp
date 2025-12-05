import os
from typing import Any, Dict, Optional, List
from uuid import uuid4
from supabase import create_client, Client

_service_client: Optional[Client] = None
_anon_key = os.getenv("SUPABASE_ANON_KEY")
_url = os.getenv("SUPABASE_URL")
_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# In-memory fallback for offline/local dev to keep flows working without Supabase.
_mem: Dict[str, List[Dict[str, Any]]] = {
    "user_profiles": [],
    "tasks": [],
    "offers": [],
    "messages": [],
    "payments": [],
    "disputes": [],
    "notifications": [],
    "admin_logs": [],
    "device_fingerprints": [],
}


def _client(jwt: Optional[str] = None) -> Optional[Client]:
    """
    Returns a Supabase client. If jwt provided, it will use anon key (preferred)
    and attach the JWT for RLS. Otherwise the service role key is used.
    """
    global _service_client
    if jwt:
        if not _url or not (_anon_key or _service_key):
            return None
        client = create_client(_url, _anon_key or _service_key)
        client.postgrest.auth(jwt)
        return client

    if _service_client:
        return _service_client
    if not _url or not _service_key:
        return None
    _service_client = create_client(_url, _service_key)
    return _service_client


def _mem_select(table: str, filters: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
    rows = _mem.get(table, [])
    if not filters:
        return list(rows)
    return [r for r in rows if all(r.get(k) == v for k, v in filters.items())]


def _mem_insert(table: str, data: Dict[str, Any]) -> Dict[str, Any]:
    table_rows = _mem.setdefault(table, [])
    row = data.copy()
    if "id" not in row:
        row["id"] = str(uuid4())
    table_rows.append(row)
    return row


def _mem_update(table: str, filters: Dict[str, Any], data: Dict[str, Any]) -> List[Dict[str, Any]]:
    rows = _mem.get(table, [])
    updated: List[Dict[str, Any]] = []
    for idx, r in enumerate(rows):
        if all(r.get(k) == v for k, v in filters.items()):
            rows[idx] = {**r, **data}
            updated.append(rows[idx])
    return updated


def _mem_delete(table: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    rows = _mem.get(table, [])
    remaining = []
    removed = []
    for r in rows:
        if all(r.get(k) == v for k, v in filters.items()):
            removed.append(r)
        else:
            remaining.append(r)
    _mem[table] = remaining
    return removed


def insert(table: str, data: Dict[str, Any], jwt: Optional[str] = None) -> Any:
    client = _client(jwt)
    if not client:
        return [_mem_insert(table, data)]
    res = client.table(table).insert(data).execute()
    return res.data


def select(table: str, filters: Dict[str, Any] | None = None, jwt: Optional[str] = None) -> List[Dict[str, Any]]:
    client = _client(jwt)
    if not client:
        return _mem_select(table, filters)
    query = client.table(table).select("*")
    if filters:
        for k, v in filters.items():
            query = query.eq(k, v)
    res = query.execute()
    return res.data or []


def update(table: str, filters: Dict[str, Any], data: Dict[str, Any], jwt: Optional[str] = None) -> List[Dict[str, Any]]:
    client = _client(jwt)
    if not client:
        return _mem_update(table, filters, data)
    query = client.table(table).update(data)
    for k, v in filters.items():
        query = query.eq(k, v)
    res = query.execute()
    return res.data or []


def delete(table: str, filters: Dict[str, Any], jwt: Optional[str] = None) -> List[Dict[str, Any]]:
    client = _client(jwt)
    if not client:
        return _mem_delete(table, filters)
    query = client.table(table).delete()
    for k, v in filters.items():
        query = query.eq(k, v)
    res = query.execute()
    return res.data or []


# Convenience helpers


def get_user_by_email(email: str, jwt: Optional[str] = None) -> Optional[Dict[str, Any]]:
    users = select("user_profiles", {"email": email.lower()}, jwt=jwt)
    return users[0] if users else None


def get_user_by_id(user_id: str, jwt: Optional[str] = None) -> Optional[Dict[str, Any]]:
    users = select("user_profiles", {"id": user_id}, jwt=jwt)
    return users[0] if users else None


def create_user_profile(payload: Dict[str, Any], jwt: Optional[str] = None) -> Optional[Dict[str, Any]]:
    data = insert("user_profiles", payload, jwt=jwt)
    return data[0] if data else None


def log_device_fingerprint(user_id: str, ip: str, fingerprint: Optional[str] = None):
    payload = {"user_id": user_id, "ip_address": ip, "fingerprint": fingerprint or f"ip:{ip}"}
    insert("device_fingerprints", payload)


def log_admin_action(admin_id: str, action: str, entity: str, entity_id: Optional[str], metadata: Optional[Dict[str, Any]] = None):
    insert(
        "admin_logs",
        {
            "admin_id": admin_id,
            "action": action,
            "entity": entity,
            "entity_id": entity_id,
            "metadata": metadata or {},
        },
    )


def create_task(payload: Dict[str, Any], jwt: Optional[str] = None) -> Optional[Dict[str, Any]]:
    data = insert("tasks", payload, jwt=jwt)
    return data[0] if data else None


def get_task(task_id: str, jwt: Optional[str] = None) -> Optional[Dict[str, Any]]:
    tasks = select("tasks", {"id": task_id}, jwt=jwt)
    return tasks[0] if tasks else None


def list_tasks_for_user(user_id: str, role: str, jwt: Optional[str] = None) -> List[Dict[str, Any]]:
    client = _client(jwt)
    if not client:
        if role == "tasker":
            return [t for t in _mem_select("tasks") if t.get("status") not in ("completed", "payment_released")]
        return _mem_select("tasks", {"client_id": user_id})

    query = client.table("tasks").select("*")
    if role == "tasker":
        query = query.neq("status", "completed")
    else:
        query = query.eq("client_id", user_id)
    res = query.execute()
    return res.data or []


def update_task_status(task_id: str, status: str, jwt: Optional[str] = None) -> Optional[Dict[str, Any]]:
    updated = update("tasks", {"id": task_id}, {"status": status}, jwt=jwt)
    return updated[0] if updated else None


def create_offer(payload: Dict[str, Any], jwt: Optional[str] = None) -> Optional[Dict[str, Any]]:
    data = insert("offers", payload, jwt=jwt)
    return data[0] if data else None


def list_offers_for_task(task_id: str, jwt: Optional[str] = None) -> List[Dict[str, Any]]:
    return select("offers", {"task_id": task_id}, jwt=jwt)


def list_offers_for_user(user_id: str, role: str, jwt: Optional[str] = None) -> List[Dict[str, Any]]:
    if role == "tasker":
        return select("offers", {"tasker_id": user_id}, jwt=jwt)
    return select("offers", {}, jwt=jwt)


def set_offer_status(offer_id: str, status: str, jwt: Optional[str] = None) -> Optional[Dict[str, Any]]:
    updated = update("offers", {"id": offer_id}, {"status": status}, jwt=jwt)
    return updated[0] if updated else None


def create_message(payload: Dict[str, Any], jwt: Optional[str] = None) -> Optional[Dict[str, Any]]:
    data = insert("messages", payload, jwt=jwt)
    return data[0] if data else None


def list_messages(task_id: str, jwt: Optional[str] = None) -> List[Dict[str, Any]]:
    return select("messages", {"task_id": task_id}, jwt=jwt)


def create_payment(payload: Dict[str, Any], jwt: Optional[str] = None) -> Optional[Dict[str, Any]]:
    data = insert("payments", payload, jwt=jwt)
    return data[0] if data else None


def get_payment(payment_id: str, jwt: Optional[str] = None) -> Optional[Dict[str, Any]]:
    payments = select("payments", {"id": payment_id}, jwt=jwt)
    return payments[0] if payments else None


def update_payment(payment_id: str, data: Dict[str, Any], jwt: Optional[str] = None) -> Optional[Dict[str, Any]]:
    updated = update("payments", {"id": payment_id}, data, jwt=jwt)
    return updated[0] if updated else None


def open_dispute(payload: Dict[str, Any], jwt: Optional[str] = None) -> Optional[Dict[str, Any]]:
    data = insert("disputes", payload, jwt=jwt)
    return data[0] if data else None


def update_dispute(dispute_id: str, data: Dict[str, Any], jwt: Optional[str] = None) -> Optional[Dict[str, Any]]:
    updated = update("disputes", {"id": dispute_id}, data, jwt=jwt)
    return updated[0] if updated else None


def list_disputes_for_user(user_id: str, role: str, jwt: Optional[str] = None) -> List[Dict[str, Any]]:
    if role in {"admin", "support", "moderator"}:
        return select("disputes", {}, jwt=jwt)
    return select("disputes", {"opened_by": user_id}, jwt=jwt)


def record_notification(user_id: str, type_: str, payload: Dict[str, Any]):
    insert("notifications", {"user_id": user_id, "type": type_, "payload": payload})
