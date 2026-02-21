def detect_image_angle(url: str) -> str:
    for k in ["front", "back", "detail"]:
        if k in url:
            return k
    return "lifestyle"

def missing_angles(existing):
    return list({"front","back","detail"} - set(existing))
