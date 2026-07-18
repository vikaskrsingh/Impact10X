import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Search, HelpCircle, Moon, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { clearStoredRole, getStoredRole, getStoredUsername, type UserRole } from "@/utils/auth";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole | null>(getStoredRole());
  const [username, setUsername] = useState<string | null>(getStoredUsername());
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/experts?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  useEffect(() => {
    setRole(getStoredRole());
    setUsername(getStoredUsername());
  }, [location.pathname]);

  const handleSignOut = () => {
    clearStoredRole();
    setRole(null);
    setUsername(null);
    navigate("/login", { replace: true });
  };

  const isAuthenticated = role !== null;
  const isAdmin = role === "admin";
  
  const displayName = username || (isAdmin ? "System Administrator" : "Compliance Analyst");
  const displayRole = isAdmin ? "System Administrator" : "Compliance Analyst";
  const displayInitials = displayName.substring(0, 2).toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/5 bg-[#0b0f19] px-6 lg:px-8 z-10 sticky top-0">
      <div className="relative w-full max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search across agents..."
            className="h-10 rounded-xl border-white/5 bg-[#131825] text-slate-200 pl-10 pr-12 placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all shadow-none"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 text-[10px] font-medium text-slate-500">
            <span className="text-[11px]">⌘</span>K
          </kbd>
        </div>
      </div>

      <div className="ml-6 flex items-center gap-4">
        <div className="flex items-center gap-1 mr-2">
          <button className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border border-[#0b0f19]" />
          </button>
          <button className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white">
            <HelpCircle className="h-5 w-5" />
          </button>
          <button className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white">
            <Moon className="h-5 w-5" />
          </button>
        </div>

        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/5 bg-[#131825] p-1">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/20">
                <span className="text-[10px] font-semibold text-primary">{displayInitials}</span>
              </div>
              <div className="flex flex-col px-2 border-r border-white/10">
                <span className="text-xs font-semibold text-slate-300 leading-tight">{displayName}</span>
                <span className="text-[10px] text-slate-500 leading-tight">{displayRole}</span>
              </div>
              <button onClick={handleSignOut} className="flex items-center gap-1.5 pr-3 pl-1 text-slate-400 hover:text-rose-400 transition">
                <LogOut className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Sign out</span>
              </button>
            </div>
          </div>
        ) : (
          <Link to="/login" className="rounded-full border border-white/5 bg-[#131825] px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}