import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "SUPER_SECRET_KEY_FINORA_JOURNAL_PRO_2024")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "finora")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "finora")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "finora")
    # Comma-separated list, e.g. "https://finora.vercel.app,http://localhost:3000"
    CORS_ORIGINS: str = "http://localhost:3000"
    # Set to true in production (HTTPS). Cross-site cookies (frontend and API on
    # different domains) are only sent by browsers when Secure + SameSite=None.
    COOKIE_SECURE: bool = False
    # Email import: alerts forwarded to <token>@INBOUND_EMAIL_DOMAIN are delivered by
    # an email worker to /api/v1/inbound/email with this shared secret. Both unset = off.
    INBOUND_EMAIL_DOMAIN: str = ""
    INBOUND_EMAIL_SECRET: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @staticmethod
    def _normalize_database_url(url: str) -> str:
        if url.startswith("postgresql://"):
            url = "postgresql+asyncpg://" + url.removeprefix("postgresql://")
        url = url.replace("sslmode=require", "ssl=require")
        url = url.replace("channel_binding=require&", "").replace("&channel_binding=require", "")
        return url

    @property
    def DATABASE_URL(self) -> str:
        url = os.getenv("DATABASE_URL")
        if url:
            return self._normalize_database_url(url.strip())
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"
        )

settings = Settings()
