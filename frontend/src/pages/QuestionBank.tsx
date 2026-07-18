import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/layouts/DashboardHeader";
import { QuestionBankTable } from "@/modules/question-bank/components/QuestionBankTable";

export default function QuestionBank() {
  const navigate = useNavigate();

  return (
    <div>
      <DashboardHeader
        title="Question Bank"
        subtitle="Browse, search, and manage every question available to your tests."
      />
      <QuestionBankTable
        onAddQuestion={() => navigate("/dashboard/question-bank/new")}
        onEditQuestion={(id) => navigate(`/dashboard/question-bank/${id}`)}
      />
    </div>
  );
}
