import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { clearStoredRole, getStoredRole, type UserRole } from "@/utils/auth";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole | null>(getStoredRole());

  useEffect(() => {
    setRole(getStoredRole());
  }, [location.pathname]);

  const handleSignOut = () => {
    clearStoredRole();
    setRole(null);
    navigate("/login", { replace: true });
  };

  const isAuthenticated = role !== null;

  return (
    <header className="flex h-20 items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-md px-6 lg:px-8 z-10 sticky top-0 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      <div className="relative w-full max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search experts, documents, policies..."
          className="h-11 rounded-xl border-white/10 bg-black/40 text-slate-200 pl-9 placeholder:text-slate-400 focus-visible:ring-primary focus-visible:border-primary transition-all glow-border"
        />
      </div>

      <div className="ml-6 flex items-center gap-3">
        <button className="rounded-full border border-white/10 bg-black/40 p-2.5 text-slate-300 transition hover:glass-panel/10 hover:text-white">
          <Bell className="h-5 w-5" />
        </button>

        {isAuthenticated ? (
          <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary glow-border">
            {role === "admin" ? "Admin workspace" : "Expert workspace"}
          </div>
        ) : null}

        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full border border-white/10 bg-black/40 px-3 py-2 text-sm font-medium text-slate-300 transition hover:glass-panel/10 hover:text-white"
          >
            Sign out
          </button>
        ) : (
          <Link to="/login" className="rounded-full border border-white/10 bg-black/40 px-3 py-2 text-sm font-medium text-slate-300 transition hover:glass-panel/10 hover:text-white">
            Sign in
          </Link>
        )}

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 glass-panel">
          <Avatar className="h-9 w-9 border border-primary/50 shadow-[0_0_10px_var(--primary)]">
            <AvatarFallback className="bg-primary/20 text-primary">VS</AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-200">Vikas Singh</p>
            <p className="text-xs text-slate-400">{isAuthenticated ? (role === "admin" ? "Platform Admin" : "Knowledge Expert") : "Signed out"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}