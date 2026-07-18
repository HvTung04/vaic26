import { Link, useNavigate } from "react-router-dom";
import { ClipboardList, LogOut, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/modules/auth/AuthContext";

export interface StudentTopBarProps {
  name: string;
  className: string;
  pendingCount: number;
  avgRecentScore: number | null;
}

export function StudentTopBar({
  name,
  className,
  pendingCount,
  avgRecentScore,
}: StudentTopBarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-bento-lg border border-lavender bg-white px-6 py-4 shadow-bento">
      <p className="font-serif text-2xl font-bold text-ink">
        {" "}
        <Link to="/student">GapLens</Link>
      </p>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 rounded-full bg-lavender-soft px-3 py-1.5 text-sm font-semibold text-[#6B3FCB]">
          <ClipboardList className="h-3.5 w-3.5" /> Bài cần làm: {pendingCount}
        </span>
        {avgRecentScore !== null && (
          <span className="flex items-center gap-1.5 rounded-full bg-mint px-3 py-1.5 text-sm font-semibold text-[#136B4E]">
            <TrendingUp className="h-3.5 w-3.5" /> Điểm TB gần đây:{" "}
            {avgRecentScore}%
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-ink">{name}</p>
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
            {className}
          </p>
        </div>
        <Avatar className="h-10 w-10 border-2 border-lavender">
          <AvatarFallback className="bg-lavender text-ink">
            {name
              .split(" ")
              .slice(-2)
              .map((p) => p[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Đăng xuất"
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
