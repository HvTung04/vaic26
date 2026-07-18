import { NavLink } from "react-router-dom";
import { LayoutGrid, Database, Users2, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/utils/cn";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/question-bank", label: "Question Bank", icon: Database, end: false },
  { to: "/class-list", label: "Class List", icon: Users2, end: false },
  { to: "/settings", label: "Settings", icon: Settings, end: false },
];

export interface SidebarProps {
  teacherName?: string;
  teacherRole?: string;
}

export function Sidebar({
  teacherName = "Cô Lan Anh",
  teacherRole = "Toán - Khối 8",
}: SidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col justify-between border-r border-hairline/70 bg-white/60 px-5 py-6 backdrop-blur-sm">
      <div>
        <div className="mb-8 px-1">
          <p className="font-serif text-2xl font-bold leading-tight text-ink">
            Lumina
            <br />
            Path
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-ink-faint">
            Educator Console
          </p>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-bento-sm px-3.5 py-2.5 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-lavender text-ink shadow-sm"
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
          className="text-center text-xs font-semibold text-ink-faint underline-offset-2 transition-colors hover:text-primary hover:underline"
        >
          Xem giao diện học sinh &rarr;
        </NavLink>
        <div className="flex items-center gap-3 rounded-bento-sm border border-hairline/70 bg-white p-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-lavender text-ink">
              {teacherName
                .split(" ")
                .slice(-2)
                .map((p) => p[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {teacherName}
            </p>
            <p className="truncate text-xs text-ink-faint">{teacherRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
