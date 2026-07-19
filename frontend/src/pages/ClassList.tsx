import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, Users2, ChevronUp, ChevronDown } from 'lucide-react';
import { DashboardHeader } from '@/layouts/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useSelectedClass } from '@/modules/classes/SelectedClassContext';
import { useClassStudents } from '@/modules/classes/hooks/useClassStudents';
import { useHeatmap } from '@/modules/dashboard/hooks/queries/useHeatmap';
import { heatmapToFrontend } from '@/modules/dashboard/services/dashboardApi';
import type { ClassStudent } from '@/modules/classes/types';

const PAGE_SIZE = 15;

type SortKey = 'rank' | 'name' | 'mastery';
type SortDir = 'asc' | 'desc';
type BandFilter = 'all' | 'Vững' | 'Khá' | 'Cần hỗ trợ' | 'Nguy cơ';

function initials(name: string) {
  return name.split(' ').slice(-2).map((p) => p[0]).join('');
}

function bandColor(band: string): string {
  if (band === 'Vững') return 'bg-emerald-100 text-emerald-700';
  if (band === 'Khá') return 'bg-sky-100 text-sky-700';
  if (band === 'Cần hỗ trợ') return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

function masteryBar(value: number): { color: string; width: string } {
  const pct = Math.round(value * 100);
  let color = 'bg-emerald-500';
  if (pct < 40) color = 'bg-red-500';
  else if (pct < 55) color = 'bg-amber-500';
  else if (pct < 70) color = 'bg-sky-500';
  return { color, width: `${pct}%` };
}

/** "Quản lý học sinh" — student roster with rankings, mastery, filters. */
export default function ClassList() {
  const navigate = useNavigate();
  const { classId, selectedClass, isLoading: isClassLoading } = useSelectedClass();
  const { data, isLoading: isStudentsLoading } = useClassStudents(classId);
  const { data: heatmapResponse, isLoading: isHeatmapLoading } = useHeatmap(classId);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [bandFilter, setBandFilter] = useState<BandFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Build heatmap lookup: studentId → { avgMastery, band, foundationGap }
  const heatmapMap = useMemo(() => {
    if (!heatmapResponse) return new Map<string, { avgMastery: number; band: string; foundationGap: boolean }>();
    const { heatmap } = heatmapToFrontend(heatmapResponse);
    const map = new Map<string, { avgMastery: number; band: string; foundationGap: boolean }>();
    for (const row of heatmap) {
      map.set(row.id, { avgMastery: row.avgMastery, band: row.band, foundationGap: row.foundationGap });
    }
    return map;
  }, [heatmapResponse]);

  // Merge students with heatmap data
  const enrichedStudents = useMemo(() => {
    const items = data?.items ?? [];
    return items.map<ClassStudent>((s) => {
      const hm = heatmapMap.get(s.id);
      return {
        ...s,
        avgMastery: hm?.avgMastery ?? null,
        band: hm?.band ?? 'Chưa có',
        foundationGap: hm?.foundationGap ?? false,
      };
    });
  }, [data, heatmapMap]);

  // Filter
  const filteredStudents = useMemo(() => {
    let result = enrichedStudents;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.fullName.toLowerCase().includes(q) || s.username.toLowerCase().includes(q),
      );
    }
    if (bandFilter !== 'all') {
      result = result.filter((s) => s.band === bandFilter);
    }
    return result;
  }, [enrichedStudents, search, bandFilter]);

  // Sort — create rank numbers first (sorted by mastery desc)
  const rankedStudents = useMemo(() => {
    const sorted = [...filteredStudents].sort((a, b) => {
      const aVal = a.avgMastery ?? -1;
      const bVal = b.avgMastery ?? -1;
      return bVal - aVal; // desc
    });
    return sorted.map((s, i) => ({ ...s, rank: i + 1 }));
  }, [filteredStudents]);

  const displayStudents = useMemo(() => {
    const arr = [...rankedStudents];
    const dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      if (sortKey === 'rank') return (a.rank - b.rank) * dir;
      if (sortKey === 'name') return a.fullName.localeCompare(b.fullName, 'vi') * dir;
      // mastery
      const aVal = a.avgMastery ?? -1;
      const bVal = b.avgMastery ?? -1;
      return (aVal - bVal) * dir;
    });
    return arr;
  }, [rankedStudents, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(displayStudents.length / PAGE_SIZE));
  const pagedStudents = displayStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const isLoading = isClassLoading || isStudentsLoading || isHeatmapLoading;

  // Summary stats
  const totalStudents = enrichedStudents.length;
  const avgMasteryAll = totalStudents > 0
    ? enrichedStudents.reduce((a, s) => a + (s.avgMastery ?? 0), 0) / totalStudents
    : 0;
  const bandCounts = useMemo(() => {
    const counts: Record<string, number> = { 'Vững': 0, 'Khá': 0, 'Cần hỗ trợ': 0, 'Nguy cơ': 0 };
    for (const s of enrichedStudents) {
      if (s.band in counts) counts[s.band]++;
    }
    return counts;
  }, [enrichedStudents]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return null;
    return sortDir === 'asc'
      ? <ChevronUp className="inline h-3 w-3 ml-0.5" />
      : <ChevronDown className="inline h-3 w-3 ml-0.5" />;
  }

  return (
    <div>
      <DashboardHeader
        title="Quản lý học sinh"
        subtitle={
          selectedClass
            ? `${selectedClass.name} · ${totalStudents} học sinh · TB thành thạo ${Math.round(avgMasteryAll * 100)}%`
            : 'Chọn một lớp ở thanh bên để xem danh sách'
        }
      />

      {isLoading && <Skeleton className="h-96 w-full" />}

      {!isLoading && !classId && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Users2 className="h-8 w-8 text-ink-faint" />
            <p className="text-sm text-ink-faint">Bạn chưa phụ trách lớp nào.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && classId && (
        <div className="flex flex-col gap-4">
          {/* Band summary pills */}
          <div className="flex flex-wrap gap-2">
            {(['Vững', 'Khá', 'Cần hỗ trợ', 'Nguy cơ'] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBandFilter(bandFilter === b ? 'all' : b)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  bandFilter === b
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-hairline bg-white text-ink-soft hover:border-primary/40'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${bandColor(b).split(' ')[0]}`} />
                {b}: {bandCounts[b]}
              </button>
            ))}
            {bandFilter !== 'all' && (
              <button
                onClick={() => setBandFilter('all')}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-ink-faint/40 px-3 py-1.5 text-xs text-ink-faint hover:border-ink-faint"
              >
                Xóa lọc
              </button>
            )}
          </div>

          {/* Search + sort controls */}
          <div className="flex items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <Input
                placeholder="Tìm theo tên hoặc username..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-ink-faint">Sắp xếp:</span>
              {([
                { key: 'rank' as SortKey, label: 'Xếp hạng' },
                { key: 'name' as SortKey, label: 'Tên' },
                { key: 'mastery' as SortKey, label: 'Thành thạo' },
              ]).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => toggleSort(opt.key)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    sortKey === opt.key
                      ? 'bg-primary/10 text-primary'
                      : 'text-ink-faint hover:bg-hairline/50 hover:text-ink-soft'
                  }`}
                >
                  {opt.label}
                  <SortIcon col={opt.key} />
                </button>
              ))}
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-hairline/70 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                      <th className="pb-3 pr-3 font-semibold w-12">#</th>
                      <th className="pb-3 pr-3 font-semibold">Học sinh</th>
                      <th className="pb-3 pr-3 font-semibold">Tên đăng nhập</th>
                      <th className="pb-3 pr-3 font-semibold text-center">Nhóm</th>
                      <th className="pb-3 pr-3 font-semibold text-right">Thành thạo</th>
                      <th className="pb-3 pr-3 font-semibold text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline/70">
                    {pagedStudents.map((student) => {
                      const masteryPct = student.avgMastery !== null ? Math.round(student.avgMastery * 100) : null;
                      const bar = student.avgMastery !== null ? masteryBar(student.avgMastery) : null;
                      return (
                        <tr key={student.id} className="group hover:bg-muted/30">
                          <td className="py-3 pr-3 tabular-nums text-ink-faint font-medium">
                            {student.rank}
                          </td>
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border border-hairline">
                                <AvatarFallback className="bg-lavender-soft text-xs text-ink">
                                  {initials(student.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium text-ink">{student.fullName}</span>
                                {student.foundationGap && (
                                  <span className="text-[10px] text-amber-600 font-medium">Thiếu nền tảng</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-3">
                            <Badge variant="neutral">@{student.username}</Badge>
                          </td>
                          <td className="py-3 pr-3 text-center">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${bandColor(student.band)}`}>
                              {student.band}
                            </span>
                          </td>
                          <td className="py-3 pr-3 text-right">
                            {masteryPct !== null ? (
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-1.5 rounded-full bg-hairline/50 overflow-hidden">
                                  <div className={`h-full rounded-full ${bar!.color}`} style={{ width: bar!.width }} />
                                </div>
                                <span className="tabular-nums font-medium text-ink w-9 text-right">{masteryPct}%</span>
                              </div>
                            ) : (
                              <span className="text-xs text-ink-faint">—</span>
                            )}
                          </td>
                          <td className="py-3 pr-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/dashboard/students/${student.id}`)}
                            >
                              Xem chi tiết
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {pagedStudents.length === 0 && (
                  <p className="py-8 text-center text-sm text-ink-faint">
                    {search || bandFilter !== 'all'
                      ? 'Không tìm thấy học sinh phù hợp.'
                      : 'Lớp chưa có học sinh nào.'}
                  </p>
                )}
              </div>

              {/* Pagination */}
              {displayStudents.length > PAGE_SIZE && (
                <div className="flex items-center justify-between pt-4 text-sm text-ink-soft">
                  <p>
                    Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, displayStudents.length)} / {displayStudents.length} học sinh
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-semibold text-ink-faint">
                      Trang {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
