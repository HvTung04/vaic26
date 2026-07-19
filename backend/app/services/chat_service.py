"""Chat service — answers teacher questions about a class using LLM.

Context is built from: class roster (names + mastery), gap radar, priority queue.
The welcome message is hardcoded on the frontend; this service only handles
follow-up messages.
"""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase
from openai import OpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.repositories import class_repo
from app.services import kg_service
from app.services.kg.dashboard import gap_radar, priority_queue

_SYSTEM_PROMPT = """\
Bạn là G.A.R.Y AI, trợ lý phân tích kiến thức cho giáo viên toán THCS Việt Nam.
Bạn có quyền truy cập dữ liệu lớp học được cung cấp dưới dạng ngữ cảnh.
Luôn trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu.
Không bịa thông tin ngoài dữ liệu được cung cấp.
"""


def _build_context(
    class_name: str,
    student_count: int,
    students: list[dict],
    gaps: list,
    prio: list,
) -> str:
    """Build a text context block for the LLM."""
    lines = [
        f"Lớp: {class_name} ({student_count} học sinh)",
        "",
    ]

    # Student list with mastery
    lines.append("Danh sách học sinh và mức thành thạo (trung bình các chủ đề đã học):")
    for s in students:
        mastery = s.get("avg_mastery")
        m_str = f"{mastery:.0%}" if mastery is not None else "chưa có dữ liệu"
        flag = " ⚠️" if mastery is not None and mastery < 0.4 else ""
        lines.append(f"- {s['name']}: {m_str}{flag}")
    lines.append("")

    # Gap radar (top weak nodes)
    if gaps:
        lines.append("Chủ đề yếu nhất lớp (tỷ lệ học sinh yếu):")
        for g in gaps[:8]:
            lines.append(f"- {g.node_id}: {g.weak_count}/{g.total} yếu ({g.ratio:.0%})")
        lines.append("")

    # Priority queue (top urgent students)
    if prio:
        lines.append("Học sinh cần ưu tiên hỗ trợ:")
        for p in prio[:5]:
            lines.append(f"- {p.student_id}: urgency={p.urgency:.2f}, nodes yếu={p.weak_nodes}")
        lines.append("")

    return "\n".join(lines)


async def chat(
    db: AsyncSession,
    mongo_db: AsyncIOMotorDatabase,
    *,
    class_id: str,
    message: str,
    history: list[dict],
) -> str:
    """Build class context, append user history, call LLM, return reply."""
    # Gather class data
    cls = await class_repo.get_by_id(db, class_id)
    class_name = cls.name if cls else "Lớp"
    students = await class_repo.list_students(db, class_id)
    student_dicts = [{"id": str(s.id), "name": s.full_name} for s in students]
    mastery_data = await kg_service.get_mastery_maps(mongo_db, [s["id"] for s in student_dicts])

    # Compute avg mastery per student
    for sd in student_dicts:
        m = mastery_data.get(sd["id"], {})
        if m:
            sd["avg_mastery"] = sum(r.mastery_level for r in m.values()) / len(m)
        else:
            sd["avg_mastery"] = None

    gaps = gap_radar(student_dicts, mastery_data)
    prio = priority_queue(student_dicts, mastery_data)

    context = _build_context(class_name, len(students), student_dicts, gaps, prio)

    # Build messages
    messages: list[dict] = [
        {"role": "system", "content": _SYSTEM_PROMPT + "\n\n## Dữ liệu lớp học\n" + context},
    ]
    for h in history:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    # Call LLM (blocking → run in thread)
    settings = get_settings()

    def _call():
        client = OpenAI(
            api_key=settings.openai_api_key or "sk-placeholder",
            base_url=settings.openai_base_url,
        )
        model = settings.gary_llm_model
        resp = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=1024,
            temperature=0.7,
        )
        return resp.choices[0].message.content or "Xin lỗi, em không thể trả lời lúc này."

    import asyncio
    reply = await asyncio.to_thread(_call)
    return reply
