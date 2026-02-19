import json
from app.models.feedback import OutfitFeedback

FEEDBACK_FILE = "feedback_log.jsonl"

def save_feedback(feedback: OutfitFeedback):
    with open(FEEDBACK_FILE, "a") as f:
        f.write(feedback.json() + "\n")