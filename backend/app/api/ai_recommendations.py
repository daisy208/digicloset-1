# recommendations endpoint
from app.config.feature_flags import feature_flags
if not feature_flags.ENABLE_AI_RECOMMENDATIONS:
    return {
        "recommendations": [],
        "status": "disabled_by_feature_flag"
    }
