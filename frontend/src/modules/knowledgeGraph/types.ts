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
