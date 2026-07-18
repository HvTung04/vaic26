import { ShieldCheck, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TIER_LABEL } from './LearningPathPractice';
import type { PathStatus, TierProgress } from '../types';

export interface LearningPathTextSummaryProps {
  tiers: TierProgress[];
  pathStatus?: PathStatus;
  nodeNames?: Record<string, string>;
  generatedAt?: string;
  isLoading?: boolean;
  hasPath: boolean;
}

/**
 * Teacher view of a student's learning path — plain text only (no interactive
 * tier map / practice picker like the student's own dashboard), since the
 * teacher-facing path UI isn't built yet. The suggestion box + generate/verify
 * actions live alongside this in PathEditorPanel.
 */
export function LearningPathTextSummary({
  tiers,
  pathStatus,
  nodeNames,
  generatedAt,
  isLoading,
  hasPath,
}: LearningPathTextSummaryProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!hasPath) {
    return (
      <div>
        <h3 className="font-serif text-lg font-semibold text-ink">Lộ trình học cá nhân hoá</h3>
        <p className="mt-2 text-sm text-ink-faint">
          Học sinh chưa có lộ trình học tập nào. Dùng ô gợi ý bên dưới rồi bấm &ldquo;AI Update Path&rdquo; để tạo lộ
          trình mới.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-semibold text-ink">Lộ trình học cá nhân hoá</h3>
          {generatedAt && (
            <p className="text-xs text-ink-faint">Cập nhật lúc {new Date(generatedAt).toLocaleString('vi-VN')}</p>
          )}
        </div>
        {pathStatus === 'verified' ? (
          <Badge variant="mint" className="shrink-0 gap-1">
            <ShieldCheck className="h-3 w-3" /> Đã xác nhận
          </Badge>
        ) : (
          <Badge variant="lavender" className="shrink-0 gap-1">
            <Sparkles className="h-3 w-3" /> AI đề xuất
          </Badge>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {tiers.map((tier) => (
          <li key={tier.tier} className="rounded-bento-sm bg-cream-100 p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-ink">{TIER_LABEL[tier.tier]}</span>
              {tier.avgMastery !== null && (
                <span className="shrink-0 text-xs font-bold text-ink-soft">
                  {Math.round(tier.avgMastery * 100)}% nắm vững
                </span>
              )}
            </div>
            <p className="text-xs text-ink-soft">{tier.nodeIds.map((id) => nodeNames?.[id] ?? id).join(', ')}</p>
            {tier.rationale && <p className="mt-1 text-xs italic text-ink-faint">{tier.rationale}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
