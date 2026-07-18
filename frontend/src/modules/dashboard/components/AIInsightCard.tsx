import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export interface AIInsightCardProps {
  summary?: string;
  weakTopics?: string[];
  strongTopics?: string[];
  isLoading?: boolean;
}

export function AIInsightCard({ summary, weakTopics, strongTopics, isLoading }: AIInsightCardProps) {
  return (
    <Card className="bg-lavender-soft/40">
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lavender text-[#6B3FCB]">
          <Sparkles className="h-4 w-4" />
        </div>
        <CardTitle className="text-base">Phân tích AI</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-ink-soft">{summary}</p>
            <div className="flex flex-wrap gap-1.5">
              {weakTopics?.map((topic) => (
                <Badge key={topic} variant="coral">
                  {topic}
                </Badge>
              ))}
              {strongTopics?.map((topic) => (
                <Badge key={topic} variant="mint">
                  {topic}
                </Badge>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
