import { NavLink } from "react-router-dom";
import Logo from "../common/Logo";
import { getNavigation } from "./navigation";
import { ShieldCheck } from "lucide-react";
import { getStoredRole } from "@/utils/auth";

export default function Sidebar() {
  const role = getStoredRole();
  const navigation = getNavigation(role);

  return (
    <aside className="flex min-h-screen w-72 flex-col border-r border-white/10 bg-black/40 backdrop-blur-xl text-slate-200 z-20 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.5)]">
      <Logo />

      <div className="mx-4 mb-4 rounded-2xl border border-primary/30 bg-primary/10 p-3 glass-panel relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none"></div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200 relative z-10">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Banking workspace
        </div>
        <p className="mt-1 text-xs text-slate-400 relative z-10">Role-based access and approval flows are active.</p>
      </div>

      <nav className="flex-1 px-3">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.title}
              to={item.path}
              className={({ isActive }) =>
                `group relative mb-2 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-primary/10 text-primary glow-text border border-primary/20 shadow-[0_0_15px_-5px_var(--primary)] before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-r-full before:bg-primary before:shadow-[0_0_10px_var(--primary)]"
                    : "text-slate-400 hover:translate-x-1 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={18} className="transition-transform group-hover:scale-110" />
              {item.title}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-5 text-xs text-slate-400">
        <div className="font-semibold text-primary glow-text">AURA v1.0</div>
        <div className="mt-1">Operational for enterprise knowledge orchestration</div>
      </div>
    </aside>
  );
}