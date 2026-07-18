"""Learning path tracing (Role 2) — DETERMINISTIC, OFFLINE (no LLM / no network).

Cạnh CHỈ được dùng ở đây (khâu trace), KHÔNG dùng khi update mastery. Từ các node
ĐÃ test & yếu (dữ liệu quan sát), truy ngược cạnh tiên quyết để dựng lộ trình 3 tầng
theo docs/SPEC.md "Personalized practice path":

  Tầng 1 — BÙ NỀN TẢNG      : node gốc bị hổng, phải vá trước.
  Tầng 2 — CỦNG CỐ TRUNG GIAN: node cầu nối giữa nền tảng và kỹ năng đề kiểm tra.
  Tầng 3 — LUYỆN ỨNG DỤNG    : kỹ năng sát đề, CHỈ mở khi nền tảng đã vững.

Tập node của lộ trình (target) gồm:
  - observed : node ĐÃ test & yếu (mastery < ngưỡng, có bằng chứng) — gốc dữ liệu.
  - inferred : node tiên quyết (≤ MAX_HOPS) CHƯA test -> đưa vào dạng "nghi ngờ, cần
               kiểm tra" (needs_check=True), KHÔNG bịa mastery. Node tiên quyết đã test
               mà VỮNG thì loại (không phải lỗ hổng).

Phân tầng trên đồ thị con (target + cạnh tiên quyết giữa chúng):
  Tầng 1  <=  indeg == 0                 (gốc vùng hổng)
  Tầng 3  <=  outdeg == 0 và đã test     (lá — kỹ năng đề trực tiếp kiểm tra)
  Tầng 2  <=  còn lại                    (cầu nối)
Thứ tự = Tầng 1->2->3, trong tầng sắp theo (lớp, thứ tự chương trình) = easy->hard.
"""

from __future__ import annotations

from .mastery import MASTERY_THRESHOLD, StudentGraph, _incoming_map, prerequisites
from ingestion.taxonomy import load_node_map

TIER_NAMES = {1: "Bù nền tảng", 2: "Củng cố trung gian", 3: "Luyện ứng dụng"}


def _build_target(graph: StudentGraph) -> dict[str, str]:
    """{node -> basis} với basis ∈ {'observed','inferred'} — tập node của lộ trình."""
    observed_weak = {
        n for n, st in graph.states.items()
        if st.evidence > 0 and st.mastery < MASTERY_THRESHOLD
    }
    basis: dict[str, str] = {n: "observed" for n in observed_weak}
    for n in observed_weak:
        for pre, _hop in prerequisites(n):  # truy cạnh (≤ MAX_HOPS)
            st = graph.states.get(pre)
            if st is not None and st.evidence > 0:
                if st.mastery < MASTERY_THRESHOLD:
                    basis.setdefault(pre, "observed")  # tiên quyết đã test & yếu
                # tiên quyết đã test & vững -> bỏ qua
            else:
                basis.setdefault(pre, "inferred")  # chưa test -> nghi ngờ
    return basis


def learning_path(graph: StudentGraph) -> dict:
    nm = load_node_map()
    inc = _incoming_map()
    basis = _build_target(graph)

    # đồ thị con: cạnh tiên quyết chỉ giữa các node trong target
    prereqs = {n: [p for p in inc.get(n, []) if p in basis] for n in basis}
    deps: dict[str, list[str]] = {n: [] for n in basis}
    for n, ps in prereqs.items():
        for p in ps:
            deps[p].append(n)

    def _order_key(n: str):  # easy -> hard theo chương trình
        m = nm.get(n, {})
        return (m.get("grade", 99), m.get("order", 99))

    def _attempted(n: str) -> bool:
        st = graph.states.get(n)
        return st is not None and st.attempts > 0

    tiers: dict[int, list[str]] = {1: [], 2: [], 3: []}
    for n in basis:
        if len(prereqs[n]) == 0:
            tiers[1].append(n)
        elif len(deps[n]) == 0 and _attempted(n):
            tiers[3].append(n)
        else:
            tiers[2].append(n)

    def _row(n: str, tier: int) -> dict:
        m = nm.get(n, {})
        st = graph.states.get(n)
        b = basis[n]
        observed = st is not None and st.evidence > 0
        blockers = sorted(prereqs[n], key=_order_key)
        if b == "inferred":
            why = (f"Nghi hổng nền tảng (lớp {m.get('grade')}) — CHƯA kiểm tra, "
                   f"nên cho đánh giá/ôn trước.")
        elif tier == 1:
            why = f"Lỗ hổng nền tảng (lớp {m.get('grade')}) — vá trước tiên."
        elif tier == 2:
            why = f"Cầu nối — cần cho: {', '.join(sorted(deps[n], key=_order_key))}."
        else:
            why = f"Kỹ năng đề kiểm tra (mastery {st.mastery:.0%}); mở khi nền vững."
        return {
            "node": n,
            "grade": m.get("grade"),
            "topic": m.get("topic_name", ""),
            "basis": b,                       # observed | inferred
            "needs_check": b == "inferred",   # cờ: cần cho làm bài để xác nhận
            "mastery": round(st.mastery, 3) if observed else None,
            "status": st.status if observed else "unknown",
            "blocked_by": blockers,
            "why": why,
        }

    ordered_tiers = []
    sequence: list[str] = []
    for t in (1, 2, 3):
        nodes = sorted(tiers[t], key=_order_key)
        sequence.extend(nodes)
        ordered_tiers.append({"tier": t, "name": TIER_NAMES[t],
                              "nodes": [_row(n, t) for n in nodes]})

    return {
        "student_id": graph.student_id,
        "tiers": ordered_tiers,
        "ordered_sequence": sequence,
    }


def format_learning_path(path: dict, name: str | None = None) -> str:
    """Kết xuất text để in ra (offline)."""
    lines = [f"LỘ TRÌNH HỌC — {name or path['student_id']}"]
    for tier in path["tiers"]:
        if not tier["nodes"]:
            continue
        lines.append(f"  ▸ Tầng {tier['tier']} — {tier['name']}:")
        for r in tier["nodes"]:
            mstr = f"{r['mastery']:.0%}" if r["mastery"] is not None else "chưa test"
            flag = " ⚠ cần kiểm tra" if r["needs_check"] else ""
            blk = f"  [khoá đến khi vá: {', '.join(r['blocked_by'])}]" if r["blocked_by"] else ""
            lines.append(f"      {r['node']} (lớp {r['grade']}, {r['topic']}) "
                         f"— {mstr}{flag}{blk}")
            lines.append(f"        • {r['why']}")
    seq = " → ".join(path["ordered_sequence"]) or "(không có node yếu — đã vững)"
    lines.append(f"  Thứ tự luyện: {seq}")
    return "\n".join(lines)
