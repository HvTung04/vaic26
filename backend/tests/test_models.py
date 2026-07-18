"""Tests for models + taxonomy (no network)."""

from ingestion.models import QuestionDraft, AnswerOption, SourceType, Difficulty
from ingestion.taxonomy import is_valid_node, load_taxonomy_nodes


def test_difficulty_enum():
    assert Difficulty.EASY == 1 and Difficulty.HARD == 3


def test_draft_defaults():
    d = QuestionDraft(index=1, text="x?", source_type=SourceType.PDF)
    assert d.status == "draft"
    assert d.confidence == 0.0
    assert d.knowledge_nodes == []


def test_taxonomy_placeholder_valid():
    assert is_valid_node("math-g5-fraction-equivalent")
    assert not is_valid_node("nonexistent-node")


def test_taxonomy_list_nonempty():
    assert len(load_taxonomy_nodes()) > 0
