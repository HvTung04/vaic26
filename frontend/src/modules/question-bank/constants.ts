import type { TaxonomyNode } from './types';

/** Per-row badge label: just the topic name (e.g. "Số tự nhiên"). */
export function nodeLabel(nodes: TaxonomyNode[] | undefined, nodeId: string): string {
  return nodes?.find((n) => n.id === nodeId)?.topicName ?? nodeId;
}
