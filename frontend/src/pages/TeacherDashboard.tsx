import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Plus, ArrowUpRight } from "lucide-react";
import { DashboardHeader } from "@/layouts/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePriorityQueue } from "@/modules/dashboard/hooks/queries/usePriorityQueue";
import { useGapRadar } from "@/modules/dashboard/hooks/queries/useGapRadar";
import { useGroups } from "@/modules/dashboard/hooks/queries/useGroups";
import { useInterventions } from "@/modules/dashboard/hooks/queries/useInterventions";
import { useSelectedClass } from "@/modules/classes/SelectedClassContext";
import { PriorityAlertsCard } from "@/modules/dashboard/components/PriorityAlerts";
import { ClassKnowledgeGaps } from "@/modules/dashboard/components/ClassKnowledgeGaps";
import type {
  PriorityQueueItem,
  GapRadarItem,
} from "@/modules/dashboard/services/dashboardApi";
import type {
  PriorityAlerts as PriorityAlertsType,
  KnowledgeGapTopic,
} from "@/modules/dashboard/types";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Adapt backend PriorityQueueItem → FE PriorityAlertStudent (split by urgency) */
function adaptPriorityAlerts(items: PriorityQueueItem[]): PriorityAlertsType {
  const ability: PriorityAlertsType["ability"] = [];
  const engagement: PriorityAlertsType["engagement"] = [];

  items.forEach((item) => {
    const severity = item.urgency >= 0.7 ? "critical" : "watch";
    const base = {
      id: item.studentId,
      name: item.fullName,
      reason: item.reason,
      severity: severity as "critical" | "watch",
    };
    // Heuristic: attendance reasons → engagement, others → ability
    if (item.reason.includes("Nghỉ") || item.reason.includes("vắng")) {
      engagement.push({ ...base, category: "engagement" });
    } else {
      ability.push({ ...base, category: "ability" });
    }
  });

  return { urgentCount: items.length, ability, engagement };
}

/** Adapt backend GapRadarItem[] → FE KnowledgeGapTopic[] */
function adaptGapRadar(items: GapRadarItem[]): KnowledgeGapTopic[] {
  return items.map((item) => {
    const passRate = Math.round((1 - item.weakRatio) * 100);
    const severity =
      passRate < 50 ? "critical" : passRate < 80 ? "watch" : "onTrack";
    return {
      id: item.nodeId,
      label: item.nodeName,
      passRate,
      severity: severity as KnowledgeGapTopic["severity"],
      studentsAffected: Math.round(item.weakRatio * 30), // estimate
    };
  });
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { classId } = useSelectedClass();

  const priorityQ = usePriorityQueue(classId);
  const gapRadar = useGapRadar(classId);
  const groups = useGroups(classId);
  const interventions = useInterventions(classId);

  const isLoading =
    priorityQ.isLoading || gapRadar.isLoading || groups.isLoading;
  const alertsData = adaptPriorityAlerts(priorityQ.data ?? []);
  const gapsData = adaptGapRadar(gapRadar.data ?? []);
  const needSupport = alertsData.urgentCount;
  const groupsCount = groups.data?.length ?? 0;

  return (
    <div>
      <DashboardHeader
        title="Chào buổi sáng, ..."
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
              <Calendar className="h-3.5 w-3.5" /> Học kỳ I · 2024
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
            value: isLoading ? "…" : needSupport,
            accent: "bg-coral-soft/60 text-ember",
          },
          {
            label: "Nhóm can thiệp",
            value: isLoading ? "…" : groupsCount,
            accent: "bg-lavender-soft text-ink",
          },
          {
            label: "Vùng kiến thức yếu",
            value: isLoading
              ? "…"
              : gapsData.filter((t) => t.severity === "critical").length,
            accent: "bg-[#6d1f1a]/10 text-[#6d1f1a]",
          },
          {
            label: "Can thiệp đề xuất",
            value: isLoading ? "…" : (interventions.data?.length ?? 0),
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
            data={alertsData}
            isLoading={priorityQ.isLoading}
            onSelectStudent={(id) => navigate(`/dashboard/students/${id}`)}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.28 }}
        >
          <ClassKnowledgeGaps
            topics={gapsData}
            isLoading={gapRadar.isLoading}
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
            {groupsCount > 0
              ? `${groupsCount} nhóm can thiệp đang hoạt động`
              : `Tạo nhóm can thiệp nhanh từ ${needSupport} học sinh cần hỗ trợ`}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="shrink-0"
          onClick={() => navigate("/dashboard/class-list")}
        >
          {groupsCount > 0 ? "Xem nhóm" : "Tạo nhóm"}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Button>
      </motion.div>
    </div>
  );
}
