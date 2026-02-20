
import torch
import os
import sys

def check_gpu():
    print("Checking GPU compatibility...")
    if not torch.cuda.is_available():
        print("WARNING: CUDA is not available. Local inference will run on CPU (very slow).")
        return False
    
    device_capability = torch.cuda.get_device_capability()
    print(f"CUDA Device Detected: {torch.cuda.get_device_name(0)}")
    print(f"Compute Capability: {device_capability}")
    
    # Check for fp16 support (roughly 7.0+ recommended for efficient fp16)
    if device_capability[0] >= 7:
        print("SUCCESS: Device supports float16 precision.")
        return True
    else:
        print("WARNING: Device may not efficiently support float16. Fallback to float32 recommended.")
        return False

def download_models():
    print("\nAutomating Model Download...")
    try:
        from diffusers import StableDiffusionControlNetPipeline, ControlNetModel
    except ImportError:
        print("ERROR: diffusers not installed. Run 'pip install -r requirements.txt' first.")
        sys.exit(1)

    # Models to download
    sd_model_id = "runwayml/stable-diffusion-v1-5"
    controlnet_id = "lllyasviel/sd-controlnet-openpose"
    
    print(f"Downloading ControlNet: {controlnet_id}...")
    ControlNetModel.from_pretrained(controlnet_id, torch_dtype=torch.float16)
    
    print(f"Downloading Stable Diffusion: {sd_model_id}...")
    StableDiffusionControlNetPipeline.from_pretrained(
        sd_model_id, 
        controlnet=ControlNetModel.from_pretrained(controlnet_id, torch_dtype=torch.float16),
        torch_dtype=torch.float16
    )
    
    print("\nSUCCESS: All models downloaded and cached.")

if __name__ == "__main__":
    supports_fp16 = check_gpu()
    download_models()
