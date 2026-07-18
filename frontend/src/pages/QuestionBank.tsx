import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/layouts/DashboardHeader";
import { QuestionBankTable } from "@/modules/question-bank/components/QuestionBankTable";

export default function QuestionBank() {
  const navigate = useNavigate();

  return (
    <div>
      <DashboardHeader
        title="Ngân hàng câu hỏi"
        subtitle="Xem, tìm kiếm và quản lý tất cả câu hỏi có sẵn cho bài kiểm tra."
      />
      <QuestionBankTable
        onAddQuestion={() => navigate("/dashboard/question-bank/new")}
        onEditQuestion={(id) => navigate(`/dashboard/question-bank/${id}`)}
      />
    </div>
  );
}
