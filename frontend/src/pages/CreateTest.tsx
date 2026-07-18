import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Database,
  Search,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  ChevronDown,
  X,
  Clock,
  BookOpen,
} from "lucide-react";
import { DashboardHeader } from "@/layouts/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";
import { withMockDelay } from "@/services/mockClient";
import { QuestionEditorForm } from "@/modules/assessment/components/QuestionEditorForm";
import { QuestionListPreview } from "@/modules/assessment/components/QuestionListPreview";
import type { Question, QuestionDifficulty, QuestionOptionKey } from "@/modules/assessment/types";

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

interface ClassOption {
  id: string;
  name: string;
  grade: number;
  studentCount: number;
}

const MOCK_CLASSES: ClassOption[] = [
  { id: "c1", name: "8A1", grade: 8, studentCount: 42 },
  { id: "c2", name: "8A2", grade: 8, studentCount: 40 },
  { id: "c3", name: "8B1", grade: 8, studentCount: 38 },
  { id: "c4", name: "7A1", grade: 7, studentCount: 44 },
];

const SUBJECTS = ["Toán", "Vật Lý", "Hóa Học", "Sinh Học", "Ngữ Văn", "Tiếng Anh"];
const AVAILABLE_GRADES = [...new Set(MOCK_CLASSES.map((c) => `Khối ${c.grade}`))].sort();

const DIFFICULTY_CYCLE: QuestionDifficulty[] = ["Easy", "Medium", "Hard"];

const BANK_QUESTIONS: Question[] = [
  {
    id: "bq-1", order: 1, prompt: "Phân số 3/5 bằng bao nhiêu phần trăm?",
    options: [
      { key: "A", text: "50%" }, { key: "B", text: "60%" },
      { key: "C", text: "65%" }, { key: "D", text: "75%" },
    ],
    correctOption: "B", topicTag: "Phân số · L6-t1", difficulty: "Easy", points: 10,
  },
  {
    id: "bq-2", order: 2, prompt: "Tìm x biết: 2x + 5 = 17",
    options: [
      { key: "A", text: "x = 5" }, { key: "B", text: "x = 6" },
      { key: "C", text: "x = 7" }, { key: "D", text: "x = 8" },
    ],
    correctOption: "B", topicTag: "Đại số · L7-t1", difficulty: "Easy", points: 10,
  },
  {
    id: "bq-3", order: 3, prompt: "Một hình chữ nhật có chiều dài 12cm, chiều rộng 5cm. Diện tích hình chữ nhật là:",
    options: [
      { key: "A", text: "17 cm²" }, { key: "B", text: "34 cm²" },
      { key: "C", text: "60 cm²" }, { key: "D", text: "120 cm²" },
    ],
    correctOption: "C", topicTag: "Hình học · L6-t5", difficulty: "Medium", points: 15,
  },
  {
    id: "bq-4", order: 4, prompt: "Giá trị của biểu thức |−3| + |5 − 2| là:",
    options: [
      { key: "A", text: "0" }, { key: "B", text: "4" },
      { key: "C", text: "6" }, { key: "D", text: "10" },
    ],
    correctOption: "C", topicTag: "Số học · L7-t2", difficulty: "Medium", points: 15,
  },
  {
    id: "bq-5", order: 5, prompt: "Trong tam giác ABC vuông tại A, biết AB = 3, AC = 4. Độ dài cạnh BC là:",
    options: [
      { key: "A", text: "6" }, { key: "B", text: "7" },
      { key: "C", text: "5" }, { key: "D", text: "12" },
    ],
    correctOption: "C", topicTag: "Hình học · L8-t5", difficulty: "Hard", points: 20,
  },
];

