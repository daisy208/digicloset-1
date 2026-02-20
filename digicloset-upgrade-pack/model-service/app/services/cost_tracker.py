
import os
import json
import time
from datetime import datetime
from app.core.config import settings

class CostTracker:
    def __init__(self):
        self.log_dir = settings.COST_LOG_DIR
        os.makedirs(self.log_dir, exist_ok=True)
        self.log_file = os.path.join(self.log_dir, "cost_log.jsonl")

    def log_inference(self, provider: str, model_name: str, resolution: int, steps: int, duration_seconds: float, credits_estimated: float = 0.0):
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "provider": provider,
            "model_name": model_name,
            "resolution": resolution,
            "steps": steps,
            "duration_seconds": duration_seconds,
            "credits_estimated": credits_estimated
        }
        
        with open(self.log_file, "a") as f:
            f.write(json.dumps(entry) + "\n")

    def check_limits(self, run_type: str = "experiment") -> bool:
        # Simple limit check based on log file line count for now
        # In production, this might use a database or Redis 
        try:
            if not os.path.exists(self.log_file):
                return True
                
            with open(self.log_file, "r") as f:
                lines = f.readlines()
            
            # Count runs for the current provider if it's paid
            # Here we just count total lines for simplicity as a placeholder
            if settings.INFERENCE_PROVIDER == "novita":
                 limit = settings.MAX_EXPERIMENT_RUNS if run_type == "experiment" else settings.MAX_DEMO_RUNS
                 # This logic is very basic; a real one would filter by date/type
                 return len(lines) < limit
            
            return True
        except Exception as e:
            print(f"Error checking limits: {e}")
            return True # Fail open to avoid blocking if log read fails

cost_tracker = CostTracker()
