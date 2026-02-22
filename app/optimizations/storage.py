import json
import os
from typing import Any, Dict, List, Optional

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "optimizations")


def _ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


class JSONStore:
    def __init__(self, base_dir: Optional[str] = None):
        self.base = base_dir or DATA_DIR
        _ensure_dir(self.base)

    def _path(self, name: str) -> str:
        _ensure_dir(self.base)
        return os.path.join(self.base, f"{name}.json")

    def save_record(self, record: Any):
        path = self._path("records")
        arr = self._read(path)
        arr.append(self._to_dict(record))
        self._write(path, arr)

    def list_records_for_product(self, product_id: str) -> List[Dict]:
        arr = self._read(self._path("records"))
        return [r for r in arr if r.get("product_id") == product_id]

    def save_snapshot(self, snapshot: Any):
        path = self._path("snapshots")
        arr = self._read(path)
        arr.append(self._to_dict(snapshot))
        self._write(path, arr)

    def get_snapshot(self, snapshot_id: str) -> Optional[Dict]:
        arr = self._read(self._path("snapshots"))
        for s in arr:
            if s.get("snapshot_id") == snapshot_id:
                return s
        return None

    def save_abtest(self, test: Any):
        path = self._path("abtests")
        arr = self._read(path)
        arr.append(self._to_dict(test))
        self._write(path, arr)

    def list_abtests(self) -> List[Dict]:
        return self._read(self._path("abtests"))

    def save_alert(self, store_id: str, condition: Dict, channels: List[str]) -> str:
        path = self._path("alerts")
        arr = self._read(path)
        alert = {"id": f"alert-{len(arr)+1}", "store_id": store_id, "condition": condition, "channels": channels}
        arr.append(alert)
        self._write(path, arr)
        return alert["id"]

    def _to_dict(self, obj: Any) -> Dict:
        if hasattr(obj, "__dict__"):
            d = obj.__dict__.copy()
            # convert datetimes if present
            for k, v in d.items():
                try:
                    import datetime

                    if isinstance(v, datetime.datetime):
                        d[k] = v.isoformat()
                except Exception:
                    pass
            return d
        return dict(obj)

    def log_ai_feedback(self, product_id: str, feedback: Dict):
        path = self._path("ai_feedback")
        arr = self._read(path)
        arr.append({"product_id": product_id, "feedback": feedback})
        self._write(path, arr)

    def get_store_memory(self, store_id: str) -> Dict:
        arr = self._read(self._path("store_memory"))
        for s in arr:
            if s.get("store_id") == store_id:
                return s
        # default memory
        return {"store_id": store_id, "embeddings_uri": None, "last_updated": None, "notes": []}

    def save_store_memory(self, memory: Dict):
        path = self._path("store_memory")
        arr = self._read(path)
        # simple replace if exists
        arr = [m for m in arr if m.get("store_id") != memory.get("store_id")]
        arr.append(memory)
        self._write(path, arr)

    # --- Multi-store and RBAC helpers
    def save_store(self, store: Dict):
        path = self._path("stores")
        arr = self._read(path)
        arr = [s for s in arr if s.get("store_id") != store.get("store_id")]
        arr.append(store)
        self._write(path, arr)

    def get_store(self, store_id: str) -> Optional[Dict]:
        arr = self._read(self._path("stores"))
        for s in arr:
            if s.get("store_id") == store_id:
                return s
        return None

    def list_stores(self) -> List[Dict]:
        return self._read(self._path("stores"))

    def save_user(self, user: Dict):
        path = self._path("users")
        arr = self._read(path)
        # users identified by api_key
        arr = [u for u in arr if u.get("api_key") != user.get("api_key")]
        arr.append(user)
        self._write(path, arr)

    def get_user_by_api_key(self, api_key: str) -> Optional[Dict]:
        arr = self._read(self._path("users"))
        for u in arr:
            if u.get("api_key") == api_key:
                return u
        return None

    def list_users(self) -> List[Dict]:
        return self._read(self._path("users"))

    # --- AI credit usage tracking
    def log_ai_credit_usage(self, store_id: str, credits: float, reason: str = ""):
        path = self._path("ai_credits")
        arr = self._read(path)
        arr.append({"store_id": store_id, "credits": credits, "reason": reason})
        self._write(path, arr)

    def summarize_ai_credits(self) -> Dict[str, float]:
        arr = self._read(self._path("ai_credits"))
        summary: Dict[str, float] = {}
        for e in arr:
            sid = e.get("store_id")
            summary[sid] = summary.get(sid, 0.0) + float(e.get("credits", 0.0))
        return summary

    def _read(self, path: str) -> List[Any]:
        try:
            with open(path, "r") as f:
                return json.load(f)
        except FileNotFoundError:
            return []
        except json.JSONDecodeError:
            return []

    def _write(self, path: str, arr: List[Any]):
        with open(path, "w") as f:
            json.dump(arr, f, indent=2)
