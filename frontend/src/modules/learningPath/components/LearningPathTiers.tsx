import { Check, Flame, Lock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import type { TierProgress, TierProgressStatus } from '../types';

const TIER_LABEL: Record<TierProgress['tier'], string> = {
  foundation: 'Nền tảng',
  bridge: 'Kết nối',
  application: 'Vận dụng',
};

const stepIcon: Record<TierProgressStatus, typeof Check> = {
  completed: Check,
  current: Flame,
  upcoming: Lock,
};

const nodeStyles: Record<TierProgressStatus, string> = {
  completed: 'bg-forest text-white ring-4 ring-forest/15',
  current: 'bg-sky text-[#1C5AAE] ring-4 ring-sky/40',
  upcoming: 'bg-cream-100 text-ink-faint',
};

const labelStyles: Record<TierProgressStatus, string> = {
  completed: 'text-ink',
  current: 'text-[#1C5AAE]',
  upcoming: 'text-ink-faint',
};

export interface LearningPathTiersProps {
  tiers: TierProgress[];
  pathStatus?: 'active' | 'completed' | 'superseded';
  nodeNames?: Record<string, string>;
}

export function LearningPathTiers({ tiers, pathStatus, nodeNames }: LearningPathTiersProps) {
  const current = tiers.find((t) => t.status === 'current');

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-semibold text-ink">Lộ trình học cá nhân hoá</h3>
          <p className="text-sm text-ink-soft">
            {current ? current.rationale : 'Bạn đã hoàn thành lộ trình hiện tại — tuyệt vời!'}
          </p>
        </div>
        {pathStatus === 'active' && (
          <Badge variant="lavender" className="shrink-0 gap-1">
            <Sparkles className="h-3 w-3" /> Do AI đề xuất
          </Badge>
        )}
      </div>
      <div className="relative flex items-start justify-between">
        <div className="absolute left-6 right-6 top-6 h-px border-t-2 border-dashed border-hairline" />
        {tiers.map((tier) => {
          const Icon = stepIcon[tier.status];
          return (
            <div key={tier.tier} className="relative flex flex-1 flex-col items-center gap-2 text-center">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', nodeStyles[tier.status])}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className={cn('text-sm font-semibold', labelStyles[tier.status])}>{TIER_LABEL[tier.tier]}</p>
                <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                  {tier.avgMastery !== null ? `${Math.round(tier.avgMastery * 100)}% nắm vững` : 'Chưa có dữ liệu'}
                </p>
                <p className="mt-1 max-w-[9rem] text-[11px] text-ink-faint">
                  {tier.nodeIds.map((id) => nodeNames?.[id] ?? id).join(' · ')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
