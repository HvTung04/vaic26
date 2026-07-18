"""Tests for graph loading and traversal."""

from app.repositories.graph_repo import load_graph
from app.services.kg.graph import (
    get_prerequisites,
    get_dependents,
    get_all_chains,
    graph_distance,
    topological_order,
)


def test_load_real_curriculum():
    g = load_graph()
    assert len(g.nodes) == 57
    assert len(g.edges) == 57
    assert "L6-t1-B01" in g.nodes
    # Find a real G8 node
    g8_nodes = [nid for nid in g.nodes if nid.startswith("L8-")]
    assert len(g8_nodes) > 0


def test_parents_children_built():
    g = load_graph()
    # L6-t1-B02 should have parent L6-t1-B01
    assert "L6-t1-B01" in g.parents.get("L6-t1-B02", [])
    # L6-t1-B01 should have child L6-t1-B02
    assert "L6-t1-B02" in g.children.get("L6-t1-B01", [])


def test_get_prerequisites():
    g = load_graph()
    prereqs = get_prerequisites(g, "L6-t1-B02")
    assert "L6-t1-B01" in prereqs


def test_get_prerequisites_max_depth():
    g = load_graph()
    # Shallow depth should return fewer results
    shallow = get_prerequisites(g, "L8-t7-B03", max_depth=1)
    deep = get_prerequisites(g, "L8-t7-B03", max_depth=3)
    assert len(shallow) <= len(deep)


def test_get_dependents():
    g = load_graph()
    deps = get_dependents(g, "L6-t1-B01")
    assert "L6-t1-B02" in deps


def test_get_all_chains():
    g = load_graph()
    chains = get_all_chains(g, "L6-t1-B02")
    assert len(chains) >= 1
    # First chain should start with L6-t1-B02
    assert chains[0][0] == "L6-t1-B02"


def test_graph_distance_same():
    g = load_graph()
    assert graph_distance(g, "L6-t1-B01", "L6-t1-B01") == 0


def test_graph_distance_adjacent():
    g = load_graph()
    d = graph_distance(g, "L6-t1-B01", "L6-t1-B02")
    assert d == 1


def test_graph_distance_unreachable():
    g = load_graph()
    # Graph may not be fully connected; distant nodes may be unreachable (-1)
    g8_nodes = [nid for nid in g.nodes if nid.startswith("L8-")]
    d = graph_distance(g, "L6-t1-B01", g8_nodes[0])
    # Either reachable (>= 2) or unreachable (-1) — both valid
    assert d >= 2 or d == -1


def test_topological_order():
    g = load_graph()
    order = topological_order(g)
    assert len(order) == 57
    # Prerequisites should come before dependents
    idx_b01 = order.index("L6-t1-B01")
    idx_b02 = order.index("L6-t1-B02")
    assert idx_b01 < idx_b02


def test_cross_grade_edges():
    g = load_graph()
    cross = [e for e in g.edges if e.cross_grade]
    assert len(cross) >= 10  # should have cross-grade edges
