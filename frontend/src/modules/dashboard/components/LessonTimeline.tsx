import { Check, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';
import { cn } from '@/utils/cn';

const LESSONS = [
  { id: 'L6-t1', label: 'Số tự nhiên', grade: 6, status: 'completed' as const },
  { id: 'L6-t2', label: 'Số nguyên', grade: 6, status: 'completed' as const },
  { id: 'L6-t3', label: 'Phân số & Số thập phân', grade: 6, status: 'completed' as const },
  { id: 'L7-t3', label: 'Biểu thức đại số', grade: 7, status: 'completed' as const },
  { id: 'L7-t7', label: 'Hình học trực quan', grade: 7, status: 'completed' as const },
  { id: 'L8-t1', label: 'Đa thức & Hằng đẳng thức', grade: 8, status: 'current' as const },
  { id: 'L8-t5', label: 'Tứ giác & Pythagore', grade: 8, status: 'upcoming' as const },
  { id: 'L8-t6', label: 'Thales & Đồng dạng', grade: 8, status: 'upcoming' as const },
  { id: 'L8-t7', label: 'Hình chóp đều', grade: 8, status: 'upcoming' as const },
];

const CIRCLE = 24;
const HALF = CIRCLE / 2;

function Node({ lesson, isFirst, isLast, isPrevDone }: {
  lesson: typeof LESSONS[number];
  isFirst: boolean;
  isLast: boolean;
  isPrevDone: boolean;
}) {
  const isCurrent = lesson.status === 'current';
  const isDone = lesson.status === 'completed';
  const lineColor = isDone ? 'var(--color-forest)' : 'var(--color-ink)';
  const lineOpacity = isDone ? 0.3 : 0.12;

  return (
    <div className="relative flex flex-col items-center w-20 shrink-0">
      {/* Incoming line: left edge → circle center */}
      {!isFirst && (
        <div
          className="absolute h-px"
          style={{ top: HALF, left: 0, width: `calc(50% - ${HALF}px)`, background: lineColor, opacity: lineOpacity }}
        />
      )}
      {/* Outgoing line: circle center → right edge */}
      {!isLast && (
        <div
          className="absolute h-px"
          style={{ top: HALF, left: `calc(50% + ${HALF}px)`, right: 0, background: lineColor, opacity: lineOpacity }}
        />
      )}

      {/* Circle */}
      <div
        className={cn(
          'relative z-10 flex items-center justify-center rounded-full transition-all',
        )}
        style={{
          width: CIRCLE,
          height: CIRCLE,
          borderWidth: 2,
          ...(isDone && { borderColor: 'var(--color-forest)', backgroundColor: 'var(--color-cream)', color: 'var(--color-forest)' }),
          ...(isCurrent && { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-cream)', color: 'var(--color-primary)', transform: 'scale(1.1)', boxShadow: '0 0 0 4px var(--color-primary), 0 0 12px rgba(59,130,246,0.25)' }),
          ...(!isDone && !isCurrent && { borderColor: 'rgba(28,26,36,0.15)', backgroundColor: 'var(--color-cream)', color: 'var(--color-ink-faint)' }),
        }}
      >
        {isDone && <Check className="h-3 w-3" strokeWidth={3} />}
        {isCurrent && <Flame className="h-3 w-3" strokeWidth={2.5} />}
      </div>

      {/* Label */}
      <span
        className={cn(
          'mt-1.5 text-[10px] leading-tight text-center whitespace-nowrap max-w-[72px] truncate',
          isCurrent ? 'text-primary font-semibold' : 'text-ink-faint',
        )}
        title={lesson.label}
      >
        {lesson.label}
      </span>
    </div>
  );
}

export function LessonTimeline() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -180 : 180, behavior: 'smooth' });
  };

  return (
    <div className="relative mb-5">
      {canScrollLeft && (
        <button type="button" onClick={() => scroll('left')} className="absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-cream to-transparent flex items-center justify-start">
          <ChevronLeft className="h-4 w-4 text-ink-faint" />
        </button>
      )}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex overflow-x-auto scrollbar-hide py-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {LESSONS.map((lesson, i) => (
          <Node
            key={lesson.id}
            lesson={lesson}
            isFirst={i === 0}
            isLast={i === LESSONS.length - 1}
            isPrevDone={i > 0 && LESSONS[i - 1].status === 'completed'}
          />
        ))}
      </div>
      {canScrollRight && (
        <button type="button" onClick={() => scroll('right')} className="absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-cream to-transparent flex items-center justify-end">
          <ChevronRight className="h-4 w-4 text-ink-faint" />
        </button>
      )}
    </div>
  );
}
