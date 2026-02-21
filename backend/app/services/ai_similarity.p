import numpy as np
from typing import List


def image_embedding_stub(image_url: str) -> np.ndarray:
    """
    Replace later with CLIP / ViT embeddings.
    """
    return np.random.rand(512)


def find_similar_products(
    target_embedding: np.ndarray,
    all_embeddings: List[dict],
    threshold: float = 0.85
):
    results = []
    for item in all_embeddings:
        score = np.dot(target_embedding, item["embedding"])
        if score >= threshold:
            results.append({
                "product_id": item["product_id"],
                "similarity": float(score)
            })
    return results
