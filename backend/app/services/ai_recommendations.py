from app.services.ai_similarity import image_embedding_stub, find_similar_products

def recommend_products(product, catalog):
    return find_similar_products(image_embedding_stub(product["image"]), catalog)
