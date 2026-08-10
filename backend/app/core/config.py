from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/yorijori"

    # Gemini API 연동 (4단계). API 키는 절대 로그에 출력하지 않는다 (CLAUDE.md 규칙 9).
    gemini_api_key: str = ""
    # "gemini-2.0-flash"는 신규 발급 키에서 무료 티어 할당량이 0으로 막혀 있는 경우가
    # 있어(계정별) "-latest" 롤링 별칭을 기본값으로 쓴다. 실제 사용 가능한 모델은
    # GET https://generativelanguage.googleapis.com/v1beta/models 로 키별로 확인 가능.
    gemini_model: str = "gemini-flash-latest"
    # 5개 레시피까지 상세 조리법을 구조화 출력으로 받다 보니 10초로는 자주 시간
    # 초과가 나서(실측 약 10~11초) 여유를 두고 25초로 늘렸다. 재시도 1회까지 포함하면
    # 최악의 경우 최대 약 50초 대기.
    gemini_timeout_seconds: float = 25.0
    gemini_api_base_url: str = "https://generativelanguage.googleapis.com/v1beta"

    # 배포 시 프론트(Vercel)와 백엔드(Render)가 다른 도메인이라 CORS가 필요하다(로컬은
    # vite.config.ts의 프록시로 동일 출처처럼 동작해 필요 없었음). 콤마로 여러 origin을
    # 구분한다.
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
