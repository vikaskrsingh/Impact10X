import { NavLink, useLocation } from "react-router-dom";
import { getStoredRole, getStoredUsername } from "@/utils/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Home, 
  UserSquare2, 
  ShieldCheck, 
  FileCheck, 
  Landmark, 
  AlertTriangle, 
  Leaf, 
  Gem,
  Users,
  FolderOpen,
  Database,
  UserCog,
  Settings,
  ClipboardList
} from "lucide-react";
import Logo from "../common/Logo";

export default function Sidebar() {
  const location = useLocation();
  const role = getStoredRole();
  const username = getStoredUsername() || (role === "admin" ? "System Administrator" : "Compliance Analyst");
  const isAdmin = role === "admin";

  const aiExperts = [
    { id: "kyc", title: "KYC Expert", desc: "Know Your Customer", icon: UserSquare2, color: "text-purple-400 bg-purple-400/10" },
    { id: "aml", title: "AML Expert", desc: "Anti Money Laundering", icon: ShieldCheck, color: "text-emerald-400 bg-emerald-400/10" },
    { id: "compliance", title: "Compliance Expert", desc: "Regulatory Compliance", icon: FileCheck, color: "text-blue-400 bg-blue-400/10" },
    { id: "payments", title: "Payments Expert", desc: "Payments & Transfers", icon: Landmark, color: "text-amber-400 bg-amber-400/10" },
    { id: "risk", title: "Risk Expert", desc: "Enterprise Risk", icon: AlertTriangle, color: "text-rose-400 bg-rose-400/10" },
    { id: "esg", title: "ESG Expert", desc: "Environmental, Social, Governance", icon: Leaf, color: "text-green-500 bg-green-500/10" },
    { id: "wealth", title: "Wealth Expert", desc: "Wealth Management", icon: Gem, color: "text-fuchsia-400 bg-fuchsia-400/10" },
  ];

  const adminLinks = [
    { title: "Manage Agents", path: "/experts", icon: Users },
    { title: "Document Library", path: "/knowledge", icon: FolderOpen },
    { title: "Users & Roles", path: "/governance", icon: UserCog },
    { title: "Settings", path: "/settings", icon: Settings },
    { title: "Audit Logs", path: "/analytics", icon: ClipboardList },
  ];

  return (
    <aside className="flex min-h-screen w-72 flex-col bg-[#06080d]/60 backdrop-blur-2xl border-r border-white/5 text-slate-200 z-20 relative shadow-[4px_0_24px_-10px_rgba(0,0,0,0.5)]">
      <div className="p-4 border-b border-white/5">
        <Logo />
      </div>

      <nav className="flex-1 px-4 mt-2 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-6">
        
        {/* Home */}
        <div>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                isActive && location.pathname === '/' ? "bg-[#131825]" : "hover:bg-white/5"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`text-slate-400 group-hover:text-slate-200 ${isActive && location.pathname === '/' ? 'text-purple-400' : ''}`}>
                  <Home size={18} />
                </div>
                <span className={`text-sm font-medium ${isActive && location.pathname === '/' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  Home
                </span>
              </>
            )}
          </NavLink>
        </div>

        {/* AI Experts */}
        <div>
          <div className="mb-3 px-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">AI Experts</div>
          <div className="space-y-1">
            {aiExperts.map((expert) => {
              const Icon = expert.icon;
              // Check if we are in workspace and this expert is active
              const isActiveParam = location.pathname === '/workspace' && location.search.includes(expert.id);
              
              return (
                <NavLink
                  key={expert.id}
                  to={`/workspace?expert=${expert.id}`}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                    isActiveParam ? "bg-[#131825]" : "hover:bg-white/5"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${expert.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${isActiveParam ? 'text-white' : 'text-slate-300 group-hover:text-slate-100'}`}>
                      {expert.title}
                    </span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">{expert.desc}</span>
                  </div>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Admin */}
        {isAdmin && (
          <div>
            <div className="mb-3 px-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Admin</div>
            <div className="space-y-1">
              {adminLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.title}
                    to={item.path}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all ${
                        isActive && location.pathname !== '/' ? "bg-[#131825]" : "hover:bg-white/5"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className={`text-slate-400 group-hover:text-slate-200 ${isActive && location.pathname !== '/' ? 'text-white' : ''}`}>
                          <Icon size={18} />
                        </div>
                        <span className={`text-sm font-medium ${isActive && location.pathname !== '/' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                          {item.title}
                        </span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </nav>

    </aside>
  );
}