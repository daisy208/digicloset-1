from inference_service.main import app, health as health_check  # re-export for compatibility
def train_on_merchant_data(data, allow_training: bool = False):
    if not allow_training:
        return None

    # existing training logic
