# recommendations endpoint
from app.config.feature_flags import feature_flags
if not feature_flags.ENABLE_AI_RECOMMENDATIONS:
    return {
        "recommendations": [],
        "status": "disabled_by_feature_flag"
    }
from app.events.kpi_events import log_recommendation_impression
import logging

logger = logging.getLogger(__name__)
logger.info(
    log_recommendation_impression(merchant_id, recommendation_id)
)
