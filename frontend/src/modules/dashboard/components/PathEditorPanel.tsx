import { useState } from "react";
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTeacherPathActions } from "@/modules/learningPath/hooks/useTeacherPathActions";

export interface PathEditorPanelProps {
  studentId: string;
}

export function PathEditorPanel({ studentId }: PathEditorPanelProps) {
  const [note, setNote] = useState("");
  const { generateMutation, verifyMutation } = useTeacherPathActions(studentId);

  return (
    <div className="flex flex-col gap-3 pt-6">
      <Textarea
        rows={3}
        placeholder="Đề xuất chỉnh sửa lộ trình học tập..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="primary"
          className="flex-1"
          disabled={generateMutation.isPending}
          onClick={() =>
            generateMutation.mutate(undefined, { onSuccess: () => setNote("") })
          }
        >
          {generateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          AI Cập nhật lộ trình
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          disabled={verifyMutation.isPending}
          onClick={() => verifyMutation.mutate()}
        >
          {verifyMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Xác nhận &amp; Giao bài
        </Button>
      </div>
      {verifyMutation.isSuccess && (
        <p className="text-xs font-medium text-[#136B4E]">
          Lộ trình đã được xác nhận và giao cho học sinh.
        </p>
      )}
      {generateMutation.isSuccess && (
        <p className="text-xs font-medium text-[#6B3FCB]">
          AI đã cập nhật đề xuất lộ trình mới.
        </p>
      )}
    </div>
  );
}
