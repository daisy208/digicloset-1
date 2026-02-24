import asyncio
import pytest

from app.services.billing_service import InMemoryStore, BillingService
from app.models.billing import SubscriptionRecord


def run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


def test_trial_active_access():
    store = InMemoryStore()
    shop = "a.myshopify.com"
    # create trial subscription
    rec = SubscriptionRecord(shop_domain=shop, status="pending", trial_ends_at=None)
    # set trial to future
    from datetime import datetime, timedelta

    rec.trial_ends_at = datetime.utcnow() + timedelta(days=3)
    run(store.save_subscription(rec))

    svc = BillingService(shop, "", store)
    assert run(svc.is_active_or_in_trial()) is True


def test_inactive_subscription_blocked():
    store = InMemoryStore()
    shop = "b.myshopify.com"
    svc = BillingService(shop, "", store)
    assert run(svc.is_active_or_in_trial()) is False


def test_limit_exceeded_case():
    store = InMemoryStore()
    shop = "c.myshopify.com"
    svc = BillingService(shop, "", store)
    # increment to just below limit
    run(svc.increment_usage(ai_calls=500))
    usage = run(store.get_usage(shop))
    assert usage.ai_calls_this_month == 500

    # further increments exceed limit
    run(svc.increment_usage(ai_calls=1))
    usage = run(store.get_usage(shop))
    assert usage.ai_calls_this_month == 501


def test_activate_and_cancel_flow():
    store = InMemoryStore()
    shop = "d.myshopify.com"
    svc = BillingService(shop, "", store)
    # activate
    rec = run(svc.activate_charge("ch_123"))
    assert rec.status == "active"
    # cancel
    run(svc.cancel_subscription())
    rec2 = run(store.get_subscription(shop))
    assert rec2.status == "cancelled"


def test_increment_atomicity():
    store = InMemoryStore()
    shop = "e.myshopify.com"
    svc = BillingService(shop, "", store)

    async def worker(n):
        await svc.increment_usage(ai_calls=1)

    run(asyncio.gather(*(worker(i) for i in range(20))))
    usage = run(store.get_usage(shop))
    assert usage.ai_calls_this_month == 20
