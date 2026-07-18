import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ScanLine,
  Workflow,
  Radar,
  Route,
  Sparkles,
  ArrowDown,
  ArrowRight,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const EASE = [0.16, 1, 0.3, 1] as const;
const spring = { type: "spring", stiffness: 120, damping: 22, mass: 0.9 } as const;

/* ------------------------------------------------------------------ */
/*  Sticky nav                                                         */
/* ------------------------------------------------------------------ */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${scrolled ? "backdrop-blur-xl bg-cream/70 border-b border-hairline/60" : "bg-transparent"
        }`}
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative h-7 w-7">
            <div className="absolute inset-0 rounded-full bg-ink" />
            <div className="absolute inset-[5px] rounded-full border-2 border-lime" />
            <div className="absolute right-0 top-0 h-2 w-2 rounded-full bg-ember" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            G.A.R.Y
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-ink-soft md:flex">
          <a href="#shift" className="hover:text-ink transition-colors">Sự thay đổi</a>
          <a href="#how" className="hover:text-ink transition-colors">Cách hoạt động</a>
          <a href="#pillars" className="hover:text-ink transition-colors">Năng lực</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/student">Học sinh</Link>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/dashboard">Giáo viên</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero — asymmetric. Left: manifesto. Right: living knowledge graph. */
/* ------------------------------------------------------------------ */
function Hero() {
  return (
    <section className="relative min-h-[100dvh] overflow-hidden pt-16">
      {/* soft radial light top-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full opacity-60 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(219,198,255,0.55) 0%, rgba(219,198,255,0) 65%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 bottom-0 h-[420px] w-[420px] rounded-full opacity-50 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(226,247,132,0.5) 0%, rgba(226,247,132,0) 65%)",
        }}
      />

      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-[1280px] grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        {/* Left — manifesto */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-hairline bg-white/60 px-3 py-1.5 text-xs font-medium text-ink-soft backdrop-blur"
          >
            <Sparkles size={13} className="text-ember" />
            Dạy kèm thích ứng · Chương trình 2018
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.08 }}
            className="mt-6 font-display text-[2.75rem] font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-[4.5rem]"
          >
            Cùng một bài giảng.
            <br />
            <span className="relative text-ink-soft/70">Ba mươi lăm</span>{" "}
            <span className="relative whitespace-nowrap text-ink">
              lỗ hổng
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 14"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden
              >
                <motion.path
                  d="M2 11 C 80 4, 180 4, 298 9"
                  stroke="var(--color-ember)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.1, ease: EASE, delay: 0.7 }}
                />
              </svg>
            </span>{" "}
            khác nhau.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.24 }}
            className="mt-7 max-w-[52ch] text-lg text-ink-soft leading-relaxed"
          >
            G.A.R.Y không chấm đúng/sai. Nó chẩn đoán{" "}
            <em className="font-display not-italic text-ink">nguyên nhân gốc</em> của lỗi,
            truy vết học sinh đang hổng ở đâu trong chuỗi kiến thức, rồi tạo lộ trình
            luyện tập cá nhân hóa để lấp đúng chỗ đó.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.38 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Button variant="primary" size="lg" asChild>
              <Link to="/dashboard">
                Xem bảng điều khiển lớp
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#shift">Xem sự thay đổi</a>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-10 flex items-center gap-6 text-xs text-ink-faint"
          >
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-forest-soft" />
              Offline-first
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
              Chụp ảnh → chấm → phân tích
            </span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-ember" />
              Kiểm soát nghiêm ngặt độ tin cậy
            </span>
          </motion.div>
        </div>

        {/* Right — living knowledge graph */}
        <HeroGraph />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="absolute inset-x-0 bottom-6 mx-auto flex w-fit flex-col items-center gap-1 text-ink-faint"
      >
        <span className="text-[11px] uppercase tracking-[0.2em]">Cuộn xuống</span>
        <motion.div
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown size={14} />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  HeroGraph — node graph that draws + pulses + highlights weak node  */
/* ------------------------------------------------------------------ */
const GRAPH_NODES = [
  { id: "a", x: 140, y: 60, label: "Số tự nhiên", weak: false },
  { id: "b", x: 250, y: 130, label: "Phân số", weak: false },
  { id: "c", x: 360, y: 75, label: "Tỉ lệ", weak: true },
  { id: "d", x: 470, y: 150, label: "Bất phương trình", weak: false },
  { id: "e", x: 180, y: 220, label: "Hình học", weak: false },
  { id: "f", x: 330, y: 250, label: "Lượng giác", weak: true },
  { id: "g", x: 440, y: 280, label: "Hàm số", weak: false },
];
const GRAPH_EDGES = [
  ["a", "b"], ["a", "e"], ["b", "c"], ["b", "f"], ["c", "d"], ["f", "g"], ["e", "f"],
];

function HeroGraph() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, ease: EASE, delay: 0.3 }}
      className="relative aspect-square w-full max-w-[520px] justify-self-center"
    >
      {/* panel */}
      <div className="absolute inset-0 rounded-[2rem] border border-hairline bg-white/50 shadow-[0_24px_60px_-30px_rgba(28,26,36,0.25)] backdrop-blur-sm" />
      <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]" />

      <svg viewBox="0 0 540 360" className="absolute inset-0 h-full w-full p-6">
        {/* edges */}
        {GRAPH_EDGES.map(([from, to], i) => {
          const a = GRAPH_NODES.find((n) => n.id === from)!;
          const b = GRAPH_NODES.find((n) => n.id === to)!;
          const involvesWeak = a.weak || b.weak;
          return (
            <motion.line
              key={`${from}-${to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={involvesWeak ? "var(--color-ember)" : "var(--color-hairline)"}
              strokeWidth={involvesWeak ? 2 : 1.4}
              strokeDasharray={involvesWeak ? "4 4" : "0"}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 + i * 0.06 }}
            />
          );
        })}

        {/* nodes */}
        {GRAPH_NODES.map((n, i) => (
          <motion.g
            key={n.id}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.4 + i * 0.08 }}
            style={{ transformBox: "fill-box", transformOrigin: "center" as const }}
          >
            {n.weak && (
              <motion.circle
                cx={n.x}
                cy={n.y}
                r="26"
                fill="none"
                stroke="var(--color-ember)"
                strokeWidth="2"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.2, 0.7, 0.2], r: [22, 30, 22] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <circle
              cx={n.x}
              cy={n.y}
              r="20"
              fill={n.weak ? "var(--color-ember)" : "var(--color-ink)"}
            />
            <text
              x={n.x}
              y={n.y + 38}
              textAnchor="middle"
              className="fill-ink-soft"
              style={{ fontSize: 11, fontFamily: "var(--font-sans)" }}
            >
              {n.label}
            </text>
            {n.weak && (
              <text
                x={n.x}
                y={n.y + 4}
                textAnchor="middle"
                className="fill-cream"
                style={{ fontSize: 10, fontWeight: 700, fontFamily: "var(--font-sans)" }}
              >
                HỔNG
              </text>
            )}
          </motion.g>
        ))}
      </svg>

      {/* floating diagnosis card */}
      <motion.div
        initial={{ opacity: 0, y: 12, x: 8 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: 1.4 }}
        className="absolute bottom-5 left-5 max-w-[70%] rounded-2xl border border-hairline bg-white/85 p-4 shadow-[0_12px_30px_-12px_rgba(28,26,36,0.2)] backdrop-blur-md"
      >
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ember">
          <Radar size={12} />
          Chẩn đoán gốc
        </div>
        <p className="mt-1.5 text-sm leading-snug text-ink">
          Sai tỉ lệ → truy về <strong className="font-semibold">Phân số</strong>{" "}
          <span className="text-ink-faint">(B02)</span>
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  The Shift — interactive before / after : traditional vs adaptive  */
/* ------------------------------------------------------------------ */
function Shift() {
  const [mode, setMode] = useState<"old" | "new">("new");
  const wrongAnswers = [
    { q: "Câu 7 · Tỉ lệ nghịch", correct: false },
    { q: "Câu 12 · Phân số tương đương", correct: false },
    { q: "Câu 18 · Lượng giác cơ bản", correct: false },
    { q: "Câu 21 · Bất phương trình", correct: false },
  ];

  return (
    <section id="shift" className="relative mx-auto max-w-[1280px] px-6 py-28 lg:py-36">
      <div className="mx-auto max-w-[680px] text-center">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: EASE }}
          className="text-xs uppercase tracking-[0.25em] text-ember"
        >
          Sự khác biệt
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.08 }}
          className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl"
        >
          Không phải "đúng hay sai".
          <br />
          <span className="text-ink-soft/70">Vì sao?</span> và{" "}
          <span className="text-ink-soft/70">Ôn gì trước?</span>
        </motion.h2>
      </div>

      {/* toggle */}
      <div className="mt-12 flex justify-center">
        <div className="relative flex w-[280px] rounded-full border border-hairline bg-white p-1">
          {(["old", "new"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`relative z-10 flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${mode === m ? "text-cream" : "text-ink-soft hover:text-ink"
                }`}
            >
              {m === "old" ? "Lớp học truyền thống" : "G.A.R.Y"}
            </button>
          ))}
          <motion.div
            layout
            transition={spring}
            className="absolute inset-y-1 z-0 rounded-full bg-ink"
            style={{ left: mode === "old" ? "0.25rem" : "auto", right: mode === "new" ? "0.25rem" : "auto", width: "calc(50% - 0.25rem)" }}
          />
        </div>
      </div>

      {/* comparison panel */}
      <motion.div
        layout
        transition={spring}
        className="mx-auto mt-10 max-w-[920px] overflow-hidden rounded-[2rem] border border-hairline bg-white shadow-[0_30px_80px_-40px_rgba(28,26,36,0.25)]"
      >
        <AnimatePresenceSimple modeKey={mode}>
          {mode === "old" ? (
            <TraditionalView answers={wrongAnswers} key="old" />
          ) : (
            <AdaptiveView answers={wrongAnswers} key="new" />
          )}
        </AnimatePresenceSimple>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mx-auto mt-8 max-w-[560px] text-center text-sm text-ink-faint"
      >
        Bấm nút để chuyển hai chế độ — cùng một bộ bài làm, hai cách hiểu khác nhau.
      </motion.p>
    </section>
  );
}

