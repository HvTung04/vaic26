import { useNavigate, useParams } from "react-router-dom";
import { DashboardHeader } from "@/layouts/DashboardHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { QuestionBankForm } from "@/modules/question-bank/components/QuestionBankForm";
import { useQuestionBankEditor } from "@/modules/question-bank/hooks/useQuestionBankEditor";
import type { QuestionBankDraftInput } from "@/modules/question-bank/types";

export default function QuestionBankEditor() {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(questionId);
  const { item, isLoading, isError, createMutation, updateMutation } =
    useQuestionBankEditor(questionId);

  const handleSubmit = (payload: QuestionBankDraftInput) => {
    const onSuccess = () => navigate("/dashboard/question-bank");
    if (isEditMode && questionId) {
      updateMutation.mutate({ id: questionId, payload }, { onSuccess });
    } else {
      createMutation.mutate(payload, { onSuccess });
    }
  };

  return (
    <div>
      <DashboardHeader
        title={isEditMode ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi"}
        subtitle={
          isEditMode
            ? "Cập nhật nội dung, đáp án đúng và nhãn chủ đề của câu hỏi."
            : "Tạo câu hỏi mới và thêm vào ngân hàng câu hỏi."
        }
      />

      {isEditMode && isLoading ? (
        <Skeleton className="h-140 w-full" />
      ) : isEditMode && (isError || !item) ? (
        <p className="text-sm text-ink-faint">Không tìm thấy câu hỏi.</p>
      ) : (
        <QuestionBankForm
          initialValue={item}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/dashboard/question-bank")}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
