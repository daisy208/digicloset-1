from PIL import Image
from pathlib import Path
import uuid

OUT = Path("uploads/marketing")
OUT.mkdir(parents=True, exist_ok=True)

def generate_marketing_variant(path, preset):
    img = Image.open(path)
    out = OUT / f"{uuid.uuid4()}_marketing.png"
    img.save(out)
    return out
