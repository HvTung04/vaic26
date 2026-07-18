import { Outlet } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useStudentTopBarInfo } from "@/modules/studentSelf/hooks/useStudentTopBarInfo";
import { StudentTopBar } from "./StudentTopBar";
import { Skeleton } from "@/components/ui/skeleton";

export function StudentLayout() {
  const { name, className, pendingCount, avgRecentScore, isLoading } = useStudentTopBarInfo();

  return (
    <div className="min-h-screen w-full px-4 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        {isLoading ? (
          <Skeleton className="h-[76px] w-full rounded-bento-lg" />
        ) : (
          <StudentTopBar
            name={name}
            className={className}
            pendingCount={pendingCount}
            avgRecentScore={avgRecentScore}
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
