# backend/app/monitoring.py
import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

def init_monitoring():
    dsn = os.getenv("SENTRY_DSN")
    if not dsn:
        print("⚠️  No SENTRY_DSN configured — skipping Sentry")
        return
    sentry_logging = LoggingIntegration(level=None, event_level="ERROR")
    sentry_sdk.init(
        dsn=dsn,
        integrations=[FastApiIntegration(), sentry_logging],
        traces_sample_rate=0.1,
        environment=os.getenv("ENVIRONMENT", "development"),
        release=os.getenv("GIT_SHA", "local")
    )
    print("✅ Sentry initialized")
