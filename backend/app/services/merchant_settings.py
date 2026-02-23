from app.models.merchant_settings import MerchantSettings

def is_ai_enabled(db, merchant_id: str) -> bool:
    record = db.get(MerchantSettings, merchant_id)
    return record.ai_enabled if record else True
