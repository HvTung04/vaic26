/** Lịch dạy + sự kiện của giáo viên (mock deterministic). Một ngày có thể có nhiều
 * tiết ở nhiều lớp khác nhau — calendar và DayLessonsCard cùng đọc từ đây. */

export type CalendarEventKind = 'lesson' | 'exam' | 'meeting' | 'deadline';

export interface ScheduledLesson {
  id: string;
  classLabel: string;
  subject: string;
  topic: string;
  book: string;
  topicKey: string;
  period: string;
  time: string;
  studentCount: number;
}

export interface CalendarEvent {
  id: string;
  kind: CalendarEventKind;
  dot: string;
  lesson?: ScheduledLesson;
}

function lessonEvent(lesson: ScheduledLesson): CalendarEvent {
  return {
    id: lesson.id,
    kind: 'lesson',
    dot: 'bg-[#1C5AAE]',
    lesson,
  };
}

function simpleEvent(id: string, kind: CalendarEventKind, dot: string): CalendarEvent {
  return { id, kind, dot };
}

export const CALENDAR_EVENTS: Record<string, CalendarEvent[]> = {
  '2026-07-08': [
    lessonEvent({
      id: 'lsn-0708-1',
      classLabel: 'Lớp 8A1',
      subject: 'Toán',
      topic: 'Ôn tập Phân số',
      book: 'Chân trời sáng tạo',
      topicKey: 'frac',
      period: 'Tiết 2',
      time: '07:45 - 08:30',
      studentCount: 34,
    }),
  ],
  '2026-07-15': [
    simpleEvent('exam-0715', 'exam', 'bg-primary'),
  ],
  '2026-07-18': [
    lessonEvent({
      id: 'lsn-0718-1',
      classLabel: 'Lớp 8A1',
      subject: 'Toán',
      topic: 'Hằng đẳng thức đáng nhớ',
      book: 'Chân trời sáng tạo',
      topicKey: 'iden',
      period: 'Tiết 1',
      time: '07:00 - 07:45',
      studentCount: 34,
    }),
    lessonEvent({
      id: 'lsn-0718-2',
      classLabel: 'Lớp 8A3',
      subject: 'Toán',
      topic: 'Phân tích đa thức',
      book: 'Chân trời sáng tạo',
      topicKey: 'fact',
      period: 'Tiết 3',
      time: '09:00 - 09:45',
      studentCount: 31,
    }),
    lessonEvent({
      id: 'lsn-0718-3',
      classLabel: 'Lớp 7A2',
      subject: 'Toán',
      topic: 'Biểu thức đại số',
      book: 'Kết nối tri thức',
      topicKey: 'expr7',
      period: 'Tiết 5',
      time: '14:00 - 14:45',
      studentCount: 36,
    }),
    simpleEvent('meet-0718', 'meeting', 'bg-forest'),
  ],
  '2026-07-22': [
    simpleEvent('exam-0722', 'exam', 'bg-ember'),
  ],
  '2026-07-25': [
    simpleEvent('dl-0725', 'deadline', 'bg-ink-faint'),
  ],
};

export function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getEventsForDate(date: Date): CalendarEvent[] {
  return CALENDAR_EVENTS[formatDateKey(date)] ?? [];
}

export function getLessonsForDate(date: Date): ScheduledLesson[] {
  return getEventsForDate(date)
    .filter((e): e is CalendarEvent & { lesson: ScheduledLesson } => e.kind === 'lesson' && e.lesson != null)
    .map((e) => e.lesson);
}
