from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/yorijori"

    # Gemini API 연동 (4단계). API 키는 절대 로그에 출력하지 않는다 (CLAUDE.md 규칙 9).
    gemini_api_key: str = ""
    # 2026-08-18: "gemini-flash-latest"가 가리키는 모델이 구조화 출력(responseSchema)
    # 요청에서 지속적으로 503(high demand)/타임아웃을 냈다(실측 1시간+ 재현). "-latest"
    # 롤링 별칭이 thinking 기능이 기본 켜진 3.x세대 모델로 넘어간 게 원인으로 보여
    # (thinkingConfig로 우회, 아래 gemini_client.py 참조), 고정된 안정 버전인
    # "gemini-3.5-flash"로 변경. 실제 사용 가능한 모델은
    # GET https://generativelanguage.googleapis.com/v1beta/models 로 키별로 확인 가능.
    gemini_model: str = "gemini-3.5-flash"
    # 5개 레시피까지 상세 조리법을 구조화 출력으로 받다 보니 10초로는 자주 시간
    # 초과가 나서(실측 약 10~11초, thinking 비활성화 후에도 15~25초 소요) 여유를 두고
    # 35초로 늘렸다. 재시도 1회까지 포함하면 최악의 경우 최대 약 70초 대기.
    gemini_timeout_seconds: float = 35.0
    gemini_api_base_url: str = "https://generativelanguage.googleapis.com/v1beta"

    # 배포 시 프론트(Vercel)와 백엔드(Render)가 다른 도메인이라 CORS가 필요하다(로컬은
    # vite.config.ts의 프록시로 동일 출처처럼 동작해 필요 없었음). 콤마로 여러 origin을
    # 구분한다.
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
