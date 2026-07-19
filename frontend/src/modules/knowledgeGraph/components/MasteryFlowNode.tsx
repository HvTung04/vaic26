import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { AlertCircle } from 'lucide-react';
import { MASTERY_BUCKET_META, masteryBucket } from '../utils/masteryBucket';
import { WAVE_PATH_A, WAVE_PATH_B } from '../utils/wavePath';
import type { FullGraphNode } from '../types';
import './waterNode.css';

export const CIRCLE_SIZE = 56;
const R = CIRCLE_SIZE / 2;

export type MasteryFlowNodeData = { node: FullGraphNode };

function MasteryFlowNodeImpl({ id, data, selected }: NodeProps & { data: MasteryFlowNodeData }) {
  const { node } = data;
  const bucket = masteryBucket(node.mastery);
  const meta = MASTERY_BUCKET_META[bucket];
  const pct = node.mastery === null ? 0 : Math.round(node.mastery * 100);
  const levelPct = bucket === 'unattempted' ? 0 : Math.max(pct, 8);
  const clipId = `kg-clip-${id}`;

  return (
    <div className="flex w-[92px] flex-col items-center gap-1">
      <Handle type="target" position={Position.Left} className="!bg-ink-faint !opacity-40" />
      <div className="relative" style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}>
        <svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}>
          <defs>
            <clipPath id={clipId}>
              <circle cx={R} cy={R} r={R - 1.5} />
            </clipPath>
          </defs>
          <circle cx={R} cy={R} r={R - 1.5} fill={meta.empty} />
          {levelPct > 0 && (
            <g clipPath={`url(#${clipId})`}>
              <g
                className="kg-water-level"
                style={{ transform: `translateY(${CIRCLE_SIZE - (CIRCLE_SIZE * levelPct) / 100}px)` }}
              >
                <path d={WAVE_PATH_A} fill={meta.water} opacity={0.55} className="kg-wave-a" />
                <path d={WAVE_PATH_B} fill={meta.water} opacity={0.9} className="kg-wave-b" transform="translate(0,1.5)" />
              </g>
            </g>
          )}
          <circle
            cx={R}
            cy={R}
            r={R - 1.5}
            fill="none"
            stroke={meta.border}
            strokeWidth={2.5}
            strokeDasharray={bucket === 'unattempted' ? '3 3' : undefined}
          />
        </svg>
        <span
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-[12px] font-bold text-ink"
          style={{ textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff' }}
        >
          {bucket === 'unattempted' ? '—' : `${pct}%`}
        </span>
        {selected && (
          <span
            className="pointer-events-none absolute inset-[-3px] rounded-full"
            style={{ boxShadow: `0 0 0 2.5px ${meta.border}` }}
          />
        )}
        {node.needsReview && (
          <span className="absolute -right-0.5 -top-0.5 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-ember text-white shadow-sm">
            <AlertCircle className="h-2.5 w-2.5" />
          </span>
        )}
      </div>
      <span
        className="w-full truncate text-center text-[9.5px] font-medium leading-tight text-ink-soft"
        title={node.nodeName}
      >
        {node.nodeName}
      </span>
      <Handle type="source" position={Position.Right} className="!bg-ink-faint !opacity-40" />
    </div>
  );
}

export const MasteryFlowNode = memo(MasteryFlowNodeImpl);