function AnimatePresenceSimple({ modeKey, children }: { modeKey: string; children: React.ReactNode }) {
  return (
    <motion.div
      key={modeKey}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* Traditional view — just red marks, no diagnosis */
function TraditionalView({ answers }: { answers: { q: string; correct: boolean }[] }) {
  return (
    <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
      <div className="border-b border-hairline p-8 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Bài làm
          </span>
          <span className="rounded-full bg-coral-soft px-3 py-1 text-xs font-semibold text-ember">
            Điểm: 6/10
          </span>
        </div>
        <ul className="mt-5 space-y-2.5">
          {answers.map((a, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-xl border border-hairline bg-cream px-4 py-3"
            >
              <span className="text-sm text-ink-soft">{a.q}</span>
              <X size={16} className="text-ember" />
            </li>
          ))}
        </ul>
      </div>
      <div className="p-8">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Nhận xét giáo viên
        </span>
        <p className="mt-4 font-display text-2xl leading-snug text-ink-soft/70">
          “Em cần ôn lại kiến thức một chút. Cố luyện thêm đề nhé.”
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-hairline bg-cream px-4 py-2 text-sm text-ink-faint">
          <X size={14} className="text-ember" />
          Không biết hổng ở đâu
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-hairline bg-cream px-4 py-2 text-sm text-ink-faint">
          <X size={14} className="text-ember" />
          Không biết ôn gì trước
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-hairline bg-cream px-4 py-2 text-sm text-ink-faint">
          <X size={14} className="text-ember" />
          35 em — không theo kịp từng người
        </div>
      </div>
    </div>
  );
}

/* Adaptive view — traces root cause, suggests path */
function AdaptiveView({ answers }: { answers: { q: string; correct: boolean }[] }) {
  const trace = [
    { node: "Tỉ lệ (L7-t3)", verdict: "Sai trực tiếp", conf: 0.91 },
    { node: "Phân số (L6-t1-B02)", verdict: "Nguyên nhân gốc", conf: 0.78 },
    { node: "Lượng giác (L7-t5)", verdict: "Sai trực tiếp", conf: 0.88 },
  ];
  const path = [
    { tier: "Bù nền tảng", node: "Phân số · L6-t1-B02", reason: "Là gốc của 2/4 câu sai" },
    { tier: "Củng cố", node: "Tỉ lệ · L7-t3", reason: "Vừa học, ngay lớp" },
    { tier: "Luyện ứng dụng", node: "Lượng giác · L7-t5", reason: "Sai do nhầm công thức" },
  ];
  return (
    <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
      <div className="border-b border-hairline p-8 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ember">
            <Radar size={12} /> Chẩn đoán nguyên nhân gốc
          </span>
          <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.2 }}
            className="rounded-full bg-lime px-3 py-1 text-xs font-semibold text-ink"
          >
            95% trận đấu
          </motion.span>
        </div>
        <ul className="mt-5 space-y-2.5">
          {trace.map((t, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, ease: EASE, delay: 0.1 + i * 0.12 }}
              className={`rounded-xl border px-4 py-3 ${t.verdict === "Nguyên nhân gốc"
                ? "border-ember/40 bg-coral-soft/60"
                : "border-hairline bg-cream"
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">{t.node}</span>
                <span className="text-xs font-mono text-ink-faint">
                  {Math.round(t.conf * 100)}%
                </span>
              </div>
              <span className="mt-1 block text-xs text-ink-faint">{t.verdict}</span>
            </motion.li>
          ))}
        </ul>
      </div>
      <div className="p-8">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-forest-soft">
          <Route size={12} /> Lộ trình ôn cá nhân
        </span>
        <ol className="mt-5 space-y-3">
          {path.map((p, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: 10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, ease: EASE, delay: 0.15 + i * 0.14 }}
              className="flex gap-3 rounded-xl border border-hairline bg-white p-3.5"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-xs font-semibold text-cream">
                {i + 1}
              </span>
              <div>
                <div className="text-sm font-semibold text-ink">{p.node}</div>
                <div className="text-xs text-ink-faint">{p.tier} · {p.reason}</div>
              </div>
              <Check size={14} className="ml-auto self-center text-forest-soft" />
            </motion.li>
          ))}
        </ol>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7 }}
          className="mt-5 inline-flex items-center gap-2 text-xs text-ink-faint"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-forest-soft" />
          Cập nhật sau mỗi câu trả lời — không chờ cuối kỳ
        </motion.div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  How It Works — sticky scroll narrative, 4 steps                  */
/* ------------------------------------------------------------------ */
function HowItWorks() {
  const steps = [
    {
      icon: ScanLine,
      tag: "1 · Thu bài",
      title: "Tải đề lên, hoặc chỉ chụp ảnh bài làm",
      body: "PDF đề thi, ảnh chụp giấy Antwort — hệ thống số hóa, chấm, gắn nhãn vùng kiến thức + độ khó theo chương trình 2018. Mạng yếu vẫn chạy được.",
      visual: "scan",
    },
    {
      icon: Workflow,
      tag: "2 · Chẩn đoán",
      title: "Truy vết nguyên nhân gốc trong đồ thị kiến thức",
      body: "Học sinh sai ở node X → hệ thống đi ngược qua các node tiên quyết, hỏi xem node cha có đang hổng không. Mỗi chẩn đoán đều có điểm tin cậy.",
      visual: "trace",
    },
    {
      icon: Route,
      tag: "3 · Lộ trình",
      title: "Sinh lộ trình ôn tập cá nhân hóa",
      body: "Lấy 2-3 node yếu nhất, theo thứ tự dễ tới khó, bù nền tảng trước rồi mới luyện ứng dụng. Mỗi gợi ý đều trỏ tới đúng node nguồn.",
      visual: "path",
    },
    {
      icon: Radar,
      tag: "4 · Bảng điều khiển lớp",
      title: "Giáo viên thấy cả lớp trong một màn hình",
      body: "Hàng đợi ưu tiên ai cần hỗ trợ trước, nhóm theo nhu cầu thực tế, radar lỗ hổng chung của lớp để biết phần nào cần dạy lại.",
      visual: "radar",
    },
  ];
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <section id="how" ref={ref} className="relative mx-auto max-w-[1280px] px-6 py-28 lg:py-36">
      <div className="mx-auto max-w-[680px] text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-ember">Cách hoạt động</p>
        <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Bốn bước. Một lớp học tự điều chỉnh.
        </h2>
      </div>

      {/* mobile: stacked */}
      <div className="mt-16 space-y-6 lg:hidden">
        {steps.map((s) => (
          <StepCard key={s.tag} step={s} />
        ))}
      </div>

      {/* desktop: sticky left + scrolling right */}
      <div className="mt-20 hidden gap-12 lg:grid lg:grid-cols-[0.85fr_1fr]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative h-[600px] rounded-[2rem] border border-hairline bg-white shadow-[0_30px_80px_-40px_rgba(28,26,36,0.2)]">
            <div className="absolute left-6 top-6 h-[calc(100%-3rem)] w-px bg-hairline" />
            {steps.map((s, i) => (
              <StickyStep
                key={s.tag}
                step={s}
                index={i}
                total={steps.length}
                scrollYProgress={scrollYProgress}
              />
            ))}
          </div>
        </div>
        <div className="space-y-8">
          {steps.map((s) => (
            <StepCard key={s.tag} step={s} big />
          ))}
        </div>
      </div>
    </section>
  );
}

type Step = { icon: typeof ScanLine; tag: string; title: string; body: string; visual: string };

function StickyStep({
  step,
  index,
  total,
  scrollYProgress,
}: {
  step: Step;
  index: number;
  total: number;
  scrollYProgress: import("framer-motion").MotionValue<number>;
}) {
  const start = index / total;
  const end = (index + 1) / total;
  const active = useTransform(scrollYProgress, [start, end], [0, 1]);
  const opacity = useTransform(active, [0, 0.3, 0.85, 1], [0.3, 1, 1, 0.3]);
  const Icon = step.icon;
  return (
    <motion.div
      style={{ opacity, top: `${10 + index * 24}%` }}
      className="absolute left-6 pr-12"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ember">
        <Icon size={14} />
        {step.tag}
      </div>
      <h3 className="mt-2 max-w-[18ch] font-display text-xl font-semibold leading-snug text-ink">
        {step.title}
      </h3>
    </motion.div>
  );
}

function StepCard({ step, big = true }: { step: Step; big?: boolean }) {
  const Icon = step.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: EASE }}
      className={`rounded-[2rem] border border-hairline bg-white p-8 shadow-[0_24px_60px_-40px_rgba(28,26,36,0.2)] ${big ? "" : "max-w-none"}`}
    >
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-cream">
        <Icon size={18} />
      </div>
      <div className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-ember">
        {step.tag}
      </div>
      <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
        {step.title}
      </h3>
      <p className="mt-3 text-base leading-relaxed text-ink-soft">{step.body}</p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Three pillars — asymmetric bento (not 3 equal cards)              */
/* ------------------------------------------------------------------ */
function Pillars() {
  return (
    <section id="pillars" className="relative mx-auto max-w-[1280px] px-6 py-28 lg:py-36">
      <div className="mx-auto max-w-[680px] text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-ember">Ba năng lực lõi</p>
        <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Không thay giáo viên.
          <br />
          Tăng sức mạnh cho họ.
        </h2>
      </div>

      <div className="mt-16 grid gap-5 md:grid-cols-6">
        {/* wide hero pillar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative overflow-hidden rounded-[2rem] border border-hairline bg-ink p-8 text-cream md:col-span-6 lg:col-span-4 lg:row-span-2"
        >
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-lime">
            <Radar size={13} /> Bảng điều khiển lớp
          </div>
          <h3 className="mt-4 max-w-[20ch] font-display text-3xl font-semibold leading-snug">
            Hàng đợi ưu tiên, nhóm theo nhu cầu, radar hổng chung
          </h3>
          <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-cream/70">
            Một màn hình thay cho nhiều thao tác spreadsheet thủ công. Biết ngay ai cần được
            hỗ trợ trước, nhóm nào đang cùng hổng một chỗ, và phần nào của lớp cần dạy lại.
          </p>

          {/* mini mock dashboard */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { name: "Linh", label: "Phân số", lvl: 0.28, mode: "risk" },
              { name: "Khang", label: "Tỉ lệ", lvl: 0.41, mode: "risk" },
              { name: "Vy", label: "Hình học", lvl: 0.92, mode: "ok" },
              { name: "Đức", label: "Lượng giác", lvl: 0.33, mode: "risk" },
              { name: "Mai", label: "Hàm số", lvl: 0.71, mode: "ok" },
              { name: "An", label: "Bất PT", lvl: 0.55, mode: "mid" },
            ].map((s, i) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.1 + i * 0.08 }}
                className="rounded-2xl bg-white/5 p-4 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-cream">{s.name}</span>
                  <span
                    className={`h-2 w-2 rounded-full ${s.mode === "risk" ? "bg-ember" : s.mode === "mid" ? "bg-lavender" : "bg-lime"
                      }`}
                  />
                </div>
                <div className="mt-1 text-xs text-cream/60">{s.label}</div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${s.lvl * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: EASE, delay: 0.2 + i * 0.08 }}
                    className={`h-full rounded-full ${s.mode === "risk" ? "bg-ember" : s.mode === "mid" ? "bg-lavender" : "bg-lime"
                      }`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* tall accent - offline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
          className="relative overflow-hidden rounded-[2rem] border border-hairline bg-lavender-soft p-8 md:col-span-6 lg:col-span-2 lg:row-span-2"
        >
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ink">
            <ScanLine size={13} className="text-ink" /> Offline-first
          </div>
          <h3 className="mt-4 max-w-[14ch] font-display text-3xl font-semibold leading-snug text-ink">
            Chụp ảnh. Lấm tay. Vẫn dùng được.
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Thiết kế cho vùng nông thôn — chụp ảnh bài làm, số hóa, chấm, phân tích, báo cáo
            trong một luồng. Không cần mạng liên tục.
          </p>
          <motion.div
            className="mt-10 flex h-40 w-full items-end gap-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            {[40, 70, 30, 90, 55, 75, 60].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                whileInView={{ height: `${h}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.3 + i * 0.08 }}
                className="flex-1 rounded-t-lg bg-ink/80"
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  CTA                                                                */
/* ------------------------------------------------------------------ */
function FinalCTA() {
  return (
    <section className="relative mx-auto max-w-[1280px] px-6 py-28 lg:py-36">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative overflow-hidden rounded-[2.5rem] bg-ink px-8 py-16 text-center text-cream shadow-[0_40px_100px_-40px_rgba(28,26,36,0.5)] sm:px-16 sm:py-24"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(193,68,14,0.4) 0%, transparent 60%), radial-gradient(40% 40% at 80% 100%, rgba(219,198,255,0.3) 0%, transparent 60%)",
          }}
        />
        <p className="relative text-xs uppercase tracking-[0.3em] text-lime">
          Hạ tầng lớp học AI-native
        </p>
        <h2 className="relative mx-auto mt-5 max-w-[20ch] font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Biết em hổng ở đâu.
          <br />
          Ôn đúng chỗ đó.
        </h2>
        <p className="relative mx-auto mt-6 max-w-[52ch] text-base leading-relaxed text-cream/70">
          G.A.R.Y bám sát chương trình Giáo dục phổ thông 2018, kiểm soát nghiêm ngặt độ tin
          cậy của mọi gợi ý. Mỗi chẩn đoán đều trỏ về đúng node kiến thức, đúng nguồn.
        </p>
        <div className="relative mt-10 flex flex-wrap justify-center gap-3">
          <Button variant="primary" size="lg" asChild>
            <Link to="/dashboard">
              Mở bảng điều khiển
              <ArrowRight size={16} />
            </Link>
          </Button>
          <Button
            size="lg"
            className="border border-cream/20 bg-transparent text-cream hover:bg-cream/10"
            asChild
          >
            <Link to="/student">Vào góc học sinh</Link>
          </Button>
        </div>
      </motion.div>

      {/* footer */}
      <footer className="mt-20 flex flex-col items-center justify-between gap-4 border-t border-hairline pt-8 text-sm text-ink-faint sm:flex-row">
        <div className="flex items-center gap-2.5">
          <div className="relative h-6 w-6">
            <div className="absolute inset-0 rounded-full bg-ink" />
            <div className="absolute inset-[4px] rounded-full border-2 border-lime" />
          </div>
          <span className="font-display font-semibold text-ink">G.A.R.Y</span>
        </div>
        <p>Dạy kèm thích ứng · Theo Chương trình GDPT 2018 · Hackathon demo</p>
      </footer>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function Landing() {
  return (
    <main className="relative min-h-[100dvh] bg-cream">
      <Nav />
      <Hero />
      <Shift />
      <HowItWorks />
      <Pillars />
      <FinalCTA />
    </main>
  );
}