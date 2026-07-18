"""Knowledge graph traversal algorithms: BFS prerequisites/dependents, chains,
distance, topological order. Operates on an already-built Graph (see
app.repositories.graph_repo for loading/construction).
"""

from __future__ import annotations

from collections import deque

from app.schemas.kg import Graph


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
