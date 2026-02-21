from fastapi import APIRouter, UploadFile, File
from pathlib import Path

from app.services.ai_image_pipeline import remove_background, enhance_image
from app.services.ai_text_generation import generate_alt_text, generate_tags_and_attributes
from app.services.shopify_metafields import write_metafields
from app.schemas.ai_results import AIImageResult

router = APIRouter(prefix="/ai/products", tags=["AI Products"])


@router.post("/{product_id}/analyze", response_model=AIImageResult)
async def analyze_product_image(
    product_id: str,
    shop: str,
    access_token: str,
    product_title: str,
    image: UploadFile = File(...)
):
    temp_path = Path(f"/tmp/{image.filename}")
    temp_path.write_bytes(await image.read())

    bg_removed = remove_background(temp_path)
    enhanced = enhance_image(bg_removed)

    alt_text = generate_alt_text(product_title)
    tags, attributes = generate_tags_and_attributes(product_title)

    write_metafields(
        shop,
        access_token,
        product_id,
        {
            "alt_text": alt_text,
            "tags": tags,
            "attributes": attributes,
            "enhanced_image": str(enhanced)
        }
    )

    return AIImageResult(
        background_removed_url=str(bg_removed),
        enhanced_image_url=str(enhanced),
        alt_text=alt_text,
        tags=tags,
        attributes=attributes
    )
