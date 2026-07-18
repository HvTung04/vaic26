import { X, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import type { AssessmentContext } from '../types';

export interface AssessmentContextPanelProps {
  context: AssessmentContext;
  completion: number;
}

export function AssessmentContextPanel({ context, completion }: AssessmentContextPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Assessment Context</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">Difficulty Level</span>
              <span className="text-xs font-bold uppercase tracking-wide text-[#2F6B3D]">Adaptive</span>
            </div>
            <Slider defaultValue={[35]} max={100} step={1} disabled />
            <div className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
              <span>Conceptual</span>
              <span>Applied</span>
              <span>Advanced</span>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">Subject &amp; Grade</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="lavender" className="gap-1 pr-1.5">
                {context.subject}
                <X className="h-3 w-3 cursor-pointer" />
              </Badge>
              <Badge variant="lime" className="gap-1 pr-1.5">
                {context.gradeTag}
                <X className="h-3 w-3 cursor-pointer" />
              </Badge>
              {context.extraTags.map((tag) => (
                <Badge key={tag} variant="neutral" className="gap-1 pr-1.5">
                  {tag}
                  <X className="h-3 w-3 cursor-pointer" />
                </Badge>
              ))}
              <button className="flex items-center gap-1 rounded-full border border-dashed border-hairline px-2.5 py-1 text-[11px] font-semibold text-ink-faint transition-colors hover:border-ink/30 hover:text-ink">
                <Plus className="h-3 w-3" /> Add Tag
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-bento-sm bg-cream-100 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Est. Time</p>
              <p className="mt-1 font-serif text-xl font-bold text-ink">{context.estimatedMinutes} min</p>
            </div>
            <div className="rounded-bento-sm bg-cream-100 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Total Points</p>
              <p className="mt-1 font-serif text-xl font-bold text-ink">{context.totalPoints} pts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2 pt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-ink">Assessment Completion</span>
            <span className="font-semibold text-ink-soft">{completion}%</span>
          </div>
          <Progress value={completion} indicatorClassName="bg-lime" />
        </CardContent>
      </Card>
    </div>
  );
}
