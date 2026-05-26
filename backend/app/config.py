from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PORT: int = 5000
    DATABASE_URL: str = "sqlite:///./dev.db"
    JWT_SECRET: str = "your-secret-key"
    NODE_ENV: str = "development"
    QR_HMAC_SECRET: str = "qr-hmac-secret-key"

    class Config:
        env_file = ".env"


settings = Settings()