function buildExtractedQuestions(subject: string): Question[] {
  const prompts = [
    "Cho tam giác ABC với A(1; 2), B(3; 4), C(5; 0). Tính diện tích tam giác ABC.",
    "Phân số nào sau đây lớn nhất: 2/3, 3/5, 5/8?",
    "Một chiếc xe chạy 120 km trong 2 giờ. Tốc độ trung bình của xe là bao nhiêu km/h?",
    "Giải phương trình: 3x − 7 = 14",
    "Tính giá trị của: (−2)³ + 3 × (−1)⁴",
    "Hình tròn có bán kính 7 cm. Diện tích hình tròn là bao nhiêu? (π ≈ 22/7)",
    "Một lớp có 45 học sinh, trong đó 60% là nữ. Số học sinh nam trong lớp là:",
    "Đơn giản biểu thức: (2x + 3)(x − 1)",
    "Cho hàm số y = 2x − 5. Giá trị của y khi x = 3 là:",
    "Một hình hộp chữ nhật có kích thước 5cm × 4cm × 3cm. Thể tích hình hộp là:",
  ];

  return prompts.map((prompt, i) => {
    const order = i + 1;
    const difficulty = DIFFICULTY_CYCLE[i % 3];
    return {
      id: `ext-${order}`,
      order,
      prompt,
      options: [
        { key: "A" as QuestionOptionKey, text: `Đáp án A cho câu ${order}` },
        { key: "B" as QuestionOptionKey, text: `Đáp án B cho câu ${order}` },
        { key: "C" as QuestionOptionKey, text: `Đáp án C cho câu ${order}` },
        { key: "D" as QuestionOptionKey, text: `Đáp án D cho câu ${order}` },
      ],
      correctOption: (["A", "B", "C", "D"] as const)[order % 4] as QuestionOptionKey,
      topicTag: `${subject} · Câu ${order}`,
      difficulty,
      points: difficulty === "Easy" ? 10 : difficulty === "Medium" ? 15 : 20,
      explanation: `Giải thích cho câu ${order}.`,
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Toast                                                              */
/* ------------------------------------------------------------------ */
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-hairline bg-white px-5 py-3.5 shadow-floating"
    >
      <CheckCircle2 size={18} className="shrink-0 text-forest-soft" />
      <span className="text-sm font-medium text-ink">{message}</span>
      <button onClick={onClose} className="ml-2 rounded-full p-1 text-ink-faint hover:bg-ink/5 hover:text-ink">
        <X size={14} />
      </button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section wrapper                                                    */
/* ------------------------------------------------------------------ */
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-bento-lg border border-hairline/60 bg-white p-6"
    >
      <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-faint">{label}</p>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Upload zone                                                        */
/* ------------------------------------------------------------------ */
function UploadZone({ onExtract }: { onExtract: () => void }) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      onExtract();
    },
    [onExtract],
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 transition-all",
        dragging
          ? "border-ember bg-coral-soft/30"
          : "border-hairline bg-cream/40 hover:border-ink/20",
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-100">
        <Upload size={20} className="text-ink-soft" />
      </div>
      <p className="text-sm font-semibold text-ink">Kéo thả file đề thi vào đây</p>
      <p className="text-xs text-ink-faint">Hỗ trợ PDF, JPG, PNG — tối đa 10MB</p>
      <Button variant="outline" size="sm" onClick={onExtract} className="mt-2">
        <FileText size={14} /> Hoặc chọn file
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Extracting animation                                               */
/* ------------------------------------------------------------------ */
function ExtractingOverlay() {
  const steps = [
    { label: "Đọc nội dung file", done: true },
    { label: "Tách câu hỏi", done: true },
    { label: "Gắn nhãn kiến thức + độ khó", done: false },
    { label: "Hoàn tất", done: false },
  ];
  return (
    <div className="flex flex-col items-center gap-6 py-16">
      <Loader2 size={32} className="animate-spin text-ember" />
      <div className="space-y-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.6 }}
            className="flex items-center gap-3"
          >
            {s.done ? (
              <CheckCircle2 size={16} className="text-forest-soft" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-hairline" />
            )}
            <span className={cn("text-sm", s.done ? "text-ink" : "text-ink-faint")}>{s.label}</span>
          </motion.div>
        ))}
      </div>
      <p className="text-xs text-ink-faint">Đang trích xuất và gắn nhãn câu hỏi...</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bank source                                                        */
/* ------------------------------------------------------------------ */
function BankSource({
  questions,
  selectedIds,
  onToggle,
  onSelectAll,
}: {
  questions: Question[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () => questions.filter((q) => q.prompt.toLowerCase().includes(search.toLowerCase())),
    [questions, search],
  );
  const allSelected = filtered.length > 0 && filtered.every((q) => selectedIds.has(q.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <Input
            placeholder="Tìm câu hỏi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={onSelectAll}>
          {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
        </Button>
        <Badge variant="neutral" className="text-xs">
          {selectedIds.size}/{questions.length}
        </Badge>
      </div>
      <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
        {filtered.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => onToggle(q.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
              selectedIds.has(q.id)
                ? "border-ink/20 bg-cream-100"
                : "border-hairline/60 bg-white hover:bg-cream/50",
            )}
          >
            <div
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                selectedIds.has(q.id) ? "border-ink bg-ink" : "border-hairline bg-white",
              )}
            >
              {selectedIds.has(q.id) && <Check size={12} className="text-cream" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{q.prompt}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <Badge variant={q.difficulty === "Easy" ? "mint" : q.difficulty === "Hard" ? "coral" : "neutral"} className="text-[10px]">
                  {q.difficulty}
                </Badge>
                <span className="text-[11px] text-ink-faint">{q.topicTag}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Class selector                                                     */
/* ------------------------------------------------------------------ */
function ClassSelector({
  classes,
  selected,
  onToggle,
}: {
  classes: ClassOption[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (classes.length === 0) {
    return <p className="text-sm text-ink-faint">Chọn khối để xem danh sách lớp.</p>;
  }
  return (
    <div className="space-y-2">
      {classes.map((cls) => {
        const active = selected.has(cls.id);
        return (
          <button
            key={cls.id}
            type="button"
            onClick={() => onToggle(cls.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
              active
                ? "border-ink/20 bg-cream-100"
                : "border-hairline/60 bg-white hover:bg-cream/50",
            )}
          >
            <div
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                active ? "border-ink bg-ink" : "border-hairline bg-white",
              )}
            >
              {active && <Check size={12} className="text-cream" />}
            </div>
            <span className="text-sm font-semibold text-ink">{cls.name}</span>
            <span className="text-xs text-ink-faint">{cls.studentCount} học sinh</span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
type PageStatus = "setup" | "extracting" | "review";
type SourceMode = "upload" | "bank";

export default function CreateTest() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<PageStatus>("setup");
  const [source, setSource] = useState<SourceMode>("upload");
  const [setupComplete, setSetupComplete] = useState(false);

  // Setup form
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [duration, setDuration] = useState("45");
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());

  // Bank selection
  const [selectedBankIds, setSelectedBankIds] = useState<Set<string>>(new Set());

  // Questions (populated after upload or bank selection)
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQuestionId, setActiveQuestionId] = useState<string>("");
  const activeQuestion = useMemo(
    () => questions.find((q) => q.id === activeQuestionId),
    [questions, activeQuestionId],
  );

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  const toggleClass = (id: string) => {
    setSelectedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleBankQuestion = (id: string) => {
    setSelectedBankIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllBank = () => {
    setSelectedBankIds((prev) => {
      if (prev.size === BANK_QUESTIONS.length) return new Set();
      return new Set(BANK_QUESTIONS.map((q) => q.id));
    });
  };

  // Upload handler — mock extraction
  const handleExtract = useCallback(async () => {
    setStatus("extracting");
    const extracted = await withMockDelay(buildExtractedQuestions(subject || "Toán"), 2800);
    setQuestions(extracted);
    setActiveQuestionId(extracted[0]?.id ?? "");
    setStatus("review");
  }, [subject]);

  // Bank confirm — move selected to review
  const confirmBankSelection = () => {
    const selected = BANK_QUESTIONS.filter((q) => selectedBankIds.has(q.id)).map((q, i) => ({
      ...q,
      order: i + 1,
    }));
    if (selected.length === 0) return;
    setQuestions(selected);
    setActiveQuestionId(selected[0].id);
    setStatus("review");
  };

  // Update a question in-place
  const updateQuestion = (q: Question) => {
    setQuestions((prev) => prev.map((item) => (item.id === q.id ? q : item)));
  };

  // Publish
  const handlePublish = () => {
    setToast("Đã xuất bản đề thi thành công! Học sinh sẽ nhận được bài kiểm tra.");
  };

  // Can proceed to review?
  const canStartReview =
    title.trim() && subject && grade && selectedClasses.size > 0 && duration;

  return (
    <div>
      <DashboardHeader
        title="Tạo bài kiểm tra mới"
        subtitle="Thiết kế đề thi, chọn nguồn câu hỏi, ôn tập trước khi xuất bản"
        actions={
          status === "review" ? (
            <>
              <Button variant="outline" onClick={() => setToast("Đã lưu bản nháp.")}>
                Lưu bản nháp
              </Button>
              <Button variant="primary" onClick={handlePublish}>
                <Check size={14} /> Xuất bản đề thi
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-6">
        {/* Step 1: Setup form */}
        {!setupComplete && (
        <Section label="Thiết kế đề thi">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold text-ink-soft">Tiêu đề đề thi</label>
              <Input
                placeholder="VD: Kiểm tra giữa kỳ Toán 8"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-soft">Môn học</label>
              <div className="relative">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-hairline bg-white px-3 pr-8 text-sm text-ink outline-none focus:border-ink/30"
                >
                  <option value="">Chọn môn</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-soft">Khối</label>
              <div className="relative">
                <select
                  value={grade}
                  onChange={(e) => { setGrade(e.target.value); setSelectedClasses(new Set()); }}
                  className="h-11 w-full appearance-none rounded-xl border border-hairline bg-white px-3 pr-8 text-sm text-ink outline-none focus:border-ink/30"
                >
                  <option value="">Chọn khối</option>
                  {AVAILABLE_GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-ink-faint" />
              <label className="text-xs font-bold text-ink-soft">Thời gian (phút):</label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="h-9 w-20 text-center"
                min={5}
                max={180}
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-3 flex items-center gap-2 text-xs font-bold text-ink-soft">
              <BookOpen size={13} /> Chọn lớp áp dụng
            </label>
            <ClassSelector
              classes={grade ? MOCK_CLASSES.filter((c) => String(c.grade) === grade.replace("Khối ", "")) : []}
              selected={selectedClasses}
              onToggle={toggleClass}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              variant="primary"
              disabled={!canStartReview}
              onClick={() => setSetupComplete(true)}
            >
              Tiếp tục
            </Button>
          </div>
        </Section>
        )}

        {/* Step 2: Source selector */}
        {setupComplete && status !== "review" && (
        <Section label="Nguồn câu hỏi">
          <div className="mb-5 flex gap-1 rounded-xl border border-hairline/60 bg-cream p-1">
            {(["upload", "bank"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setSource(m)}
                className={cn(
                  "relative flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                  source === m ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink",
                )}
              >
                {m === "upload" ? <Upload size={14} /> : <Database size={14} />}
                {m === "upload" ? "Tải đề lên" : "Từ ngân hàng câu hỏi"}
              </button>
            ))}
          </div>

          {source === "upload" ? (
            status === "extracting" ? (
              <ExtractingOverlay />
            ) : (
              <UploadZone onExtract={handleExtract} />
            )
          ) : (
            <div className="space-y-3">
              <BankSource
                questions={BANK_QUESTIONS}
                selectedIds={selectedBankIds}
                onToggle={toggleBankQuestion}
                onSelectAll={selectAllBank}
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={selectedBankIds.size === 0}
                  onClick={confirmBankSelection}
                >
                  Sử dụng {selectedBankIds.size} câu đã chọn
                </Button>
              </div>
            </div>
          )}
        </Section>
        )}

        {/* Step 3: Review editor */}
        {status === "review" && questions.length > 0 && (
        <Section label={`Ôn tập câu hỏi (${questions.length} câu)`}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_1fr]">
            <div>
              {activeQuestion && (
                <QuestionEditorForm
                  question={activeQuestion}
                  totalQuestions={questions.length}
                  onChange={updateQuestion}
                  onSave={() => setToast("Đã lưu câu hỏi.")}
                />
              )}
            </div>
            <div>
              <QuestionListPreview
                questions={questions}
                activeQuestionId={activeQuestionId}
                onSelect={setActiveQuestionId}
              />
            </div>
          </div>
        </Section>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
