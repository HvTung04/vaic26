import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Plus } from "lucide-react";
import { DashboardHeader } from "@/layouts/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSelectedClass } from "@/modules/classes/SelectedClassContext";
import { useGapRadar } from "@/modules/dashboard/hooks/queries/useGapRadar";
import { usePriorityQueue } from "@/modules/dashboard/hooks/queries/usePriorityQueue";
import { useHeatmap } from "@/modules/dashboard/hooks/queries/useHeatmap";
import { useSchedule } from "@/modules/dashboard/hooks/queries/useSchedule";
import { useScheduleDates } from "@/modules/dashboard/hooks/queries/useScheduleDates";
import {
  gapRadarToTopics,
  priorityToAlerts,
  heatmapToFrontend,
  scheduleToLessons,
} from "@/modules/dashboard/services/dashboardApi";
import { ClassKnowledgeGaps } from "@/modules/dashboard/components/ClassKnowledgeGaps";
import { ClassLeaderboard } from "@/modules/dashboard/components/ClassLeaderboard";
import { TopicStudentGroups } from "@/modules/dashboard/components/TopicStudentGroups";
import { ClassDiagnosticStats } from "@/modules/dashboard/components/ClassDiagnosticStats";
import { DayLessonsCard } from "@/modules/dashboard/components/DayLessonsCard";
import { MiniCalendar } from "@/modules/dashboard/components/MiniCalendar";

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { classId } = useSelectedClass();

  const { data: gapRadar, isLoading: gapLoading } = useGapRadar(classId);
  const { data: priorityQueue, isLoading: pqLoading } = usePriorityQueue(classId);
  const { data: heatmapResponse, isLoading: hmLoading } = useHeatmap(classId);

  const [hoveredStudentId, setHoveredStudentId] = useState<string | null>(null);
  const [highlightedGroupIds, setHighlightedGroupIds] = useState<string[] | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Schedule data
  const selectedDateKey = useMemo(() => formatDateKey(selectedDate), [selectedDate]);
  const monthKey = useMemo(() => formatMonthKey(selectedDate), [selectedDate]);
  const { data: scheduleEvents, isLoading: schedLoading } = useSchedule(classId, selectedDateKey);
  const { data: scheduleDates } = useScheduleDates(classId, monthKey);

  const isLoading = gapLoading || pqLoading || hmLoading || schedLoading;
  const totalStudents = priorityQueue?.length ?? 0;

  // Derived data for each component
  const knowledgeTopics = gapRadarToTopics(gapRadar ?? [], totalStudents);
  const alerts = priorityToAlerts(priorityQueue ?? []);
  const { topics: heatmapTopics, heatmap } = heatmapToFrontend(
    heatmapResponse ?? { topics: [], students: [] },
  );
  const dayLessons = scheduleToLessons(scheduleEvents ?? []);

  const needSupport = alerts.urgentCount;

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader
        title="Bảng điều khiển giáo viên"
        subtitle={
          isLoading
            ? "Đang phân tích dữ liệu lớp học..."
            : needSupport > 0
              ? `Hệ thống phát hiện ${needSupport} học sinh cần hỗ trợ ngay — đã sắp xếp theo độ ưu tiên.`
              : "Lớp học đang ổn định. Không có cảnh báo ưu tiên cao."
        }
        actions={
          <>
            <Badge
              variant="neutral"
              className="gap-1.5 px-3 py-2 text-xs normal-case tracking-normal"
            >
              <Calendar className="h-3.5 w-3.5" />{" "}
              Học kỳ I 2026-2027
            </Badge>
            <Button
              variant="primary"
              onClick={() => navigate("/dashboard/create-test")}
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
          <ClassDiagnosticStats heatmap={heatmap} alerts={alerts} isLoading={isLoading} />
        </div>

        {/* Lịch dạy của ngày đang chọn — nhiều lớp/tiết trong cùng một ngày */}
        <DayLessonsCard date={selectedDate} lessons={dayLessons} isLoading={schedLoading} />

        {/* Calendar */}
        <MiniCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          eventDates={scheduleDates}
        />
      </motion.div>

      {/* Knowledge gaps - full width */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.18 }}
        className="mb-8"
      >
        <ClassKnowledgeGaps
          topics={knowledgeTopics}
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
            heatmap={heatmap}
            topics={heatmapTopics}
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
            heatmap={heatmap}
            topics={heatmapTopics}
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
