import { Check, Flame, Lock, Flag, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import type { LearningPath, LearningPathStep } from "../types";

const stepIcon: Record<LearningPathStep["status"], typeof Check> = {
  completed: Check,
  active: Flame,
  locked: Lock,
  target: Flag,
};

const nodeStyles: Record<LearningPathStep["status"], string> = {
  completed: "bg-forest text-white ring-4 ring-forest/15",
  active: "bg-sky text-[#1C5AAE] ring-4 ring-sky/40",
  locked: "bg-cream-100 text-ink-faint",
  target: "bg-cream-100 text-ink-faint",
};

const labelStyles: Record<LearningPathStep["status"], string> = {
  completed: "text-ink",
  active: "text-[#1C5AAE]",
  locked: "text-ink-faint",
  target: "text-ink-faint",
};

export interface LearningPathMapProps {
  path: LearningPath;
}

export function LearningPathMap({ path }: LearningPathMapProps) {
  const isVerified = path.status === "verified";

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-semibold text-ink">
            Lộ trình học tập cá nhân hóa
          </h3>
          <p className="text-sm text-ink-soft">{path.goal}</p>
        </div>
        {path.status === "verified" && (
          <Badge variant="mint" className="shrink-0 gap-1">
            <ShieldCheck className="h-3 w-3" /> Giáo viên xác nhận
          </Badge>
        )}
        {path.status === "ai_suggested" && (
          <Badge variant="lavender" className="shrink-0 gap-1">
            <Sparkles className="h-3 w-3" />
            {isVerified ? "Giáo viên xác nhận" : "AI đề xuất"}
          </Badge>
        )}
      </div>
      <div className="relative flex items-start justify-between">
        <div className="absolute left-6 right-6 top-6 h-px border-t-2 border-dashed border-hairline" />
        {path.steps.map((step) => {
          const Icon = stepIcon[step.status];
          return (
            <div
              key={step.id}
              className="relative flex flex-1 flex-col items-center gap-2 text-center"
            >
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full",
                  nodeStyles[step.status],
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    labelStyles[step.status],
                  )}
                >
                  {step.label}
                </p>
                <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                  {step.sublabel}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
