from datetime import datetime

def log_recommendation_impression(merchant_id, recommendation_id):
    return {
        "event": "recommendation_impression",
        "merchant_id": merchant_id,
        "recommendation_id": recommendation_id,
        "timestamp": datetime.utcnow().isoformat()
    }
