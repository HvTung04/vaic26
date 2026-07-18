import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DashboardHeader } from '@/layouts/DashboardHeader';
import { Button } from '@/components/ui/button';
import { useStudentResults } from '@/modules/testTaking/hooks/useStudentResults';
import { TestHistoryFullList } from '@/modules/testTaking/components/TestHistoryFullList';

export default function StudentTestHistory() {
  const navigate = useNavigate();
  const { data: results, isLoading } = useStudentResults();

  return (
    <div>
      <DashboardHeader
        title="Lịch sử bài kiểm tra"
        subtitle="Toàn bộ các bài kiểm tra đã nộp và đã được chấm"
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate('/student')}>
            <ArrowLeft className="h-3.5 w-3.5" /> Quay lại
          </Button>
        }
      />
      <TestHistoryFullList history={results} isLoading={isLoading} />
    </div>
  );
}
