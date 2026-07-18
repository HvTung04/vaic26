export interface KnowledgeNode {
  id: string;
  name: string;
  subject: string;
}

/** Shared node registry so testTaking / knowledgeGraph / learningPath mocks stay consistent. */
export const KNOWLEDGE_NODES: KnowledgeNode[] = [
  { id: 'node-dao-ham', name: 'Đạo hàm', subject: 'Toán' },
  { id: 'node-khao-sat-ham-so', name: 'Khảo sát hàm số', subject: 'Toán' },
  { id: 'node-tich-phan', name: 'Tích phân', subject: 'Toán' },
  { id: 'node-song-co', name: 'Sóng cơ học', subject: 'Vật Lý' },
  { id: 'node-dao-dong', name: 'Dao động điều hòa', subject: 'Vật Lý' },
  { id: 'node-este', name: 'Este', subject: 'Hóa học' },
];

const NODE_BY_ID = new Map(KNOWLEDGE_NODES.map((n) => [n.id, n]));

export function nodeName(nodeId: string): string {
  return NODE_BY_ID.get(nodeId)?.name ?? nodeId;
}
