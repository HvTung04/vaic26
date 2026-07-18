import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGenerateRevisionTest } from '../hooks/useGenerateRevisionTest';
import type { NodeState } from '@/modules/knowledgeGraph/types';

export interface RevisionCtaProps {
  weakestNode?: NodeState | null;
  isLoading?: boolean;
}

export function RevisionCta({ weakestNode, isLoading }: RevisionCtaProps) {
  const navigate = useNavigate();
  const generateMutation = useGenerateRevisionTest();

  if (isLoading || !weakestNode) return null;

  return (
    <Card className="border-lavender bg-lavender-soft/40">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lavender text-[#6B3FCB]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">
              Bạn đang yếu nhất ở <span className="text-[#6B3FCB]">{weakestNode.nodeName}</span> (
              {Math.round(weakestNode.mastery * 100)}% nắm vững)
            </p>
            <p className="text-xs text-ink-faint">AI có thể tạo ngay một bài ôn tập ngắn nhắm đúng lỗ hổng này.</p>
          </div>
        </div>
        <Button
          variant="lavender"
          disabled={generateMutation.isPending}
          onClick={() =>
            generateMutation.mutate(weakestNode.nodeId, {
              onSuccess: (result) => navigate(`/assessment/${result.testId}`),
            })
          }
        >
          {generateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Ôn tập ngay
        </Button>
      </CardContent>
    </Card>
  );
}
