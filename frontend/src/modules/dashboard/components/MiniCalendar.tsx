import { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/utils/cn';

const MONTHS = ['Th 1', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'Th 8', 'Th 9', 'Th 10', 'Th 11', 'Th 12'];
const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MOCK_EVENTS: Record<string, { label: string; bg: string; dot: string }[]> = {
  '2026-07-08': [{ label: 'Ôn tập Phân số', bg: 'bg-lavender-soft/50', dot: 'bg-lavender' }],
  '2026-07-15': [{ label: 'KT 15 phút', bg: 'bg-primary/8', dot: 'bg-primary' }],
  '2026-07-18': [{ label: 'Họp phụ huynh', bg: 'bg-lime-soft/60', dot: 'bg-forest' }],
  '2026-07-22': [{ label: 'KT giữa kỳ', bg: 'bg-coral-soft/40', dot: 'bg-ember' }],
  '2026-07-25': [{ label: 'Deadline bài tập', bg: 'bg-cream-200/80', dot: 'bg-ink-faint' }],
};

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function MiniCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else { setCurrentMonth(currentMonth - 1); }
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else { setCurrentMonth(currentMonth + 1); }
  };

  const selectedKey = selectedDay != null ? formatDateKey(currentYear, currentMonth, selectedDay) : null;
  const selectedEvents = selectedKey ? MOCK_EVENTS[selectedKey] ?? [] : [];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-1">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-ink-faint" />
          <span className="text-base font-semibold text-ink">Lịch tháng</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={prevMonth} className="flex h-7 w-7 items-center justify-center rounded-bento-sm text-ink-faint transition-colors hover:bg-cream-100 hover:text-ink">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[80px] text-center text-sm font-bold text-ink">
            {MONTHS[currentMonth]} {currentYear}
          </span>
          <button type="button" onClick={nextMonth} className="flex h-7 w-7 items-center justify-center rounded-bento-sm text-ink-faint transition-colors hover:bg-cream-100 hover:text-ink">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2 pt-0">
        {/* Day headers */}
        <div className="grid grid-cols-7">
          {DAYS.map((d, i) => (
            <div key={d} className={cn('py-1 text-center text-xs font-bold', i === 0 ? 'text-primary/60' : 'text-ink-faint')}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-9" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateKey = formatDateKey(currentYear, currentMonth, day);
            const hasEvent = MOCK_EVENTS[dateKey];
            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            const isSelected = day === selectedDay;

            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={cn(
                  'relative flex h-9 w-full items-center justify-center rounded-bento-sm text-sm font-medium transition-all',
                  isSelected && !isToday && 'bg-ink text-cream font-bold',
                  isToday && !isSelected && 'bg-primary text-cream font-bold',
                  isToday && isSelected && 'bg-primary text-cream font-bold ring-2 ring-primary/40',
                  !isSelected && !isToday && 'text-ink hover:bg-cream-100',
                )}
              >
                {day}
                {hasEvent && (
                  <span className={cn(
                    'absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full',
                    isSelected || isToday ? 'bg-cream/80' : hasEvent[0].dot,
                  )} />
                )}
              </button>
            );
          })}
        </div>

        {/* Events */}
        <div className="mt-1 flex flex-col gap-1.5">
          <span className="text-xs font-bold text-ink-faint">
            {selectedDay != null
              ? selectedEvents.length > 0
                ? `Ngày ${selectedDay}`
                : `Ngày ${selectedDay} · Trống`
              : 'Chọn ngày'}
          </span>
          {selectedEvents.map((e, i) => (
            <div key={i} className={cn('flex items-center gap-2 rounded-bento-sm px-3 py-2', e.bg)}>
              <span className={cn('h-2 w-2 rounded-full shrink-0', e.dot)} />
              <span className="text-xs font-medium text-ink">{e.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
