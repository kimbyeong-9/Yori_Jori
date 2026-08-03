from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/yorijori"

    # Gemini API 연동 (4단계). API 키는 절대 로그에 출력하지 않는다 (CLAUDE.md 규칙 9).
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    gemini_timeout_seconds: float = 10.0
    gemini_api_base_url: str = "https://generativelanguage.googleapis.com/v1beta"


settings = Settings()
