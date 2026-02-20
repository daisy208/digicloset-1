import numpy as np


COLOR_MAP = {
    "red": np.array([200, 50, 50]),
    "blue": np.array([50, 50, 200]),
    "green": np.array([50, 200, 50]),
    "black": np.array([30, 30, 30]),
    "white": np.array([220, 220, 220]),
    "yellow": np.array([230, 220, 50]),
}


def normalize_color(rgb):
    rgb = np.array(rgb)

    min_dist = float("inf")
    selected_color = "unknown"

    for name, value in COLOR_MAP.items():
        dist = np.linalg.norm(rgb - value)
        if dist < min_dist:
            min_dist = dist
            selected_color = name

    confidence = max(0.5, 1 - (min_dist / 400))

    return selected_color, round(float(confidence), 2)
