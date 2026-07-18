import { useNavigate } from "react-router-dom";
import { Calendar, Plus, Users2 } from "lucide-react";
import { DashboardHeader } from "@/layouts/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClassTelemetry } from "@/modules/dashboard/hooks/useClassTelemetry";
import { PriorityAlertsCard } from "@/modules/dashboard/components/PriorityAlerts";
import { ClassKnowledgeGaps } from "@/modules/dashboard/components/ClassKnowledgeGaps";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useClassTelemetry();

  return (
    <div>
      <DashboardHeader
        title={`Chào buổi sáng, ${data?.teacherName ?? "..."}`}
        subtitle={
          isLoading
            ? "Đang tải dữ liệu lớp học..."
            : `Hệ thống ghi nhận ${data?.studentsNeedingSupport ?? 0} học sinh cần hỗ trợ ngay lập tức.`
        }
        actions={
          <>
            <Badge
              variant="neutral"
              className="gap-1.5 px-3 py-2 text-xs normal-case tracking-normal"
            >
              <Calendar className="h-3.5 w-3.5" />{" "}
              {data?.term ?? "Học kỳ I - 2024"}
            </Badge>
            <Button
              variant="primary"
              onClick={() => navigate("/question-bank")}
            >
              <Plus className="h-4 w-4" /> Tạo bài kiểm tra
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-6">
        <PriorityAlertsCard
          data={data?.alerts}
          isLoading={isLoading}
          onSelectStudent={(id) => navigate(`/students/${id}`)}
        />
        <ClassKnowledgeGaps
          topics={data?.knowledgeGaps}
          moreCount={data?.moreGapTopicsCount}
          isLoading={isLoading}
        />
      </div>

      {/* <div className="mt-6 flex flex-col items-center gap-3 rounded-bento-lg border-2 border-dashed border-hairline p-10 text-center">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-faint">
          <Users2 className="h-4 w-4" /> Khu vực tương tác
        </p>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => navigate("/students/minh-tuan")}
        >
          Mô phỏng: Mở chi tiết học sinh (Minh Tuấn)
        </Button>
      </div> */}
    </div>
  );
}
