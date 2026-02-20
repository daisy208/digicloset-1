
import unittest
import sys
import os
import json
from unittest.mock import MagicMock, patch

# Add parent dir to path to import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.config import settings
from app.services.cost_tracker import CostTracker
from app.services.inference_provider import ProviderFactory, LocalProvider, NovitaProvider
from app.evaluation.harness import EvaluationHarness

class TestGovernance(unittest.TestCase):
    def setUp(self):
        # Temp dir for logs
        self.test_log_dir = "tests/temp_logs"
        os.makedirs(self.test_log_dir, exist_ok=True)
        settings.COST_LOG_DIR = self.test_log_dir

    def test_cost_tracker_limits(self):
        tracker = CostTracker()
        tracker.log_file = os.path.join(self.test_log_dir, "test_cost_log.jsonl")
        
        # Write dummy logs to hit limit
        limit = settings.MAX_EXPERIMENT_RUNS
        with open(tracker.log_file, "w") as f:
            for _ in range(limit + 1):
                f.write('{"timestamp": "..."}\n')
        
        # Should return False because we are over the limit
        # BUT only if provider is Novita. 
        settings.INFERENCE_PROVIDER = "novita"
        self.assertFalse(tracker.check_limits("experiment"))
        
        settings.INFERENCE_PROVIDER = "local"
        self.assertTrue(tracker.check_limits("experiment"))

    @patch("app.services.inference_provider.cost_tracker")
    def test_provider_fallback(self, mock_tracker):
            # Case 1: Novita with limits ok -> NovitaProvider
            settings.INFERENCE_PROVIDER = "novita"
            mock_tracker.check_limits.return_value = True
            provider = ProviderFactory.get_provider()
            self.assertIsInstance(provider, NovitaProvider)

            # Case 2: Novita with limits reached -> LocalProvider
            mock_tracker.check_limits.return_value = False
            provider = ProviderFactory.get_provider()
            self.assertIsInstance(provider, LocalProvider)
            
            # Case 3: Local -> LocalProvider
            settings.INFERENCE_PROVIDER = "local"
            provider = ProviderFactory.get_provider()
            self.assertIsInstance(provider, LocalProvider)

    def test_evaluation_metric_structure(self):
        harness = EvaluationHarness()
        # Mock images
        import numpy as np
        img1 = np.zeros((100, 100, 3), dtype=np.uint8)
        img2 = np.zeros((100, 100, 3), dtype=np.uint8)
        
        # Test SSIM (should be 1.0 for identical images)
        score = harness.compute_ssim(img1, img2)
        self.assertEqual(score, 1.0)
        
        # Test Keypoint (YOLOv8 returns inf for completely blank images with no people)
        kp_score = harness.compute_keypoint_deviation(img1, img2)
        self.assertEqual(kp_score, float('inf'))

    def tearDown(self):
        import shutil
        if os.path.exists(self.test_log_dir):
            shutil.rmtree(self.test_log_dir)

if __name__ == '__main__':
    unittest.main()
