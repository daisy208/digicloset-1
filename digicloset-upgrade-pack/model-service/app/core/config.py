
import os
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings

class Settings(BaseSettings):
    # App Config
    APP_NAME: str = "DigiCloset Model Service"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"

    # Inference Strategy
    INFERENCE_PROVIDER: str = os.getenv("INFERENCE_PROVIDER", "local").lower()
    
    # Novita / Cloud Config
    NOVITA_API_KEY: str = os.getenv("NOVITA_API_KEY", "")
    NOVITA_ENDPOINT: str = "https://api.novita.ai/v3/async/txt2img" # Example endpoint, adjust as needed

    # Local Config
    LOCAL_MODEL_ID: str = "runwayml/stable-diffusion-v1-5"
    CONTROLNET_MODEL_ID: str = "lllyasviel/sd-controlnet-openpose"
    DEVICE: str = "cuda" if os.getenv("USE_CUDA", "true").lower() == "true" else "cpu"

    # Generation Defaults
    DEFAULT_RESOLUTION: int = 512
    DEFAULT_STEPS: int = 20
    DEFAULT_GUIDANCE_SCALE: float = 7.5
    DEFAULT_OUTPUTS: int = 1

    # Cost & Governance
    MAX_EXPERIMENT_RUNS: int = 20
    MAX_DEMO_RUNS: int = 30
    COST_LOG_DIR: str = "docs/experiments/cost_logs"

settings = Settings()
