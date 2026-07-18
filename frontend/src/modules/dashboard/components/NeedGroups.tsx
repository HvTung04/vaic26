import { useState } from 'react';
import { Users, ChevronDown, ArrowUpRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import type { NeedGroup } from '../types';

function initials(name: string) {
  return name.split(' ').slice(-2).map((p) => p[0]).join('').toUpperCase();
}

function GroupRow({
  group,
  isFirst,
  onSelectStudent,
  onCreateGroup,
}: {
  group: NeedGroup;
  isFirst: boolean;
  onSelectStudent?: (id: string) => void;
  onCreateGroup?: (topicKey: string) => void;
}) {
  const [open, setOpen] = useState(isFirst);

  return (
    <div className="rounded-bento-sm border border-hairline/70 bg-cream overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-cream-100"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-maroon/10 text-maroon">
          <Users className="h-3.5 w-3.5" />
        </span>
        <span className="flex-1 truncate text-sm font-semibold text-ink">{group.topicLabel}</span>
        <div className="flex items-center gap-2">
          {group.students.slice(0, 5).map((s, i) => (
            <span
              key={s.id}
              title={s.name}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary text-[8px] font-bold ring-2 ring-cream"
              style={{ marginLeft: i > 0 ? -6 : 0, zIndex: 5 - i }}
            >
              {initials(s.name)}
            </span>
          ))}
          {group.students.length > 5 && (
            <span className="text-[11px] font-medium text-ink-faint">+{group.students.length - 5}</span>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-maroon/10 px-2 py-0.5 text-[11px] font-bold text-maroon">
          {group.students.length} HS
        </span>
        <ChevronDown className={cn('h-4 w-4 text-ink-faint transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="border-t border-hairline/50 bg-white px-3 py-2.5">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {group.students.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectStudent?.(s.id)}
                className="rounded-full border border-hairline bg-cream-100 px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:border-ink/20 hover:text-ink"
              >
                {s.name}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onCreateGroup?.(group.topicKey)}
          >
            Tạo nhóm dạy bù <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

export interface NeedGroupsProps {
  groups?: NeedGroup[];
  isLoading?: boolean;
  onCreateGroup?: (topicKey: string) => void;
  onSelectStudent?: (id: string) => void;
}

export function NeedGroups({ groups, isLoading, onCreateGroup, onSelectStudent }: NeedGroupsProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base">Nhóm dạy bù theo chủ đề</CardTitle>
          <p className="mt-0.5 text-xs text-ink-faint">Gom học sinh cùng yếu một chủ đề để dạy chung</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2">
        {isLoading ? (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </>
        ) : !groups?.length ? (
          <p className="py-8 text-center text-sm text-ink-faint">Chưa có chủ đề nào cần gom nhóm.</p>
        ) : (
          groups.map((g, i) => (
            <GroupRow
              key={g.topicKey}
              group={g}
              isFirst={i === 0}
              onSelectStudent={onSelectStudent}
              onCreateGroup={onCreateGroup}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
