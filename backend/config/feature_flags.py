from pydantic import BaseSettings

class FeatureFlags(BaseSettings):
    ENABLE_AI_BUNDLING: bool = True
    ALLOW_MANUAL_OVERRIDE: bool = True
    LOG_RECOMMENDATION_EVENTS: bool = True

feature_flags = FeatureFlags()
