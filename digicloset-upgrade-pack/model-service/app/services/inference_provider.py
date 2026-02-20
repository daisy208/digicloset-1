
import abc
import base64
import httpx
import time
from typing import Optional, Dict, Any, List
# from diffusers import StableDiffusionControlNetPipeline, ControlNetModel, UniPCMultistepScheduler
# import torch
from app.core.config import settings
from app.services.cost_tracker import cost_tracker

class InferenceProvider(abc.ABC):
    @abc.abstractmethod
    async def generate(self, user_image: bytes, garment_image: Optional[bytes] = None, **kwargs) -> Dict[str, Any]:
        pass

class LocalProvider(InferenceProvider):
    def __init__(self):
        self.device = settings.DEVICE
        self.model_id = settings.LOCAL_MODEL_ID
        self.controlnet_id = settings.CONTROLNET_MODEL_ID
        # Lazy loading to save resources if not used
        self.pipe = None 

    def load_model(self):
        import torch
        from diffusers import StableDiffusionControlNetPipeline, ControlNetModel, UniPCMultistepScheduler
        
        if self.pipe is None:
            print("Loading Local Models into Memory (This may take a while)...")
            controlnet = ControlNetModel.from_pretrained(
                self.controlnet_id, 
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32
            )
            pipe = StableDiffusionControlNetPipeline.from_pretrained(
                self.model_id, 
                controlnet=controlnet, 
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                safety_checker=None
            )
            pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config)
            
            if self.device == "cuda":
                pipe.enable_model_cpu_offload() # Helps with VRAM
            # Otherwise use to(self.device) if not offloading
            self.pipe = pipe

    async def generate(self, user_image: bytes, garment_image: Optional[bytes] = None, **kwargs) -> Dict[str, Any]:
        start_time = time.time()
        import torch
        from PIL import Image
        import io
        
        # 1. Load the model lazy
        self.load_model()
        
        # 2. Process image input (ControlNet needs a pose image)
        # Note: in a pure implementation, you'd extract the pose first. 
        # For simplicity, we feed the raw image as the control condition (which works for some tasks, or assumes pre-processed)
        init_image = Image.open(io.BytesIO(user_image)).convert("RGB")
        init_image = init_image.resize((settings.DEFAULT_RESOLUTION, settings.DEFAULT_RESOLUTION))

        prompt = "A person wearing a virtual try on garment, high quality, highly detailed"
        negative_prompt = "low quality, bad anatomy, bad hands, text, missing fingers"

        # 3. Generate
        print(f"Running local generation on {self.device}...")
        
        # PyTorch needs to run in a thread or synchronous for standard generate calls 
        # diffusers pipelines are synchronous. For true async we should run in threadpool, 
        # but for this script blocking is fine.
        result = self.pipe(
            prompt,
            init_image,
            negative_prompt=negative_prompt,
            num_inference_steps=settings.DEFAULT_STEPS,
            generator=torch.manual_seed(42),
        ).images[0]
        
        # 4. Convert back to bytes
        img_byte_arr = io.BytesIO()
        result.save(img_byte_arr, format='PNG')
        result_bytes = img_byte_arr.getvalue()
        
        duration = time.time() - start_time
        cost_tracker.log_inference("local", self.model_id, settings.DEFAULT_RESOLUTION, settings.DEFAULT_STEPS, duration, 0.0)
        
        return {
            "provider": "local",
            "model": self.model_id,
            "status": "success",
            "image_bytes": result_bytes, 
            "message": "Local inference completed"
        }

class NovitaProvider(InferenceProvider):
    def __init__(self):
        self.api_key = settings.NOVITA_API_KEY
        self.submit_endpoint = "https://api.novita.ai/v3/async/img2img"
        self.poll_endpoint = "https://api.novita.ai/v3/async/task-result"
        self.model_name = "dreamshaper_8_93665.safetensors" # Fallback/Fast model name for Novita, replace with turbo if available
        self.timeout = 180 # 3 minutes max

    async def generate(self, user_image: bytes, garment_image: Optional[bytes] = None, **kwargs) -> Dict[str, Any]:
        start_time = time.time()
        if not self.api_key:
             raise ValueError("Novita API key not configured")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        user_image_b64 = base64.b64encode(user_image).decode('utf-8')

        payload = {
            "model_name": self.model_name,
            "image_base64": user_image_b64,
            "prompt": "A person wearing a virtual try on garment, high quality, highly detailed",
            "negative_prompt": "low quality, bad anatomy, bad hands, text, missing fingers",
            "steps": settings.DEFAULT_STEPS,
            "width": settings.DEFAULT_RESOLUTION,
            "height": settings.DEFAULT_RESOLUTION,
            "guidance_scale": settings.DEFAULT_GUIDANCE_SCALE
        }

        async with httpx.AsyncClient() as client:
            # 1. Submit Task
            response = await client.post(self.submit_endpoint, json=payload, headers=headers)
            response.raise_for_status()
            res_data = response.json()
            task_id = res_data.get("task_id")
            
            if not task_id:
                raise RuntimeError(f"Failed to get task_id from Novita: {res_data}")

            # 2. Poll Task Result
            while time.time() - start_time < self.timeout:
                poll_resp = await client.get(f"{self.poll_endpoint}?task_id={task_id}", headers=headers)
                poll_resp.raise_for_status()
                poll_data = poll_resp.json()
                
                status = poll_data.get("task", {}).get("status")
                if status == "TASK_STATUS_SUCCEED":
                    images = poll_data.get("images", [])
                    if images:
                        image_url = images[0].get("image_url")
                        # Download the final image
                        img_resp = await client.get(image_url)
                        img_resp.raise_for_status()
                        result_image_bytes = img_resp.content
                        cost_tracker.log_inference("novita", self.model_name, settings.DEFAULT_RESOLUTION, settings.DEFAULT_STEPS, time.time() - start_time, 1.0)
                        return {
                            "provider": "novita",
                            "model": self.model_name,
                            "status": "success",
                            "image_bytes": result_image_bytes,
                            "message": "Generated successfully"
                        }
                    else:
                        raise RuntimeError("Task succeeded but no image returned")
                elif status in ["TASK_STATUS_FAILED", "TASK_STATUS_CANCELED"]:
                    raise RuntimeError(f"Task failed or canceled: {poll_data}")
                
                await asyncio.sleep(2)
            
            raise TimeoutError("Novita inference polling timed out")

class ProviderFactory:
    @staticmethod
    def get_provider() -> InferenceProvider:
        provider_name = settings.INFERENCE_PROVIDER
        
        if provider_name == "novita":
            try:
                if not cost_tracker.check_limits("experiment"):
                    print("Novita limits reached, falling back to local.")
                    return LocalProvider()
                return NovitaProvider()
            except Exception as e:
                print(f"Failed to initialize Novita provider: {e}. Falling back to local.")
                return LocalProvider()
        
        return LocalProvider()

provider_factory = ProviderFactory()
