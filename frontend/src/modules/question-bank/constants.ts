export interface KnowledgeNode {
  id: string;
  label: string;
}

/** Knowledge-graph topic nodes questions can be tagged/labeled against. */
export const KNOWLEDGE_NODES: KnowledgeNode[] = [
  { id: 'kg-cell-organelles', label: 'Cell Organelles' },
  { id: 'kg-photosynthesis', label: 'Photosynthesis' },
  { id: 'kg-cell-cycle', label: 'Cell Cycle' },
  { id: 'kg-cell-transport', label: 'Cell Transport' },
  { id: 'kg-genetics', label: 'Genetics & Heredity' },
  { id: 'kg-evolution', label: 'Evolution' },
];

export function nodeLabel(nodeId: string): string {
  return KNOWLEDGE_NODES.find((node) => node.id === nodeId)?.label ?? nodeId;
}
