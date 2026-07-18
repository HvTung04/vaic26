"""Knowledge graph: load curriculum, build adjacency, BFS traversal."""

from __future__ import annotations

import json
from collections import deque
from pathlib import Path

from .models import Node, Edge, Graph

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


def get_prerequisites(graph: Graph, node_id: str, max_depth: int = 3) -> list[str]:
    """BFS backward: all ancestors up to max_depth hops."""
    visited = set()
    result = []
    queue: deque[tuple[str, int]] = deque([(node_id, 0)])
    while queue:
        current, depth = queue.popleft()
        if depth >= max_depth:
            continue
        for parent in graph.parents.get(current, []):
            if parent not in visited and parent in graph.nodes:
                visited.add(parent)
                result.append(parent)
                queue.append((parent, depth + 1))
    return result


def get_dependents(graph: Graph, node_id: str, max_depth: int = 3) -> list[str]:
    """BFS forward: all nodes that depend on this one."""
    visited = set()
    result = []
    queue: deque[tuple[str, int]] = deque([(node_id, 0)])
    while queue:
        current, depth = queue.popleft()
        if depth >= max_depth:
            continue
        for child in graph.children.get(current, []):
            if child not in visited and child in graph.nodes:
                visited.add(child)
                result.append(child)
                queue.append((child, depth + 1))
    return result


def get_all_chains(
    graph: Graph, node_id: str, max_depth: int = 4
) -> list[list[str]]:
    """All paths from node back to root (leaf→root). Each chain is a prerequisite path."""
    chains: list[list[str]] = []

    def dfs(current: str, path: list[str], depth: int):
        parents = graph.parents.get(current, [])
        if not parents or depth >= max_depth:
            chains.append(list(path))
            return
        for p in parents:
            if p in graph.nodes and p not in path:
                path.append(p)
                dfs(p, path, depth + 1)
                path.pop()
        if not any(p in graph.nodes for p in parents):
            chains.append(list(path))

    dfs(node_id, [node_id], 0)
    return chains


def graph_distance(graph: Graph, from_id: str, to_id: str) -> int:
    """BFS shortest path distance. Returns -1 if unreachable."""
    if from_id == to_id:
        return 0
    visited = {from_id}
    queue: deque[tuple[str, int]] = deque([(from_id, 0)])
    while queue:
        current, dist = queue.popleft()
        # Check both forward and backward edges
        neighbors = (
            graph.children.get(current, []) + graph.parents.get(current, [])
        )
        for n in neighbors:
            if n == to_id:
                return dist + 1
            if n not in visited and n in graph.nodes:
                visited.add(n)
                queue.append((n, dist + 1))
    return -1


def topological_order(graph: Graph) -> list[str]:
    """Topological sort (prerequisites first). For batch mastery computation."""
    in_degree = {nid: 0 for nid in graph.nodes}
    for edge in graph.edges:
        if edge.to_node in in_degree:
            in_degree[edge.to_node] += 1

    queue = deque(nid for nid, d in in_degree.items() if d == 0)
    order: list[str] = []
    while queue:
        nid = queue.popleft()
        order.append(nid)
        for child in graph.children.get(nid, []):
            if child in in_degree:
                in_degree[child] -= 1
                if in_degree[child] == 0:
                    queue.append(child)
    return order
