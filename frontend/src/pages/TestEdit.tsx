import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { DashboardHeader } from '@/layouts/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import { useTestDetail, useUpdateTestQuestions } from '@/modules/tests/hooks/useTestDetail';
import type { QuestionDifficulty, TestQuestionTeacherView } from '@/modules/tests/types';

const DIFFICULTIES: QuestionDifficulty[] = ['easy', 'medium', 'hard'];
const DIFFICULTY_LABEL: Record<QuestionDifficulty, string> = { easy: 'Dễ', medium: 'TB', hard: 'Khó' };

export default function TestEdit() {
  const { testId = '' } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useTestDetail(testId);
  const updateMutation = useUpdateTestQuestions(testId);

  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<TestQuestionTeacherView[]>([]);

  useEffect(() => {
    if (!data) return;
    setTitle(data.title);
    setQuestions(data.questions);
  }, [data]);

  const updateQuestion = (id: string, patch: Partial<TestQuestionTeacherView>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const handleSave = () => {
    updateMutation.mutate(
      { title, questions },
      { onSuccess: () => navigate('/dashboard/tests') },
    );
  };

  if (isLoading) {
    return (
      <div>
        <DashboardHeader title="Đang tải..." />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data) return null;

  if (data.status !== 'not_started') {
    return (
      <div>
        <DashboardHeader
          title={data.title}
          actions={
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/tests')}>
              <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách
            </Button>
          }
        />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-ember" />
            <p className="max-w-sm text-sm text-ink-soft">
              Bài test này đã có học sinh làm bài nên không thể chỉnh sửa nội dung. Bạn có thể tạo một bài test mới thay thế.
            </p>
            <Button variant="outline" onClick={() => navigate(`/dashboard/tests/${testId}/results`)}>
              Xem kết quả bài test
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <DashboardHeader
        title="Chỉnh sửa bài test"
        subtitle="Chỉ có thể chỉnh sửa khi chưa có học sinh nào làm bài"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/tests')}>
              <ArrowLeft className="h-3.5 w-3.5" /> Huỷ
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Lưu thay đổi
            </Button>
          </>
        }
      />

      {updateMutation.isError && (
        <p className="mb-4 text-sm font-medium text-ember">
          {updateMutation.error instanceof Error ? updateMutation.error.message : 'Không thể lưu thay đổi.'}
        </p>
      )}

      <Card className="mb-4">
        <CardContent className="pt-6">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-faint">
            Tên bài test
          </label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="flex items-center justify-between">
                <Badge variant="sky">Câu {index + 1}</Badge>
                <Badge variant="lavender">{question.nodeName}</Badge>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-faint">
                  Nội dung câu hỏi
                </label>
                <Textarea
                  rows={2}
                  value={question.text}
                  onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-faint">
                    Đáp án đúng
                  </label>
                  <Input
                    value={question.answer}
                    onChange={(e) => updateQuestion(question.id, { answer: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-faint">
                    Độ khó
                  </label>
                  <div className="flex gap-2">
                    {DIFFICULTIES.map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => updateQuestion(question.id, { difficulty: level })}
                        className={cn(
                          'flex-1 rounded-bento-sm border px-3 py-2.5 text-xs font-semibold transition-colors',
                          question.difficulty === level
                            ? 'border-ink bg-ink text-cream'
                            : 'border-hairline bg-white text-ink-soft hover:bg-cream-100',
                        )}
                      >
                        {DIFFICULTY_LABEL[level]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
