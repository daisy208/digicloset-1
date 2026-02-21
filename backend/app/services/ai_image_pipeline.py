import uuid
from PIL import Image, ImageEnhance
from pathlib import Path

UPLOAD_DIR = Path("uploads/ai")

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def remove_background(image_path: Path) -> Path:
    """
    Stub for background removal.
    Replace with: rembg / SAM / commercial API.
    """
    img = Image.open(image_path).convert("RGBA")
    output_path = UPLOAD_DIR / f"{uuid.uuid4()}_bg_removed.png"
    img.save(output_path)
    return output_path


def enhance_image(image_path: Path) -> Path:
    img = Image.open(image_path)
    img = ImageEnhance.Sharpness(img).enhance(1.5)
    img = ImageEnhance.Color(img).enhance(1.2)
    img = ImageEnhance.Brightness(img).enhance(1.1)

    output_path = UPLOAD_DIR / f"{uuid.uuid4()}_enhanced.png"
    img.save(output_path)
    return output_path
