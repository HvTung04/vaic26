import { Badge } from '@/components/ui/badge';
import type { TestCompletionStatus } from '../types';

const STATUS_META: Record<TestCompletionStatus, { label: string; variant: 'lime' | 'sky' | 'neutral' }> = {
  completed: { label: 'Đã làm', variant: 'lime' },
  in_progress: { label: 'Đang làm', variant: 'sky' },
  not_started: { label: 'Chưa làm', variant: 'neutral' },
};

export function TestStatusBadge({ status }: { status: TestCompletionStatus }) {
  const meta = STATUS_META[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
