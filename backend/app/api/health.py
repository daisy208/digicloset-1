@router.get("/health")
def health():
    return {
        "status": "ok",
        "ai_recommendations_enabled": True
    }
