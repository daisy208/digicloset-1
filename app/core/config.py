from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "DigiCloset"
    debug: bool = False


settings = Settings()
