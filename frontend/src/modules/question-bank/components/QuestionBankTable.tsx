import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/format";
import { KNOWLEDGE_NODES, nodeLabel } from "../constants";
import { useQuestionBank } from "../hooks/useQuestionBank";
import type {
  QuestionBankDifficulty,
  QuestionBankSortField,
  QuestionBankType,
} from "../types";

const TYPE_LABEL: Record<QuestionBankType, string> = {
  mcq: "Multiple Choice",
  short_answer: "Short Answer",
};

const DIFFICULTY_BADGE_VARIANT: Record<
  QuestionBankDifficulty,
  "mint" | "sky" | "coral"
> = {
  easy: "mint",
  medium: "sky",
  hard: "coral",
};

const TYPE_FILTERS: { value: QuestionBankType | "all"; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "mcq", label: "Multiple Choice" },
  { value: "short_answer", label: "Short Answer" },
];

const DIFFICULTY_FILTERS: {
  value: QuestionBankDifficulty | "all";
  label: string;
}[] = [
  { value: "all", label: "All Difficulties" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const SORTABLE_COLUMNS: {
  field: QuestionBankSortField;
  label: string;
  className?: string;
}[] = [
  { field: "text", label: "Question", className: "w-[40%]" },
  { field: "type", label: "Type" },
  { field: "difficulty", label: "Difficulty" },
  { field: "created_at", label: "Created" },
];

export interface QuestionBankTableProps {
  onAddQuestion: () => void;
  onEditQuestion: (id: string) => void;
}

export function QuestionBankTable({
  onAddQuestion,
  onEditQuestion,
}: QuestionBankTableProps) {
  const {
    isLoading,
    pageItems,
    totalCount,
    filteredCount,
    page,
    totalPages,
    pageRangeStart,
    pageRangeEnd,
    setPage,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    difficultyFilter,
    setDifficultyFilter,
    nodeFilter,
    setNodeFilter,
    sortField,
    sortDirection,
    toggleSort,
  } = useQuestionBank();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={nodeFilter}
          onChange={(e) => setNodeFilter(e.target.value)}
          className="h-11 rounded-bento-sm border border-hairline bg-white px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
        >
          <option value="all">All Topics</option>
          {KNOWLEDGE_NODES.map((node) => (
            <option key={node.id} value={node.id}>
              {node.label}
            </option>
          ))}
        </select>
        <Button variant="primary" onClick={onAddQuestion}>
          <Plus className="h-4 w-4" /> Add Question
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-semibold text-ink-faint">Type:</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                typeFilter === f.value
                  ? "bg-ink text-cream"
                  : "bg-cream-100 text-ink-soft hover:bg-ink/10",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-hairline" />
        <span className="text-sm font-semibold text-ink-faint">
          Difficulty:
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {DIFFICULTY_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setDifficultyFilter(f.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                difficultyFilter === f.value
                  ? "bg-ink text-cream"
                  : "bg-cream-100 text-ink-soft hover:bg-ink/10",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                {SORTABLE_COLUMNS.map((col) => (
                  <TableHead key={col.field} className={col.className}>
                    <button
                      type="button"
                      onClick={() => toggleSort(col.field)}
                      className="flex items-center gap-1 transition-colors hover:text-ink"
                    >
                      {col.label}
                      {sortField === col.field ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  </TableHead>
                ))}
                <TableHead>Topic / Node</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-ink-faint"
                  >
                    No questions match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((question) => (
                  <TableRow
                    key={question.id}
                    className="cursor-pointer"
                    onClick={() => onEditQuestion(question.id)}
                  >
                    <TableCell className="max-w-0">
                      <p className="truncate font-medium text-ink">
                        {question.text}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">
                        {TYPE_LABEL[question.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={DIFFICULTY_BADGE_VARIANT[question.difficulty]}
                      >
                        {question.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-ink-soft">
                      {formatDate(question.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="lavender">
                        {nodeLabel(question.node_id)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditQuestion(question.id);
                        }}
                        className="rounded-bento-sm p-2 text-ink-faint transition-colors hover:bg-ink/5 hover:text-ink"
                        aria-label="Edit question"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between text-sm text-ink-soft">
            <p>
              Showing {pageRangeStart}-{pageRangeEnd} of {filteredCount}{" "}
              question{filteredCount === 1 ? "" : "s"}
              {filteredCount !== totalCount
                ? ` (filtered from ${totalCount})`
                : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-semibold text-ink-faint">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
