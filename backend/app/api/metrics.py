@router.get("/metrics/summary")
def metrics_summary(merchant_id: str):
    return {
        "bundle_impressions": 1240,
        "bundle_conversions": 96,
        "estimated_aov_lift": "7.2%"
    }
