import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Plus, ArrowUpRight } from "lucide-react";
import { DashboardHeader } from "@/layouts/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetClassTelemetry } from "@/modules/dashboard/hooks/queries/useGetClassTelemetry";
import { PriorityAlertsCard } from "@/modules/dashboard/components/PriorityAlerts";
import { ClassKnowledgeGaps } from "@/modules/dashboard/components/ClassKnowledgeGaps";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useGetClassTelemetry();
  const needSupport = data?.studentsNeedingSupport ?? 0;

  return (
    <div>
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
              onClick={() => navigate("/dashboard/create-test")}
            >
              <Plus className="h-4 w-4" /> Tạo bài kiểm tra
            </Button>
          </>
        }
      />

      {/* Quick stats strip */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {[
          {
            label: "Cần hỗ trợ ngay",
            value: needSupport,
            accent: "bg-coral-soft/60 text-ember",
          },
          {
            label: "Lớp đang dạy",
            value: "Khối 8 · Tỉ lệ",
            accent: "bg-lavender-soft text-ink",
          },
          {
            label: "Vùng kiến thức yếu",
            value: isLoading
              ? "…"
              : (data?.knowledgeGaps?.filter((t) => t.severity === "critical")
                  .length ?? 0),
            accent: "bg-[#6d1f1a]/10 text-[#6d1f1a]",
          },
          {
            label: "Học sinh đạt yêu cầu",
            value: isLoading
              ? "…"
              : data?.knowledgeGaps?.some((t) => t.severity === "onTrack")
                ? "Có"
                : "—",
            accent: "bg-[#234d2f]/10 text-[#234d2f]",
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE, delay: 0.08 + i * 0.07 }}
            className="rounded-bento border border-hairline/60 bg-white px-4 py-3"
          >
            <div
              className={`mb-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.accent}`}
            >
              {s.label}
            </div>
            <div className="font-display text-2xl font-semibold text-ink">
              {s.value}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.18 }}
        >
          <PriorityAlertsCard
            data={data?.alerts}
            isLoading={isLoading}
            onSelectStudent={(id) => navigate(`/dashboard/students/${id}`)}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.28 }}
        >
          <ClassKnowledgeGaps
            topics={data?.knowledgeGaps}
            moreCount={data?.moreGapTopicsCount}
            isLoading={isLoading}
          />
        </motion.div>
      </div>

      {/* Need-based group action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.4 }}
        className="mt-6 flex items-center justify-between gap-4 rounded-bento-lg border border-ink/10 bg-ink px-6 py-5 text-cream"
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lime">
            Nhóm theo nhu cầu
          </p>
          <p className="mt-1.5 font-display text-lg font-medium">
            Tạo nhóm can thiệp nhanh từ {needSupport} học sinh cần hỗ trợ
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="shrink-0"
          onClick={() => navigate("/dashboard/class-list")}
        >
          Tạo nhóm
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Button>
      </motion.div>
    </div>
  );
}
