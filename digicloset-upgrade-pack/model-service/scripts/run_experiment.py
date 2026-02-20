
import os
import sys
import asyncio
import cv2
import numpy as np

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.services.inference_provider import ProviderFactory
from app.evaluation.harness import evaluation_harness

async def run_experiment():
    # Setup test images
    test_img_path = "test_input.jpg"
    if not os.path.exists(test_img_path):
        # Create a dummy image for testing
        dummy_img = np.zeros((512, 512, 3), dtype=np.uint8)
        cv2.imwrite(test_img_path, dummy_img)
    
    with open(test_img_path, "rb") as f:
        user_bytes = f.read()

    provider = ProviderFactory.get_provider()
    print(f"Running experiment with provider: {settings.INFERENCE_PROVIDER} (Resolved to {provider.__class__.__name__})")

    # Generate
    result = await provider.generate(
        user_image=user_bytes, 
        steps=settings.DEFAULT_STEPS,
        resolution=settings.DEFAULT_RESOLUTION
    )
    
    print(f"Generation result: {result}")

    # For the stub, we just pretend the input is the output to get a score
    orig_img = cv2.imread(test_img_path)
    gen_img = orig_img.copy() # Mock generated image
    
    # Calculate metrics
    ssim_score = evaluation_harness.compute_ssim(orig_img, gen_img)
    kp_dev = evaluation_harness.compute_keypoint_deviation(orig_img, gen_img)
    
    metrics = {
        "ssim": ssim_score,
        "keypoint_deviation": kp_dev
    }
    
    print(f"Metrics: {metrics}")
    
    # Log
    evaluation_harness.log_experiment(
        model_name=result.get("model", "unknown"),
        provider=result.get("provider", "unknown"),
        params={"steps": settings.DEFAULT_STEPS, "resolution": settings.DEFAULT_RESOLUTION},
        metrics=metrics,
        output_path="mock_output.jpg"
    )
    print("Experiment logged successfully.")

if __name__ == "__main__":
    asyncio.run(run_experiment())
