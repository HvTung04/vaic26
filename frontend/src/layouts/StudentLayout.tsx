import { Outlet } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useGetStudentHub } from "@/modules/dashboard/hooks/queries/useGetStudentHub";
import { StudentTopBar } from "./StudentTopBar";
import { Skeleton } from "@/components/ui/skeleton";

export function StudentLayout() {
  const { data, isLoading } = useGetStudentHub();

  return (
    <div className="min-h-screen w-full px-4 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        {isLoading ? (
          <Skeleton className="h-[76px] w-full rounded-bento-lg" />
        ) : (
          <StudentTopBar
            name={data?.name ?? ""}
            className={data?.className ?? ""}
            points={data?.points ?? 0}
            dailyStreak={data?.dailyStreak ?? 0}
          />
        )}
        <div className="mt-6">
          <Outlet />
        </div>
      </div>
      <button
        type="button"
        aria-label="Open chat"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-floating transition-transform hover:scale-105"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    </div>
  );
}
