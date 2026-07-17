from functools import lru_cache

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.language_models.fake_chat_models import FakeListChatModel

from app.core.config import settings


@lru_cache
def get_llm() -> BaseChatModel:
    """
    LLM provider factory dùng chung cho toàn bộ pipeline AI (labeling, learning path...).

    Provider chưa chốt (xem plan.md § 0). Đọc LLM_PROVIDER / LLM_MODEL từ env:
      - Chưa set -> trả về FakeListChatModel để phần còn lại của code chạy được, không crash.
      - Đã chốt  -> dùng langchain.chat_models.init_chat_model, chỉ cần set env, KHÔNG sửa code
        ở đây hay ở nơi gọi get_llm().
    """
    if not settings.LLM_PROVIDER:
        return FakeListChatModel(
            responses=["<<LLM_PROVIDER chưa được cấu hình — set LLM_PROVIDER/LLM_MODEL trong .env>>"]
        )

    from langchain.chat_models import init_chat_model

    return init_chat_model(settings.LLM_MODEL, model_provider=settings.LLM_PROVIDER)
