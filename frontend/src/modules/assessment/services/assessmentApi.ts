import { withMockDelay } from "@/services/mockClient";
import { calcAccuracy } from "@/utils/format";
import type {
  Assessment,
  AssessmentDraft,
  Question,
  QuestionDifficulty,
  QuestionOptionKey,
  ScoreReportData,
  TestAttemptSubmission,
} from "../types";

const ASSESSMENT_TITLES: Record<string, { title: string; subject: string }> = {
  "giai-tich-12": { title: "Giải tích 12: Khảo sát hàm số", subject: "Toán" },
  "song-co-hoc": { title: "Vật Lý: Sóng cơ học", subject: "Vật Lý" },
};

const DIFFICULTY_CYCLE: QuestionDifficulty[] = ["Easy", "Medium", "Hard"];

function pointsForDifficulty(difficulty: QuestionDifficulty) {
  if (difficulty === "Easy") return 10;
  if (difficulty === "Medium") return 15;
  return 20;
}

function hashToRange(value: string, min: number, max: number) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1)
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return min + (hash % (max - min + 1));
}

const DRAFT_ASSESSMENT: AssessmentDraft = {
  id: "biology-midterm-unit-4",
  title: "Biology Mid-term Unit 4",
  status: "draft",
  context: {
    difficulty: "adaptive",
    subject: "Biology",
    gradeTag: "Grade 11",
    extraTags: [],
    estimatedMinutes: 45,
    totalPoints: 100,
  },
  questions: [
    {
      id: "q-1",
      order: 1,
      prompt: "Which organelle is known as the powerhouse of the cell?",
      topicTag: "Cell Organelles",
      difficulty: "Easy",
      points: 10,
      options: [
        { key: "A", text: "Mitochondria" },
        { key: "B", text: "Nucleus" },
        { key: "C", text: "Ribosome" },
        { key: "D", text: "Golgi apparatus" },
      ],
      correctOption: "A",
    },
    {
      id: "q-2",
      order: 2,
      prompt: "What is the primary pigment used in photosynthesis?",
      topicTag: "Photosynthesis",
      difficulty: "Medium",
      points: 15,
      options: [
        { key: "A", text: "Carotene" },
        { key: "B", text: "Chlorophyll" },
        { key: "C", text: "Melanin" },
        { key: "D", text: "Anthocyanin" },
      ],
      correctOption: "B",
    },
    {
      id: "q-3",
      order: 3,
      prompt: "DNA replication occurs during which phase of the cell cycle?",
      topicTag: "Cell Cycle",
      difficulty: "Hard",
      points: 20,
      options: [
        { key: "A", text: "G1 phase" },
        { key: "B", text: "S phase" },
        { key: "C", text: "G2 phase" },
        { key: "D", text: "M phase" },
      ],
      correctOption: "B",
    },
    {
      id: "q-4",
      order: 4,
      prompt: "",
      topicTag: "Untitled",
      difficulty: "Easy",
      points: 10,
      options: [
        { key: "A", text: "" },
        { key: "B", text: "" },
        { key: "C", text: "" },
        { key: "D", text: "" },
      ],
      correctOption: "A",
    },
    {
      id: "q-5",
      order: 5,
      prompt: "Define the process of Osmosis...",
      topicTag: "Cell Transport",
      difficulty: "Medium",
      points: 15,
      options: [
        {
          key: "A",
          text: "Movement of solutes from low to high concentration",
        },
        {
          key: "B",
          text: "Movement of water across a semi-permeable membrane",
        },
        { key: "C", text: "Active transport requiring ATP" },
        { key: "D", text: "Breakdown of glucose for energy" },
      ],
      correctOption: "B",
    },
  ],
};

export async function fetchAssessmentDraft(): Promise<AssessmentDraft> {
  return withMockDelay(structuredClone(DRAFT_ASSESSMENT));
}

export async function generateAiQuestions(
  sourceText: string,
  subject: string,
): Promise<Question[]> {
  const topic = sourceText.trim() || "General Biology";
  const generated: Question[] = Array.from({ length: 5 }, (_, i) => ({
    id: `ai-${Date.now()}-${i}`,
    order: 100 + i,
    prompt: `[AI Forge] ${subject} question ${i + 1} generated from: "${topic.slice(0, 60)}"`,
    topicTag: topic.slice(0, 32) || subject,
    difficulty: "Medium",
    points: 15,
    options: [
      { key: "A", text: "Auto-generated option A" },
      { key: "B", text: "Auto-generated option B" },
      { key: "C", text: "Auto-generated option C" },
      { key: "D", text: "Auto-generated option D" },
    ],
    correctOption: "A",
    explanation: "Generated explanation pending teacher review.",
    source: "ai",
  }));
  return withMockDelay(generated, 1400);
}

export interface ParsedQuestionFileResult {
  fileName: string;
  questions: Question[];
}

/**
 * Sends an uploaded test file (PDF/DOCX/TXT) to the question-extraction API, which OCRs/parses
 * the document and auto-labels each extracted question against a knowledge-graph node.
 * Mocked here: derives a deterministic-but-varied set of "extracted" questions from the file.
 */
export async function parseQuestionFile(
  file: File,
): Promise<ParsedQuestionFileResult> {
  const count = hashToRange(`${file.name}-${file.size}-count`, 3, 6);
  const questions: Question[] = Array.from({ length: count }, (_, i) => {
    const node =
      KNOWLEDGE_NODES[
        hashToRange(`${file.name}-${i}-node`, 0, KNOWLEDGE_NODES.length - 1)
      ];
    const difficulty = DIFFICULTY_CYCLE[i % DIFFICULTY_CYCLE.length];
    const correctOption: QuestionOptionKey = (["A", "B", "C", "D"] as const)[
      hashToRange(`${file.name}-${i}-correct`, 0, 3)
    ];
    return {
      id: `import-${Date.now()}-${i}`,
      order: 0,
      prompt: `[Imported from "${file.name}"] Question ${i + 1} — review extracted prompt text.`,
      options: [
        { key: "A", text: "" },
        { key: "B", text: "" },
        { key: "C", text: "" },
        { key: "D", text: "" },
      ],
      correctOption,
      topicTag: node.label,
      knowledgeNodeId: node.id,
      difficulty,
      points: pointsForDifficulty(difficulty),
      explanation:
        "Auto-extracted; verify wording and answer key before publishing.",
      source: "import",
    };
  });
  return withMockDelay({ fileName: file.name, questions }, 1600);
}

export async function saveQuestionDraft(question: Question): Promise<Question> {
  return withMockDelay(question, 350);
}

export async function publishAssessment(
  draftId: string,
): Promise<{ id: string; status: "published" }> {
  return withMockDelay({ id: draftId, status: "published" as const }, 900);
}
