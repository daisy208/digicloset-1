import io
import time
import requests
import numpy as np
from PIL import Image
from sklearn.cluster import KMeans

from config import MAX_IMAGE_SIZE_MB, MAX_IMAGE_PIXELS


def download_image(url: str) -> bytes:
    response = requests.get(url, timeout=5, stream=True)

    content_length = response.headers.get("Content-Length")
    if content_length and int(content_length) > MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise ValueError("Image too large")

    data = response.content

    if len(data) > MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise ValueError("Image exceeds size limit")

    return data


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Resize for performance
    image.thumbnail((MAX_IMAGE_PIXELS, MAX_IMAGE_PIXELS))

    # Strip metadata automatically handled by re-saving in memory
    image = image.copy()

    return np.array(image)


def extract_dominant_color(image_array: np.ndarray):
    pixels = image_array.reshape(-1, 3)

    # Random sample for performance
    if len(pixels) > 20000:
        indices = np.random.choice(len(pixels), 20000, replace=False)
        pixels = pixels[indices]

    kmeans = KMeans(n_clusters=3, n_init=10)
    kmeans.fit(pixels)

    counts = np.bincount(kmeans.labels_)
    dominant = kmeans.cluster_centers_[counts.argmax()]

    return dominant.astype(int)
