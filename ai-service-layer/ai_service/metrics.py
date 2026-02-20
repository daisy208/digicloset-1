from prometheus_client import Counter, Histogram

AI_REQUESTS = Counter("ai_requests_total", "Total AI requests")
AI_ERRORS = Counter("ai_errors_total", "Total AI errors")
AI_LATENCY = Histogram("ai_processing_seconds", "AI processing time")
