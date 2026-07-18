import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Plus } from "lucide-react";
import { DashboardHeader } from "@/layouts/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClassTelemetry } from "@/modules/dashboard/hooks/useClassTelemetry";
import { ClassKnowledgeGaps } from "@/modules/dashboard/components/ClassKnowledgeGaps";
import { ClassLeaderboard } from "@/modules/dashboard/components/ClassLeaderboard";
import { TopicStudentGroups } from "@/modules/dashboard/components/TopicStudentGroups";
import { ClassDiagnosticStats } from "@/modules/dashboard/components/ClassDiagnosticStats";
import { CurrentLessonCard } from "@/modules/dashboard/components/CurrentLessonCard";
import { MiniCalendar } from "@/modules/dashboard/components/MiniCalendar";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useClassTelemetry();
  const needSupport = data?.studentsNeedingSupport ?? 0;
  const [hoveredStudentId, setHoveredStudentId] = useState<string | null>(null);
  const [highlightedGroupIds, setHighlightedGroupIds] = useState<string[] | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader
        title={`Chào buổi sáng, ${data?.teacherName ?? "..."}`}
        subtitle={
          isLoading
            ? "Đang phân tích dữ liệu lớp học..."
            : `Hệ thống phát hiện ${needSupport} học sinh cần hỗ trợ ngay — đã sắp xếp theo độ ưu tiên.`
        }
        actions={
          <>
            <Badge
              variant="neutral"
              className="gap-1.5 px-3 py-2 text-xs normal-case tracking-normal"
            >
              <Calendar className="h-3.5 w-3.5" />{" "}
              {data?.term ?? "Học kỳ I · 2024"}
            </Badge>
            <Button
              variant="primary"
              onClick={() => navigate("/dashboard/question-bank")}
            >
              <Plus className="h-4 w-4" /> Tạo bài kiểm tra
            </Button>
          </>
        }
      />

      {/* Stats 2x2 + Current Lesson + Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="grid gap-3 sm:grid-cols-[1fr_1fr_320px]"
      >
        {/* 4 stat tiles - 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          <ClassDiagnosticStats heatmap={data?.heatmap} alerts={data?.alerts} isLoading={isLoading} />
        </div>

        {/* Current lesson */}
        <CurrentLessonCard lesson={data?.currentLesson} isLoading={isLoading} />

        {/* Calendar */}
        <MiniCalendar />
      </motion.div>

      {/* Knowledge gaps - full width */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.18 }}
        className="mb-8"
      >
        <ClassKnowledgeGaps
          topics={data?.knowledgeGaps}
          moreCount={data?.moreGapTopicsCount}
          isLoading={isLoading}
        />
      </motion.div>

      {/* Leaderboard + Topic groups side by side */}
      <div className="grid gap-6 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.28 }}
        >
          <ClassLeaderboard
            heatmap={data?.heatmap}
            topics={data?.heatmapTopics}
            isLoading={isLoading}
            onSelectStudent={(id) => navigate(`/dashboard/students/${id}`)}
            onHoverStudent={setHoveredStudentId}
            highlightStudentIds={highlightedGroupIds}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.34 }}
        >
          <TopicStudentGroups
            heatmap={data?.heatmap}
            topics={data?.heatmapTopics}
            isLoading={isLoading}
            onSelectStudent={(id) => navigate(`/dashboard/students/${id}`)}
            highlightStudentId={hoveredStudentId}
            onHoverGroup={setHighlightedGroupIds}
          />
        </motion.div>
      </div>
    </div>
  );
}
