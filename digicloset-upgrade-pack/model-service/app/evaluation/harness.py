
import json
import os
import numpy as np
import cv2
from datetime import datetime
from typing import Dict, Any, List
from skimage.metrics import structural_similarity as ssim
import mediapipe as mp

# Placeholder for real pose estimation library
# from controlnet_aux import OpenposeDetector 

class EvaluationHarness:
    def __init__(self):
        self.results_dir = "docs/experiments"
        os.makedirs(self.results_dir, exist_ok=True)
        self.results_file = os.path.join(self.results_dir, "experiment_results.json")

    def compute_ssim(self, image1: np.ndarray, image2: np.ndarray) -> float:
        # Convert to grayscale
        gray1 = cv2.cvtColor(image1, cv2.COLOR_BGR2GRAY)
        gray2 = cv2.cvtColor(image2, cv2.COLOR_BGR2GRAY)
        
        # Resize to match if needed
        if gray1.shape != gray2.shape:
             gray2 = cv2.resize(gray2, (gray1.shape[1], gray1.shape[0]))

        score, _ = ssim(gray1, gray2, full=True)
        return float(score)

    def compute_keypoint_deviation(self, original_image: np.ndarray, generated_image: np.ndarray) -> float:
        try:
            from ultralytics import YOLO
            import sys
            import os

            # Suppress ultralytics output to keep console clean
            old_stdout = sys.stdout
            sys.stdout = open(os.devnull, 'w')
            try:
                # yolov8n-pose.pt will be downloaded automatically if not present
                model = YOLO('yolov8n-pose.pt')
                res1 = model(original_image, verbose=False)
                res2 = model(generated_image, verbose=False)
            finally:
                sys.stdout.close()
                sys.stdout = old_stdout

            def extract_kps(res):
                if not res or len(res) == 0 or not res[0].keypoints or res[0].keypoints.xy.shape[0] == 0:
                    return None
                kps = res[0].keypoints.xy[0].cpu().numpy()
                if np.all(kps == 0):
                    return None
                return kps

            kps1 = extract_kps(res1)
            kps2 = extract_kps(res2)

            if kps1 is None or len(kps1) == 0 or kps2 is None or len(kps2) == 0:
                return float('inf')

            # Ensure same number of keypoints (usually 17 for YOLO pose)
            min_len = min(len(kps1), len(kps2))
            
            distances = []
            for i in range(min_len):
                # Filter out [0,0] keypoints which mean "not detected" by YOLO
                if not (np.all(kps1[i] == 0) or np.all(kps2[i] == 0)):
                    distances.append(np.linalg.norm(kps1[i] - kps2[i]))

            if not distances:
                return float('inf')

            return float(np.mean(distances))
        except Exception as e:
            print(f"ML Keypoint Deviation calculation failed: {e}")
            return float('inf')

    def log_experiment(self, 
                       model_name: str, 
                       provider: str,
                       params: Dict[str, Any], 
                       metrics: Dict[str, float],
                       output_path: str):
        
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "model_name": model_name,
            "provider": provider,
            "parameters": params,
            "metrics": metrics,
            "output_path": output_path
        }
        
        # Append to JSON list (inefficient for huge files, but fine for experiments)
        data = []
        if os.path.exists(self.results_file):
            try:
                with open(self.results_file, "r") as f:
                    data = json.load(f)
            except json.JSONDecodeError:
                pass
        
        data.append(entry)
        
        with open(self.results_file, "w") as f:
            json.dump(data, f, indent=2)

evaluation_harness = EvaluationHarness()
