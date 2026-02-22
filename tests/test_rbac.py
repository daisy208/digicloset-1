import os
import tempfile
from app.optimizations.storage import JSONStore
from app.optimizations import rbac


def test_create_and_assign_role():
    s = JSONStore(base_dir=tempfile.mkdtemp())
    # use storage directly for isolated test
    rbac.store = s

    user = rbac.create_user("u-1", "Tester", "t@example.com")
    assert user["user_id"] == "u-1"

    rbac.assign_role("u-1", "store-1", "editor")
    assert s.user_has_role("u-1", "store-1", "editor")

    # ensure listing stores returns store-1
    stores = s.list_user_stores("u-1")
    assert "store-1" in stores
