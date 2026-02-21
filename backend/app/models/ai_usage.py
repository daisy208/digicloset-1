from datetime import datetime

class AIUsage:
    def __init__(self):
        self.scans = 0
        self.credits_used = 0
        self.history = []

    def record(self, action: str, cost: int):
        self.scans += 1
        self.credits_used += cost
        self.history.append({
            "action": action,
            "cost": cost,
            "timestamp": datetime.utcnow().isoformat()
        })
