import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DashboardHeader } from '@/layouts/DashboardHeader';
import { Button } from '@/components/ui/button';
import { useStudentResults } from '@/modules/testTaking/hooks/useStudentResults';
import { TestHistoryFullList } from '@/modules/testTaking/components/TestHistoryFullList';
import { useStudentProfile } from '@/modules/dashboard/hooks/queries/useStudentProfile';

export default function StudentTestHistoryTeacher() {
  const { studentId = '' } = useParams();
  const navigate = useNavigate();
  const { data: profile } = useStudentProfile(studentId);
  const { data: results, isLoading } = useStudentResults(studentId);

  return (
    <div>
      <DashboardHeader
        title="Lịch sử bài kiểm tra"
        subtitle={profile ? `Toàn bộ bài kiểm tra của ${profile.fullName}` : undefined}
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/students/${studentId}`)}>
            <ArrowLeft className="h-3.5 w-3.5" /> Quay lại
          </Button>
        }
      />
      <TestHistoryFullList
        history={results}
        isLoading={isLoading}
        getRowHref={(submissionId) => `/dashboard/submissions/${submissionId}`}
      />
    </div>
  );
}
