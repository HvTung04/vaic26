import { useState, useMemo } from 'react';
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

function isSameDay(a: Date, day: number, month: number, year: number) {
  return a.getDate() === day && a.getMonth() === month && a.getFullYear() === year;
}

export interface MiniCalendarProps {
  /** Ngày đang được chọn — thông tin của ngày này sẽ hiển thị ở tab bên trái. */
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  /** Optional: dates that have events (YYYY-MM-DD strings). If provided, only these show dots. */
  eventDates?: string[];
}

export function MiniCalendar({ selectedDate, onSelectDate, eventDates }: MiniCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Build a Set of date keys that have events for fast lookup
  const eventDateSet = useMemo(() => {
    if (!eventDates) return null;
    return new Set(eventDates);
  }, [eventDates]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else { setCurrentMonth(currentMonth - 1); }
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else { setCurrentMonth(currentMonth + 1); }
  };

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
            const cellDate = new Date(currentYear, currentMonth, day);
            const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            // If eventDates provided, use it; otherwise show no dots
            const hasEvents = eventDateSet ? eventDateSet.has(dateKey) : false;
            const isToday = isSameDay(today, day, currentMonth, currentYear);
            const isSelected = isSameDay(selectedDate, day, currentMonth, currentYear);

            return (
              <button
                key={day}
                type="button"
                onClick={() => onSelectDate(cellDate)}
                className={cn(
                  'relative flex h-9 w-full items-center justify-center rounded-bento-sm text-sm font-medium transition-all',
                  isSelected && !isToday && 'bg-ink text-cream font-bold',
                  isToday && !isSelected && 'bg-primary text-cream font-bold',
                  isToday && isSelected && 'bg-primary text-cream font-bold ring-2 ring-primary/40',
                  !isSelected && !isToday && 'text-ink hover:bg-cream-100',
                )}
              >
                {day}
                {hasEvents && (
                  <span className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-0.5">
                    <span
                      className={cn('h-1.5 w-1.5 rounded-full', isSelected || isToday ? 'bg-cream/80' : 'bg-primary')}
                    />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
