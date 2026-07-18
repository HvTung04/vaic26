import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { FileUp, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/utils/cn";

const ACCEPTED_EXTENSIONS = ".pdf,.doc,.docx,.txt";

export interface QuestionFileImportCardProps {
  onUpload: (file: File) => void;
  isUploading?: boolean;
  lastImportedCount?: number;
  lastFileName?: string;
}

export function QuestionFileImportCard({
  onUpload,
  isUploading,
  lastImportedCount,
  lastFileName,
}: QuestionFileImportCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onUpload(file);
  };

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Nhập câu hỏi từ tệp</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs leading-relaxed text-ink-soft">
          Tải lên tài liệu bài kiểm tra có sẵn. Câu hỏi sẽ được trích xuất và gắn nhãn chủ đề /
          node kiến thức để bạn xem xét.
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          disabled={isUploading}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-bento-sm border-2 border-dashed px-4 py-6 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-70",
            isDragOver ? "border-primary/60 bg-primary/5" : "border-hairline hover:border-primary/40 hover:bg-cream-100",
          )}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <FileUp className="h-6 w-6 text-ink-faint" />
          )}
          <span className="text-xs font-semibold text-ink">
            {isUploading ? "Đang phân tích & gắn nhãn câu hỏi..." : "Nhấn hoặc kéo thả tệp để tải lên"}
          </span>
          <span className="text-[11px] text-ink-faint">PDF, DOC, DOCX hoặc TXT</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {Boolean(lastImportedCount) && !isUploading && (
          <p className="flex items-center gap-1.5 text-xs text-forest-soft">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {lastImportedCount} câu hỏi đã nhập từ{" "}
            {lastFileName} và gắn nhãn chủ đề.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
