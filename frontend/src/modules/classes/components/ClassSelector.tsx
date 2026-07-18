import { ChevronsUpDown, School } from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';
import { useSelectedClass } from '../SelectedClassContext';

/**
 * Teacher-info card, repurposed as the class picker every teacher-side page
 * scopes itself to. Sits at the top of the sidebar so switching classes is
 * always one click away.
 */
export function ClassSelector() {
  const { user } = useAuth();
  const { classId, setClassId, classes, isLoading } = useSelectedClass();

  return (
    <div className="rounded-bento-sm border border-hairline/70 bg-white p-3">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lavender text-ink">
          <School className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{user?.fullName ?? 'Giáo viên'}</p>
          <p className="truncate text-xs text-ink-faint">Đang xem lớp</p>
        </div>
      </div>

      <div className="relative">
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          disabled={isLoading || classes.length === 0}
          className="w-full cursor-pointer appearance-none rounded-bento-sm border border-hairline bg-cream-100 py-2 pl-3 pr-8 text-sm font-medium text-ink transition-colors hover:bg-cream-100/70 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {classes.length === 0 && (
            <option value="">{isLoading ? 'Đang tải...' : 'Chưa có lớp nào'}</option>
          )}
          {classes.map((klass) => (
            <option key={klass.id} value={klass.id}>
              {klass.name}
            </option>
          ))}
        </select>
        <ChevronsUpDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
      </div>
    </div>
  );
}
