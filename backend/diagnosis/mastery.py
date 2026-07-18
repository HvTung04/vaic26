"""Mastery engine (Role 2) — DETERMINISTIC graph update, no LLM.

Design goals (per docs/SPEC.md "Cách cập nhật graph" + AGENTS.md):
  * cập nhật theo: độ chính xác, độ khó, thời gian, độ ổn định qua nhiều lần
  * phân biệt "đúng may mắn" vs "thực sự nắm vững"
  * chẩn đoán root-cause: sai node X + node tiên quyết yếu => nghi node tiên quyết
  * giáo viên đọc hiểu được: mỗi node có (mastery, evidence, status) rõ ràng

NGUYÊN TẮC TÁCH UPDATE vs TRACE (theo thiết kế):
  Graph (node + cạnh) là CỐ ĐỊNH. Khi học sinh làm bài, CHỈ node bị tag trực tiếp
  được cập nhật — bước update KHÔNG dùng cạnh. Cạnh chỉ dùng ở khâu TRACE
  (root_causes + learning_path) để suy ra lỗ hổng nền tảng. Nhờ vậy "mastery quan sát"
  (chỉ từ câu đã làm) được tách bạch khỏi "suy luận theo cạnh" — đúng guardrail SPEC
  "phân tách rõ vùng suy luận vs dữ liệu quan sát".

MODEL — mỗi node giữ một niềm tin Beta(a, b):
  mastery  = a / (a + b)          # kỳ vọng xác suất đã nắm vững, ∈ (0,1)
  evidence = (a + b) - (a0 + b0)  # tổng "lượng bằng chứng" đã tích luỹ (độ chắc chắn)
  prior a0 = b0 = 1  => mastery khởi đầu 0.5, chưa có bằng chứng.
  Node CHƯA được test giữ nguyên prior (evidence=0) — không bị suy luận đụng vào.

Mỗi lần trả lời cập nhật a/b của NODE BỊ TAG theo 3 yếu tố (công thức đóng, đọc là hiểu):

1) Guess-correction (chống "đúng may mắn"):
   Trắc nghiệm 4 lựa chọn có xác suất đoán mò GUESS=0.25. Một câu ĐÚNG chỉ được
   tính (1-GUESS)=0.75 lượng bằng chứng dương -> đúng 1 câu dễ gần như không kéo
   mastery lên; phải đúng nhiều/đúng câu khó mới lên rõ.

2) Difficulty-weighting (bất đối xứng theo IRT trực giác):
   - ĐÚNG câu KHÓ = tín hiệu dương mạnh;  ĐÚNG câu DỄ = tín hiệu dương yếu.
   - SAI  câu DỄ  = tín hiệu âm mạnh;     SAI  câu KHÓ = tín hiệu âm yếu (sai câu khó là "bình thường").
     DIFF_W_CORRECT = {dễ:1.0, TB:1.5, khó:2.0}   (thưởng cho đúng câu khó)
     DIFF_W_WRONG   = {dễ:2.0, TB:1.5, khó:1.0}   (phạt nặng khi sai câu dễ)

3) Time-on-task (thời gian làm bài — chuẩn hoá theo độ khó rồi nhân vào trọng số):
   t_norm = time / EXPECTED_TIME_SEC[difficulty]  (câu khó được kỳ vọng lâu hơn).
   - ĐÚNG + NHANH  = thành thạo (fluency)  -> tăng bằng chứng dương  (tf > 1).
   - ĐÚNG + CHẬM   = chật vật / may mắn     -> giảm bằng chứng dương  (tf < 1).
   - SAI  + CHẬM   = cố mà vẫn bí (gap thật) -> tăng bằng chứng âm     (tf > 1).
   - SAI  + NHANH  = lỡ tay / đoán mò        -> giảm bằng chứng âm     (tf < 1).
     tf = clamp(1 ± FLUENCY·(…), TIME_FACTOR_MIN, TIME_FACTOR_MAX).
   Đây là yếu tố củng cố việc phân biệt "đúng may mắn" vs "thực sự nắm vững".

"Độ ổn định qua nhiều lần" thể hiện tự nhiên qua `evidence`: càng nhiều lần trả lời
nhất quán, evidence càng lớn -> ước lượng càng đáng tin (giáo viên nhìn evidence để
biết kết luận đã "chắc" chưa).
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from statistics import mean

from ingestion.taxonomy import load_edges, load_node_map

# ---- Hằng số công thức (đặt tên rõ để giáo viên/đồng đội chỉnh dễ) ----
PRIOR_A = 1.0
PRIOR_B = 1.0
GUESS = 0.25  # trắc nghiệm 4 đáp án
DIFF_W_CORRECT = {1: 1.0, 2: 1.5, 3: 2.0}
DIFF_W_WRONG = {1: 2.0, 2: 1.5, 3: 1.0}
PREREQ_DECAY = 0.5
MAX_HOPS = 2
MASTERY_THRESHOLD = 0.6  # >= : coi như đã nắm; < : cần chú ý
SUSPECT_THRESHOLD = 0.5  # node tiên quyết dưới ngưỡng này => nghi là root-cause
GAP_THRESHOLD = 0.4  # < : lỗ hổng rõ
# Thời gian: thời gian "kỳ vọng" (giây) cho câu dễ/TB/khó -> mốc chuẩn hoá tốc độ.
EXPECTED_TIME_SEC = {1: 6.0, 2: 10.0, 3: 15.0}
FLUENCY = 0.5  # độ nhạy của yếu tố thời gian
TIME_FACTOR_MIN = 0.5
TIME_FACTOR_MAX = 1.5


def _time_factor(correct: bool, d: int, time_sec: float | None) -> float:
    """Hệ số điều chỉnh trọng số theo thời gian, đã chuẩn hoá theo độ khó."""
    if time_sec is None:
        return 1.0
    t_norm = time_sec / EXPECTED_TIME_SEC[d]
    if correct:
        f = 1.0 + FLUENCY * (1.0 - t_norm)  # nhanh -> >1 (thành thạo); chậm -> <1
    else:
        f = 1.0 + FLUENCY * (t_norm - 1.0)  # chậm mà sai -> >1 (bí thật); nhanh -> <1 (lỡ tay)
    return max(TIME_FACTOR_MIN, min(TIME_FACTOR_MAX, f))


def _status(m: float) -> str:
    if m >= MASTERY_THRESHOLD:
        return "mastered"
    if m >= GAP_THRESHOLD:
        return "developing"
    return "gap"


# ---- Prerequisite index (BFS ngược theo cạnh, cache) ----
_prereq_cache: dict[str, list[tuple[str, int]]] | None = None


def _incoming_map() -> dict[str, list[str]]:
    inc: dict[str, list[str]] = {}
    for e in load_edges():
        inc.setdefault(e["to"], []).append(e["from"])
    return inc


def prerequisites(node: str, max_hops: int = MAX_HOPS) -> list[tuple[str, int]]:
    """Các node tiên quyết của `node` kèm số bậc, BFS tối đa max_hops (gần nhất trước)."""
    inc = _incoming_map()
    seen: dict[str, int] = {}
    q: deque[tuple[str, int]] = deque((p, 1) for p in inc.get(node, []))
    while q:
        cur, hop = q.popleft()
        if cur in seen or hop > max_hops:
            continue
        seen[cur] = hop
        for p in inc.get(cur, []):
            if p not in seen:
                q.append((p, hop + 1))
    return sorted(seen.items(), key=lambda kv: kv[1])


@dataclass
class NodeState:
    node_id: str
    a: float = PRIOR_A
    b: float = PRIOR_B
    attempts: int = 0
    correct: int = 0
    total_time_sec: float = 0.0
    timed_attempts: int = 0

    @property
    def mastery(self) -> float:
        return self.a / (self.a + self.b)

    @property
    def evidence(self) -> float:
        return (self.a + self.b) - (PRIOR_A + PRIOR_B)

    @property
    def avg_time_sec(self) -> float | None:
        if self.timed_attempts == 0:
            return None
        return self.total_time_sec / self.timed_attempts

    @property
    def status(self) -> str:
        return _status(self.mastery)


class StudentGraph:
    """Trạng thái graph của MỘT học sinh: {node_id -> NodeState}."""

    def __init__(self, student_id: str):
        self.student_id = student_id
        self.states: dict[str, NodeState] = {}

    def _get(self, node: str) -> NodeState:
        st = self.states.get(node)
        if st is None:
            st = self.states[node] = NodeState(node)
        return st

    def record_answer(
        self,
        knowledge_nodes: list[str],
        difficulty: int | None,
        correct: bool,
        time_sec: float | None = None,
    ) -> None:
        """Cập nhật graph cho một câu trả lời.

        difficulty None -> coi là TB (2). time_sec None -> bỏ qua yếu tố thời gian.
        """
        d = int(difficulty) if difficulty in (1, 2, 3) else 2
        tf = _time_factor(correct, d, time_sec)
        for node in knowledge_nodes:
            st = self._get(node)
            st.attempts += 1
            st.correct += int(correct)
            if time_sec is not None:
                st.total_time_sec += time_sec
                st.timed_attempts += 1
            if correct:
                # bằng chứng dương: đã trừ đoán mò, nhân hệ số thời gian (nhanh -> mạnh hơn)
                st.a += DIFF_W_CORRECT[d] * (1 - GUESS) * tf
            else:
                st.b += DIFF_W_WRONG[d] * tf  # bằng chứng âm (chậm mà sai -> mạnh hơn)
            # LƯU Ý: bước update KHÔNG đụng cạnh. Lan truyền/suy luận tiên quyết nằm ở
            # root_causes() và learning_path() (khâu trace), không trộn vào mastery quan sát.

    # ---- Đầu ra cho giáo viên (TRACE — dùng cạnh, không đụng mastery quan sát) ----
    def root_causes(self) -> list[dict]:
        """Truy cạnh từ node ĐÃ test & yếu lên node tiên quyết => nghi root-cause.

        basis='observed'  : node tiên quyết cũng đã test và đang yếu -> bằng chứng chắc.
        basis='inferred'  : node tiên quyết CHƯA test -> nghi ngờ theo cấu trúc, gắn cờ
                            needs_check, độ tin thấp hơn (không bịa mastery).
        """
        nm = load_node_map()
        best: dict[str, dict] = {}
        for node, st in self.states.items():
            if st.attempts == 0 or st.mastery >= MASTERY_THRESHOLD:
                continue  # chỉ trace từ node ĐÃ QUAN SÁT và yếu
            for pre, hop in prerequisites(node):
                p = self.states.get(pre)
                proximity = PREREQ_DECAY ** (hop - 1)
                if p is not None and p.evidence > 0:
                    if p.mastery >= SUSPECT_THRESHOLD:
                        continue  # tiên quyết đã test và vững -> không nghi
                    basis, pm = "observed", round(p.mastery, 3)
                    conf = round((1 - p.mastery) * proximity, 3)
                    reason = (
                        f"Sai '{nm.get(node, {}).get('topic_name', node)}' và node tiên quyết "
                        f"'{nm.get(pre, {}).get('topic_name', pre)}' (lớp {nm.get(pre, {}).get('grade')}) "
                        f"đã kiểm tra và đang yếu ({p.mastery:.0%})."
                    )
                else:
                    basis, pm = "inferred", None
                    conf = round(0.5 * proximity, 3)  # nghi theo cấu trúc, chưa có dữ liệu
                    reason = (
                        f"Sai '{nm.get(node, {}).get('topic_name', node)}' — nghi hổng node tiên quyết "
                        f"'{nm.get(pre, {}).get('topic_name', pre)}' (lớp {nm.get(pre, {}).get('grade')}), "
                        f"CHƯA kiểm tra, cần cho làm bài để xác nhận."
                    )
                cand = {
                    "failed_node": node,
                    "failed_topic": nm.get(node, {}).get("topic_name", ""),
                    "suspect_prereq": pre,
                    "suspect_topic": nm.get(pre, {}).get("topic_name", ""),
                    "suspect_grade": nm.get(pre, {}).get("grade"),
                    "hops": hop,
                    "basis": basis,
                    "needs_check": basis == "inferred",
                    "suspect_mastery": pm,
                    "confidence": conf,
                    "reason": reason,
                }
                if pre not in best or conf > best[pre]["confidence"]:
                    best[pre] = cand
        # ưu tiên bằng chứng quan sát trước, rồi tới confidence
        return sorted(best.values(),
                      key=lambda r: (r["basis"] == "observed", r["confidence"]), reverse=True)

    def recommended_review(self, k: int = 3) -> list[dict]:
        """2-3 node yếu nhất, sắp xếp easy->hard (theo lớp rồi thứ tự chương trình)."""
        nm = load_node_map()
        attempted = [st for st in self.states.values() if st.attempts > 0]
        weakest = sorted(attempted, key=lambda s: s.mastery)[:k]
        weakest.sort(key=lambda s: (nm.get(s.node_id, {}).get("grade", 99),
                                    nm.get(s.node_id, {}).get("order", 99)))
        return [
            {
                "node": s.node_id,
                "topic": nm.get(s.node_id, {}).get("topic_name", ""),
                "grade": nm.get(s.node_id, {}).get("grade"),
                "mastery": round(s.mastery, 3),
            }
            for s in weakest
        ]

    def snapshot(self) -> list[dict]:
        nm = load_node_map()
        rows = []
        for node, st in self.states.items():
            meta = nm.get(node, {})
            rows.append({
                "node": node,
                "grade": meta.get("grade"),
                "topic": meta.get("topic_name", ""),
                "mastery": round(st.mastery, 3),
                "evidence": round(st.evidence, 2),
                "attempts": st.attempts,
                "correct": st.correct,
                "avg_time_sec": round(st.avg_time_sec, 1) if st.avg_time_sec is not None else None,
                "status": st.status,
            })
        return sorted(rows, key=lambda r: r["mastery"])


def class_gap_radar(graphs: list[StudentGraph]) -> list[dict]:
    """Class Gap Radar: node nào cả lớp đang yếu (mastery TB thấp), yếu nhất lên đầu."""
    nm = load_node_map()
    agg: dict[str, list[float]] = {}
    for g in graphs:
        for node, st in g.states.items():
            if st.attempts > 0:
                agg.setdefault(node, []).append(st.mastery)
    rows = []
    for node, ms in agg.items():
        meta = nm.get(node, {})
        rows.append({
            "node": node,
            "grade": meta.get("grade"),
            "topic": meta.get("topic_name", ""),
            "class_mastery": round(mean(ms), 3),
            "students_assessed": len(ms),
            "students_struggling": sum(1 for m in ms if m < MASTERY_THRESHOLD),
        })
    return sorted(rows, key=lambda r: r["class_mastery"])
