"""Curriculum graph loading: read nodes/edges (JSON fixtures or raw dicts from
Mongo) and map them into the in-memory Graph schema.
"""

from __future__ import annotations

import json
from pathlib import Path

from app.schemas.kg import Edge, Graph, Node

_DOCS = Path(__file__).resolve().parents[3] / "docs"


def load_graph(
    nodes_path: str | Path | None = None,
    edges_path: str | Path | None = None,
) -> Graph:
    """Load curriculum nodes + edges from the docs/ JSON fixtures, build adjacency lists."""
    np = Path(nodes_path) if nodes_path else _DOCS / "curriculum_nodes.json"
    ep = Path(edges_path) if edges_path else _DOCS / "curriculum_edges.json"

    raw_nodes = json.loads(np.read_text(encoding="utf-8"))
    raw_edges = json.loads(ep.read_text(encoding="utf-8"))

    return build_graph(raw_nodes, raw_edges)


def build_graph(raw_nodes: list[dict], raw_edges: list[dict]) -> Graph:
    """Build a Graph (with adjacency lists) from already-loaded node/edge dicts.
    Same `_id`/`from`/`to` shape as curriculum_nodes.json / curriculum_edges.json,
    regardless of whether they came from the JSON fixtures or MongoDB.
    """
    nodes = {}
    for n in raw_nodes:
        nodes[n["_id"]] = Node(
            id=n["_id"],
            grade=n["grade"],
            mach=n["mach"],
            topic_id=n["topic_id"],
            topic_name=n["topic_name"],
            noi_dung_cu_the=n["noi_dung_cu_the"],
            yccd=n.get("yccd", []),
            diem=n.get("diem", 100),
            order=n.get("order", 0),
        )

    edges = []
    children: dict[str, list[str]] = {nid: [] for nid in nodes}
    parents: dict[str, list[str]] = {nid: [] for nid in nodes}

    for e in raw_edges:
        edge = Edge(
            id=e["_id"],
            from_node=e["from"],
            to_node=e["to"],
            kind=e["kind"],
            cross_grade=e.get("cross_grade", False),
        )
        edges.append(edge)
        # Edge from→to means: from is prerequisite of to
        if e["from"] in children:
            children[e["from"]].append(e["to"])
        if e["to"] in parents:
            parents[e["to"]].append(e["from"])

    return Graph(nodes=nodes, edges=edges, children=children, parents=parents)
