import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getStoredRole, getStoredUsername } from "@/utils/auth";
import { getAgents } from "../../services/omnimindApi";
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
 ClipboardList,
 Bot
} from "lucide-react";
import Logo from "../common/Logo";

export default function Sidebar() {
 const location = useLocation();
 const role = getStoredRole();
 const username = getStoredUsername() || (role === "admin" ? "System Administrator" : "Compliance Analyst");
 const isAdmin = role === "admin";

 const [aiExperts, setAiExperts] = useState<{ id: string; title: string; desc: string; icon: any; color: string }[]>([]);

 useEffect(() => {
  const fetchAgents = async () => {
   try {
    const agents = await getAgents();
    const colors = [
     "text-purple-400 bg-purple-400/10",
     "text-emerald-400 bg-emerald-400/10",
     "text-blue-400 bg-blue-400/10",
     "text-amber-400 bg-amber-400/10",
     "text-rose-400 bg-rose-400/10",
     "text-green-500 bg-green-500/10",
     "text-fuchsia-400 bg-fuchsia-400/10",
    ];
    
    const iconMap: Record<string, any> = {
     kyc: UserSquare2,
     aml: ShieldCheck,
     compliance: FileCheck,
     payments: Landmark,
     risk: AlertTriangle,
     esg: Leaf,
     wealth: Gem,
    };

    const formattedAgents = agents.map((agent, i) => {
     const matchedIcon = iconMap[agent.id.toLowerCase()] || Bot;
     return {
      id: agent.id,
      title: agent.name,
      desc: agent.owner,
      icon: matchedIcon,
      color: colors[i % colors.length],
     };
    });
    setAiExperts(formattedAgents);
   } catch (err) {
    console.error("Failed to load agents in sidebar", err);
   }
  };

  fetchAgents();
  window.addEventListener("agentsUpdated", fetchAgents);
  return () => window.removeEventListener("agentsUpdated", fetchAgents);
 }, []);

 const adminLinks = [
  { title: "Manage Agents", path: "/experts", icon: Users },
  { title: "Document Library", path: "/knowledge", icon: FolderOpen },
  { title: "Users & Roles", path: "/governance", icon: UserCog },
  { title: "Settings", path: "/settings", icon: Settings },
  { title: "Audit Logs", path: "/analytics", icon: ClipboardList },
 ];

 return (
  <aside className="flex min-h-screen w-72 flex-col bg-[#06080d]/60 backdrop-blur-2xl border-r border-white/5 text-slate-200 z-20 relative shadow-[4px_0_24px_-10px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_24px_-10px_rgba(0,0,0,0.5)] ">
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
        <div className={`text-slate-400 group-hover:group-hover:text-slate-200 ${isActive && location.pathname === '/' ? 'text-purple-400' : ''}`}>
         <Home size={18} />
        </div>
        <span className={`text-sm font-medium ${isActive && location.pathname === '/' ? 'text-white' : 'text-slate-400 group-hover:group-hover:text-slate-200'}`}>
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
          <span className={`text-sm font-medium ${isActiveParam ? 'text-white' : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-100'}`}>
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
            <div className={`text-slate-400 group-hover:group-hover:text-slate-200 ${isActive && location.pathname !== '/' ? 'text-white' : ''}`}>
             <Icon size={18} />
            </div>
            <span className={`text-sm font-medium ${isActive && location.pathname !== '/' ? 'text-white' : 'text-slate-400 group-hover:group-hover:text-slate-200'}`}>
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