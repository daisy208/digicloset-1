import numpy as np

def image_embedding_stub(_):
    return np.random.rand(512)

def find_similar_products(target, all_embeddings, threshold=0.85):
    return [
        {"product_id": e["product_id"], "score": float(np.dot(target, e["embedding"]))}
        for e in all_embeddings
        if np.dot(target, e["embedding"]) >= threshold
    ]
