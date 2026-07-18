import { useState } from 'react';
import { AlertCircle, BookOpen, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { QuestionConsole } from '@/modules/testTaking/components/QuestionConsole';
import { AnswerBreakdown } from '@/modules/testTaking/components/AnswerBreakdown';
import { usePracticeQuestions } from '../hooks/usePracticeQuestions';
import { useCheckPracticeAnswers } from '../hooks/useCheckPracticeAnswers';
import type { AttemptQuestion, GraphUpdate, QuestionResult } from '@/modules/testTaking/types';
import type { NodeState } from '@/modules/knowledgeGraph/types';
import type { TierProgress } from '../types';

const TIER_LABEL: Record<TierProgress['tier'], string> = {
  foundation: 'Nền tảng',
  bridge: 'Kết nối',
  application: 'Vận dụng',
};

/** One practice attempt in progress, purely client-side (no Test/Submission
 * on the backend) — keyed by nodeId from the parent so switching topics
 * always mounts a fresh instance instead of carrying over answers. */
function PracticeSession({
  questions,
  onGraded,
}: {
  questions: AttemptQuestion[];
  onGraded: (results: QuestionResult[], graphUpdates: GraphUpdate[]) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const checkMutation = useCheckPracticeAnswers();

  const currentQuestion = questions[currentIndex];

  return (
    <QuestionConsole
      question={currentQuestion}
      index={currentIndex}
      totalQuestions={questions.length}
      answer={answers[currentQuestion.id] ?? ''}
      onAnswer={(value) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))}
      onPrev={() => setCurrentIndex((i) => Math.max(0, i - 1))}
      onNext={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
      onSubmit={() => {
        if (checkMutation.isPending) return;
        const payload = questions.map((q) => ({ questionId: q.id, answer: answers[q.id] ?? '' }));
        checkMutation.mutate(payload, {
          onSuccess: (res) => onGraded(res.results, res.graphUpdates),
        });
      }}
      isFirst={currentIndex === 0}
      isLast={currentIndex === questions.length - 1}
      isSubmitting={checkMutation.isPending}
    />
  );
}

function PracticeResultPanel({
  results,
  graphUpdates,
  onRetry,
}: {
  results: QuestionResult[];
  graphUpdates: GraphUpdate[];
  onRetry: () => void;
}) {
  const total = results.length;
  const correct = results.filter((r) => r.isCorrect).length;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 rounded-bento-lg border border-hairline bg-white py-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-lime" />
        <div>
          <p className="font-display text-4xl font-bold text-ink">{percent}%</p>
          <p className="mt-1 text-sm text-ink-soft">
            {correct}/{total} câu đúng · {graphUpdates.length} node kiến thức cập nhật
          </p>
        </div>
        <Button variant="outline" onClick={onRetry}>
          Luyện tập lại
        </Button>
      </div>
      <AnswerBreakdown results={results} />
    </div>
  );
}

export interface LearningPathPracticeProps {
  tiers: TierProgress[];
  pathStatus?: 'active' | 'completed' | 'superseded';
  nodeNames?: Record<string, string>;
  masteryNodes?: NodeState[];
}

export function LearningPathPractice({ tiers, pathStatus, nodeNames, masteryNodes }: LearningPathPracticeProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<AttemptQuestion[] | null>(null);
  const [result, setResult] = useState<{ results: QuestionResult[]; graphUpdates: GraphUpdate[] } | null>(null);
  const questionsMutation = usePracticeQuestions();

  const masteryByNode = new Map((masteryNodes ?? []).map((n) => [n.nodeId, n.mastery]));

  function selectTopic(nodeId: string) {
    setSelectedNodeId(nodeId);
    setQuestions(null);
    setResult(null);
    questionsMutation.mutate(
      { nodeId },
      { onSuccess: (res) => setQuestions(res.questions) },
    );
  }

  const selectedNodeName = selectedNodeId ? nodeNames?.[selectedNodeId] ?? selectedNodeId : null;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Lộ trình học cá nhân hoá</CardTitle>
          <p className="mt-1 text-sm text-ink-soft">Chọn một chủ đề để luyện tập ngay với câu hỏi thật.</p>
        </div>
        {pathStatus === 'active' && (
          <Badge variant="lavender" className="shrink-0 gap-1">
            <Sparkles className="h-3 w-3" /> Do AI đề xuất
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex flex-col gap-5 lg:w-64 lg:shrink-0 lg:border-r lg:border-hairline/70 lg:pr-6">
          {tiers.map((tier) => (
            <div key={tier.tier}>
              <p className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-ink-faint">
                {TIER_LABEL[tier.tier]}
                {tier.avgMastery !== null && <span>{Math.round(tier.avgMastery * 100)}%</span>}
              </p>
              <div className="flex flex-col gap-1">
                {tier.nodeIds.map((nodeId) => {
                  const isSelected = nodeId === selectedNodeId;
                  const mastery = masteryByNode.get(nodeId);
                  return (
                    <button
                      key={nodeId}
                      type="button"
                      onClick={() => selectTopic(nodeId)}
                      className={cn(
                        'flex items-center justify-between gap-2 rounded-bento-sm px-3 py-2 text-left text-sm font-medium transition-colors',
                        isSelected ? 'bg-ink text-cream' : 'text-ink-soft hover:bg-ink/5 hover:text-ink',
                      )}
                    >
                      <span className="truncate">{nodeNames?.[nodeId] ?? nodeId}</span>
                      {mastery !== undefined && (
                        <span className={cn('shrink-0 text-xs font-semibold', isSelected ? 'text-cream/80' : 'text-ink-faint')}>
                          {Math.round(mastery * 100)}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1">
          {selectedNodeId && !result && (
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-faint">
              Đang luyện tập: <span className="text-ink">{selectedNodeName}</span>
            </p>
          )}

          {!selectedNodeId && (
            <div className="flex flex-col items-center gap-3 rounded-bento-lg border border-dashed border-hairline py-16 text-center">
              <BookOpen className="h-8 w-8 text-ink-faint" />
              <p className="text-sm text-ink-faint">Chọn một chủ đề bên trái để bắt đầu luyện tập.</p>
            </div>
          )}

          {selectedNodeId && questionsMutation.isPending && (
            <div className="flex flex-col items-center gap-3 rounded-bento-lg border border-hairline bg-white py-16 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-ember" />
              <p className="text-sm text-ink-soft">Đang chuẩn bị câu hỏi luyện tập...</p>
            </div>
          )}

          {selectedNodeId && !questionsMutation.isPending && questionsMutation.isError && (
            <div className="flex flex-col items-center gap-3 rounded-bento-lg border border-hairline bg-white py-16 text-center">
              <AlertCircle className="h-8 w-8 text-ink-faint" />
              <p className="text-sm text-ink-faint">Chưa có câu hỏi luyện tập cho chủ đề này.</p>
            </div>
          )}

          {questions && !result && (
            <PracticeSession
              key={selectedNodeId}
              questions={questions}
              onGraded={(results, graphUpdates) => setResult({ results, graphUpdates })}
            />
          )}

          {result && (
            <PracticeResultPanel
              results={result.results}
              graphUpdates={result.graphUpdates}
              onRetry={() => selectedNodeId && selectTopic(selectedNodeId)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
