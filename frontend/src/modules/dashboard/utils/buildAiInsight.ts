import type { NodeState } from '@/modules/knowledgeGraph/types';
import type { StudentResultHistoryItem } from '@/modules/testTaking/types';

export interface AiInsight {
  summary: string;
  weakTopics: string[];
  strongTopics: string[];
}

const WEAK_THRESHOLD = 0.5;
const STRONG_THRESHOLD = 0.75;

/**
 * There's no per-student "AI insight" endpoint yet (only the class-level
 * /agents/dashboard-insights) — until one exists, derive the summary from
 * real graph-state + result data the page already fetches, rather than
 * showing mock text.
 */
export function buildAiInsight(nodes: NodeState[] = [], results: StudentResultHistoryItem[] = []): AiInsight {
  const weak = nodes.filter((n) => n.mastery < WEAK_THRESHOLD);
  const strong = [...nodes].filter((n) => n.mastery >= STRONG_THRESHOLD).sort((a, b) => b.mastery - a.mastery);
  const latest = results[0];

  const parts: string[] = [];
  if (nodes.length === 0) {
    parts.push('Học sinh chưa có đủ dữ liệu bài làm để phân tích.');
  } else if (weak.length > 0) {
    const [worst] = weak;
    parts.push(
      `Học sinh đang yếu nhất ở ${worst.nodeName} (${Math.round(worst.mastery * 100)}% nắm vững)` +
        (weak.length > 1 ? `, cùng ${weak.length - 1} kiến thức khác cần ôn tập.` : '.'),
    );
  } else {
    parts.push('Học sinh đang nắm vững hầu hết các kiến thức đã học.');
  }
  if (latest && latest.total > 0) {
    parts.push(`Bài kiểm tra gần nhất "${latest.title}" đạt ${Math.round((latest.score / latest.total) * 100)}%.`);
  }

  return {
    summary: parts.join(' '),
    weakTopics: weak.slice(0, 3).map((n) => n.nodeName),
    strongTopics: strong.slice(0, 3).map((n) => n.nodeName),
  };
}
