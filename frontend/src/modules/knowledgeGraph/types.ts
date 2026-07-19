export interface NodeState {
  nodeId: string;
  nodeName: string;
  mastery: number;
  confidence: number;
  attempts: number;
  lastUpdated: string;
  needsReview: boolean;
}

export interface GraphState {
  studentId: string;
  nodes: NodeState[];
}

export interface FullGraphNode {
  nodeId: string;
  nodeName: string;
  grade: number;
  mach: string;
  topicId: string;
  description: string;
  mastery: number | null;
  confidence: number | null;
  attempts: number;
  needsReview: boolean;
  lastUpdated: string | null;
}

export interface GraphEdgeItem {
  id: string;
  fromNode: string;
  toNode: string;
  kind: string;
  crossGrade: boolean;
}

export interface FullGraph {
  studentId: string;
  nodes: FullGraphNode[];
  edges: GraphEdgeItem[];
}
