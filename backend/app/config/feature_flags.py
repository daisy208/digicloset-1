from pydantic import BaseSettings

class FeatureFlags(BaseSettings):
    ENABLE_AI_RECOMMENDATIONS: bool = True

feature_flags = FeatureFlags()
