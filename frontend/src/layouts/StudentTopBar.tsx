import { Link } from "react-router-dom";
import { Star, Flame } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface StudentTopBarProps {
  name: string;
  className: string;
  points: number;
  dailyStreak: number;
}

export function StudentTopBar({
  name,
  className,
  points,
  dailyStreak,
}: StudentTopBarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-bento-lg border border-lavender bg-white px-6 py-4 shadow-bento">
      <p className="font-serif text-2xl font-bold text-ink">GapLens</p>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 rounded-full bg-lavender-soft px-3 py-1.5 text-sm font-semibold text-[#6B3FCB]">
          <Star className="h-3.5 w-3.5 fill-current" /> Points:{" "}
          {points.toLocaleString("en-US")}
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-coral-soft px-3 py-1.5 text-sm font-semibold text-[#B23A1F]">
          <Flame className="h-3.5 w-3.5 fill-current" /> Daily Streak:{" "}
          {dailyStreak}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="hidden text-xs font-semibold text-ink-faint underline-offset-2 transition-colors hover:text-primary hover:underline sm:inline"
        >
          Giao diện giáo viên &rarr;
        </Link>
        <div className="text-right">
          <p className="text-sm font-semibold text-ink">{name}</p>
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
            {className}
          </p>
        </div>
        <Avatar className="h-10 w-10 border-2 border-lavender">
          <AvatarFallback className="bg-lavender text-ink">
            {name
              .split(" ")
              .slice(-2)
              .map((p) => p[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
