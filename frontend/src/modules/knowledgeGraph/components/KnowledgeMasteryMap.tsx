import { AlertCircle, BrainCircuit } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { NodeState } from '../types';

export interface KnowledgeMasteryMapProps {
  nodes?: NodeState[];
  isLoading?: boolean;
}

function masteryIndicatorClass(mastery: number) {
  if (mastery >= 0.75) return 'bg-lime';
  if (mastery >= 0.5) return 'bg-sky';
  return 'bg-ember';
}

export function KnowledgeMasteryMap({ nodes, isLoading }: KnowledgeMasteryMapProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Bản đồ kiến thức</CardTitle>
        <BrainCircuit className="h-4 w-4 text-ink-faint" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </>
        ) : (
          nodes?.map((node) => (
            <div key={node.nodeId}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-ink">{node.nodeName}</span>
                <div className="flex shrink-0 items-center gap-2">
                  {node.needsReview && (
                    <Badge variant="coral" className="gap-1">
                      <AlertCircle className="h-3 w-3" /> Cần ôn tập
                    </Badge>
                  )}
                  <span className="text-xs font-bold text-ink-soft">{Math.round(node.mastery * 100)}%</span>
                </div>
              </div>
              <Progress value={node.mastery * 100} indicatorClassName={masteryIndicatorClass(node.mastery)} />
            </div>
          ))
        )}
        {!isLoading && nodes?.length === 0 && (
          <p className="text-sm text-ink-faint">Chưa có dữ liệu — hãy làm bài kiểm tra đầu tiên nhé!</p>
        )}
      </CardContent>
    </Card>
  );
}
