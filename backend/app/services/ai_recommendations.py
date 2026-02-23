from app.services.ai_similarity import image_embedding_stub, find_similar_products

def recommend_products(product, catalog):
    return find_similar_products(image_embedding_stub(product["image"]), catalog)
from app.services.merchant_settings import is_ai_enabled
def generate_recommendations(db, merchant_id: str, input_data):
    if not is_ai_enabled(db, merchant_id):
        return []

    # existing recommendation logic continues here
