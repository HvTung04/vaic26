import { NavLink, useNavigate } from "react-router-dom";
import { LayoutGrid, Database, Users2, ClipboardList, Settings, LogOut } from "lucide-react";
import { cn } from "@/utils/cn";
import { ClassSelector } from "@/modules/classes/components/ClassSelector";
import { useAuth } from "@/modules/auth/AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Bảng điều khiển", icon: LayoutGrid, end: true },
  { to: "/dashboard/question-bank", label: "Ngân hàng câu hỏi", icon: Database, end: false },
  { to: "/dashboard/class-list", label: "Quản lý học sinh", icon: Users2, end: false },
  { to: "/dashboard/tests", label: "Bài test", icon: ClipboardList, end: false },
  { to: "/dashboard/settings", label: "Cài đặt", icon: Settings, end: false },
];

export function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col justify-between border-r border-hairline/70 bg-white/60 px-5 py-6 backdrop-blur-sm">
      <div>
        <div className="mb-6 px-1">
          <div className="flex items-center gap-2.5">
            <div className="relative h-7 w-7">
              <div className="absolute inset-0 rounded-full bg-ink" />
              <div className="absolute inset-[5px] rounded-full border-2 border-lime" />
              <div className="absolute right-0 top-0 h-2 w-2 rounded-full bg-ember" />
            </div>
            <p className="font-display text-xl font-semibold leading-tight text-ink">
              GapLens
            </p>
          </div>
          <p className="mt-2 pl-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
            Bảng điều khiển giáo viên
          </p>
        </div>

        <div className="mb-6">
          <ClassSelector />
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-bento-sm px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-ink text-cream shadow-[0_6px_18px_-8px_rgba(28,26,36,0.4)]"
                    : "text-ink-soft hover:bg-ink/[0.04] hover:text-ink",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex flex-col gap-3">
        <NavLink
          to="/student"
          className="flex items-center justify-center gap-1.5 rounded-bento-sm border border-hairline/60 bg-white/50 px-3 py-2 text-xs font-semibold text-ink-faint transition-all hover:text-ink hover:border-ink/20"
        >
          Xem góc học sinh
          <span aria-hidden>&rarr;</span>
        </NavLink>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-center gap-1.5 rounded-bento-sm border border-hairline/60 bg-white/50 px-3 py-2 text-xs font-semibold text-ink-faint transition-all hover:border-ember/40 hover:text-ember"
        >
          <LogOut className="h-3.5 w-3.5" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
