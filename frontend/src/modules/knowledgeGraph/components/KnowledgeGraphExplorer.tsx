import { useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Network, AlertCircle, MousePointerClick } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/utils/format';
import { layoutGraph, NODE_HEIGHT, NODE_WIDTH } from '../utils/dagreLayout';
import { MASTERY_BUCKET_META, masteryBucket, type MasteryBucket } from '../utils/masteryBucket';
import { MasteryFlowNode, type MasteryFlowNodeData } from './MasteryFlowNode';
import type { FullGraph, FullGraphNode } from '../types';

const nodeTypes = { mastery: MasteryFlowNode };

const LEGEND_ORDER: MasteryBucket[] = ['strong', 'medium', 'weak', 'unattempted'];

/** Nodes touched by the same grading/revision event share (near-)identical
 * `lastUpdated` timestamps — group anything within this window of the most
 * recent update to find "the cluster the student just worked on". */
const RECENT_CLUSTER_WINDOW_MS = 15 * 60 * 1000;

function findRecentClusterIds(graph: FullGraph): string[] | undefined {
  const timestamped = graph.nodes.filter((n) => n.lastUpdated !== null);
  if (timestamped.length === 0) return undefined;

  const latest = Math.max(...timestamped.map((n) => new Date(n.lastUpdated as string).getTime()));
  const cluster = timestamped.filter(
    (n) => latest - new Date(n.lastUpdated as string).getTime() <= RECENT_CLUSTER_WINDOW_MS,
  );
  return cluster.map((n) => n.nodeId);
}

export interface KnowledgeGraphExplorerProps {
  graph?: FullGraph;
  isLoading?: boolean;
}

function buildFlow(graph: FullGraph): { nodes: Node<MasteryFlowNodeData>[]; edges: Edge[] } {
  const rawNodes: Node<MasteryFlowNodeData>[] = graph.nodes.map((node) => ({
    id: node.nodeId,
    type: 'mastery',
    data: { node },
    position: { x: 0, y: 0 },
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  }));

  const edges: Edge[] = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.fromNode,
    target: edge.toNode,
    animated: false,
    style: {
      stroke: edge.crossGrade ? '#c084fc' : '#c9c5b8',
      strokeWidth: edge.crossGrade ? 1.75 : 1.25,
      strokeDasharray: edge.kind === 'bridge' ? '4 3' : undefined,
    },
  }));

  return { nodes: layoutGraph(rawNodes, edges), edges };
}

function NodeDetailSidebar({ node }: { node: FullGraphNode | null }) {
  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-ink-faint">
        <MousePointerClick className="h-5 w-5" />
        <p className="text-xs">Di chuột hoặc nhấn vào một node để xem chi tiết</p>
      </div>
    );
  }

  const bucket = masteryBucket(node.mastery);
  const meta = MASTERY_BUCKET_META[bucket];

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4 scrollbar-thin">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{node.nodeName}</p>
        {node.needsReview && <AlertCircle className="h-4 w-4 shrink-0 text-ember" />}
      </div>
      <p className="text-[11px] text-ink-faint">
        {node.mach} · Lớp {node.grade}
      </p>
      <span
        className="w-fit rounded-full px-2.5 py-1 text-xs font-semibold"
        style={{ background: meta.bg, color: meta.text }}
      >
        {node.mastery === null ? 'Chưa học' : `${Math.round(node.mastery * 100)}% mức độ vững`}
      </span>
      <p className="text-xs leading-relaxed text-ink-soft">{node.description}</p>
      <div className="mt-1 flex flex-col gap-1.5 border-t border-hairline pt-3 text-xs text-ink-soft">
        <div className="flex justify-between">
          <span>Số lượt làm bài</span>
          <span className="font-semibold text-ink">{node.attempts}</span>
        </div>
        {node.confidence !== null && (
          <div className="flex justify-between">
            <span>Độ tin cậy</span>
            <span className="font-semibold text-ink">{Math.round(node.confidence * 100)}%</span>
          </div>
        )}
        {node.lastUpdated && (
          <div className="flex justify-between">
            <span>Cập nhật gần nhất</span>
            <span className="font-semibold text-ink">{formatDate(node.lastUpdated)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function KnowledgeGraphExplorer({ graph, isLoading }: KnowledgeGraphExplorerProps) {
  const [hoveredNode, setHoveredNode] = useState<FullGraphNode | null>(null);
  const [pinnedNode, setPinnedNode] = useState<FullGraphNode | null>(null);

  const { nodes: layoutedNodes, edges } = useMemo(
    () => (graph ? buildFlow(graph) : { nodes: [], edges: [] }),
    [graph],
  );
  const nodes = useMemo(
    () => layoutedNodes.map((n) => ({ ...n, selected: n.id === pinnedNode?.nodeId })),
    [layoutedNodes, pinnedNode],
  );

  const fitViewOptions = useMemo(() => {
    const recentIds = graph ? findRecentClusterIds(graph) : undefined;
    return recentIds
      ? { nodes: recentIds.map((id) => ({ id })), padding: 2, maxZoom: 1, duration: 400 }
      : { padding: 0.15 };
  }, [graph]);

  const displayedNode = hoveredNode ?? pinnedNode;

  const onNodeMouseEnter: NodeMouseHandler<Node<MasteryFlowNodeData>> = (_event, node) => {
    setHoveredNode(node.data.node);
  };
  const onNodeMouseLeave = () => setHoveredNode(null);
  const onNodeClick: NodeMouseHandler<Node<MasteryFlowNodeData>> = (_event, node) => {
    setPinnedNode(node.data.node);
  };
  const onPaneClick = () => setPinnedNode(null);

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Sơ đồ tri thức</CardTitle>
        <Network className="h-4 w-4 text-ink-faint" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading ? (
          <Skeleton className="h-[520px] w-full" />
        ) : !graph || graph.nodes.length === 0 ? (
          <p className="text-sm text-ink-faint">Chưa có dữ liệu đồ thị kiến thức.</p>
        ) : (
          <>
            <div className="flex h-[520px] w-full overflow-hidden rounded-bento-sm border border-hairline">
              <div className="min-w-0 flex-1 bg-cream/40">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  onNodeMouseEnter={onNodeMouseEnter}
                  onNodeMouseLeave={onNodeMouseLeave}
                  onNodeClick={onNodeClick}
                  onPaneClick={onPaneClick}
                  fitView
                  fitViewOptions={fitViewOptions}
                  minZoom={0.15}
                  maxZoom={2.5}
                  nodesDraggable={false}
                >
                  <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#dedad0" />
                  <Controls showInteractive={false} />
                  <MiniMap
                    pannable
                    zoomable
                    nodeColor={(n) => MASTERY_BUCKET_META[masteryBucket((n.data as MasteryFlowNodeData).node.mastery)].bg}
                    maskColor="rgba(253, 251, 247, 0.6)"
                  />
                </ReactFlow>
              </div>
              <div className="w-64 shrink-0 border-l border-hairline bg-white">
                <NodeDetailSidebar node={displayedNode} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-soft">
              {LEGEND_ORDER.map((bucket) => (
                <span key={bucket} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full border"
                    style={{ background: MASTERY_BUCKET_META[bucket].water, borderColor: MASTERY_BUCKET_META[bucket].border }}
                  />
                  {MASTERY_BUCKET_META[bucket].label}
                </span>
              ))}
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full border-t-2 border-dashed" style={{ borderColor: '#c084fc' }} />
                Liên kết liên khối
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
