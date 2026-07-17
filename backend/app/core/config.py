from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_ENV: str = "dev"
    DATABASE_URL: str = "postgresql+psycopg://gaplens:gaplens@localhost:5432/gaplens"

    # LLM — provider chưa chốt (xem plan.md § 0). Set khi đã quyết định, ví dụ:
    # LLM_PROVIDER=anthropic, LLM_MODEL=claude-sonnet-5. Không set -> app/services/llm/provider.py
    # trả về FakeListChatModel để phần còn lại của pipeline vẫn chạy được.
    LLM_PROVIDER: str | None = None
    LLM_MODEL: str | None = None
    LLM_API_KEY: str | None = None

    # Fake auth cho 2 account demo (giáo viên/học sinh) — xem plan.md § 1 (BE/AI 3)
    FAKE_TEACHER_TOKEN: str = "teacher-demo-token"
    FAKE_STUDENT_TOKEN: str = "student-demo-token"


settings = Settings()
