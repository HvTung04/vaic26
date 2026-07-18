"""Data models for Knowledge Graph service (Role 2)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Node:
    id: str
    grade: int
    mach: str  # strand
    topic_id: str
    topic_name: str
    noi_dung_cu_the: str  # concrete content
    yccd: list[dict] = field(default_factory=list)  # learning outcomes
    diem: int = 100
    order: int = 0


@dataclass
class Edge:
    id: str
    from_node: str
    to_node: str
    kind: str  # "inter_block_same_topic" | "bridge"
    cross_grade: bool


@dataclass
class Graph:
    nodes: dict[str, Node] = field(default_factory=dict)
    edges: list[Edge] = field(default_factory=list)
    children: dict[str, list[str]] = field(default_factory=dict)  # forward deps
    parents: dict[str, list[str]] = field(default_factory=dict)   # prerequisites


@dataclass
class MasteryRecord:
    student_id: str
    node_id: str
    mastery_level: float = 1.0  # initial = 1.0 (assume full knowledge)
    weight: float = 0.0
    confidence: float = 1.0
    answer_count: int = 0  # how many answers on this node


@dataclass
class RootCause:
    question_node: str
    root_cause_node: Optional[str]
    confidence: float
    chain: list[str] = field(default_factory=list)
    all_suspects: list[tuple[str, float]] = field(default_factory=list)


@dataclass
class RevisionTest:
    questions: list[dict] = field(default_factory=list)
    target_nodes: list[str] = field(default_factory=list)
    difficulty_distribution: dict[str, int] = field(default_factory=dict)


@dataclass
class LearningPath:
    student_id: str
    tiers: list[LearningTier] = field(default_factory=list)
    raw_text: str = ""  # LLM output


@dataclass
class LearningTier:
    name: str  # "Bù nền tảng" | "Củng cố trung gian" | "Luyện ứng dụng"
    nodes: list[str] = field(default_factory=list)
    explanation: str = ""


@dataclass
class DashboardPriority:
    student_id: str
    student_name: str
    urgency: float
    weak_nodes: list[str] = field(default_factory=list)


@dataclass
class GapRadar:
    node_id: str
    weak_count: int
    total: int
    ratio: float = 0.0


@dataclass
class NeedGroup:
    node_id: str
    student_ids: list[str] = field(default_factory=list)


@dataclass
class Intervention:
    type: str  # "re-teach" | "mini-group" | "peer-support"
    node_id: str
    reason: str
