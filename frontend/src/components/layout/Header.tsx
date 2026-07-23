import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Search, HelpCircle, Moon, Sun, LogOut, CheckCircle2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { clearStoredRole, getStoredRole, getStoredUsername, type UserRole } from "@/utils/auth";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../ThemeProvider";

export default function Header() {
 const location = useLocation();
 const navigate = useNavigate();
 const { theme, setTheme } = useTheme();
 const [role, setRole] = useState<UserRole | null>(getStoredRole());
 const [username, setUsername] = useState<string | null>(getStoredUsername());
 const [searchQuery, setSearchQuery] = useState("");
 const [showNotifications, setShowNotifications] = useState(false);
 const [showHelp, setShowHelp] = useState(false);
 const [notifications, setNotifications] = useState([
  { id: 1, title: "Model Evaluation Complete", time: "10 min ago", read: false },
  { id: 2, title: "New Policy Draft Generated", time: "1 hr ago", read: false },
  { id: 3, title: "Data Connector Synced", time: "2 hrs ago", read: true },
 ]);

 const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

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
  <header className="flex h-16 items-center justify-between border-b border-white/5 bg-[#0b0f19] px-6 lg:px-8 z-50 sticky top-0 ">
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
    <div className="flex items-center gap-1 mr-2 relative">
     <button 
      onClick={() => setShowNotifications(!showNotifications)}
      className={`rounded-lg p-2 transition relative ${showNotifications ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
     >
      <Bell className="h-5 w-5" />
      {notifications.some(n => !n.read) && (
       <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border border-[#0b0f19]" />
      )}
     </button>
     
     <AnimatePresence>
      {showNotifications && (
       <motion.div 
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="absolute top-full right-10 mt-3 w-80 bg-[#131825] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
       >
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
         <h3 className="text-sm font-bold text-white">Notifications</h3>
         <button 
          onClick={() => setNotifications(notifications.map(n => ({...n, read: true})))}
          className="text-[10px] text-purple-400 font-semibold hover:text-purple-300 transition"
         >
          Mark all as read
         </button>
        </div>
        <div className="max-h-80 overflow-y-auto custom-scrollbar">
         {notifications.map((notif) => (
          <div 
           key={notif.id} 
           className={`p-4 border-b border-white/5 flex items-start gap-3 transition cursor-pointer hover:bg-white/5 ${!notif.read ? 'bg-purple-500/5' : ''}`}
           onClick={() => {
            setNotifications(notifications.map(n => n.id === notif.id ? {...n, read: true} : n));
           }}
          >
           <div className={`mt-0.5 shrink-0 rounded-full p-1.5 ${!notif.read ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-slate-400'}`}>
            <Bell size={14} />
           </div>
           <div className="flex-1">
            <p className={`text-xs ${!notif.read ? 'font-bold text-slate-200' : 'font-medium text-slate-400'}`}>
             {notif.title}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">{notif.time}</p>
           </div>
           {!notif.read && (
            <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
           )}
          </div>
         ))}
        </div>
       </motion.div>
      )}
     </AnimatePresence>

     <div className="relative">
      <button 
       onClick={() => setShowHelp(!showHelp)}
       className={`rounded-lg p-2 transition ${showHelp ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
      >
       <HelpCircle className="h-5 w-5" />
      </button>
      
      <AnimatePresence>
       {showHelp && (
        <motion.div 
         initial={{ opacity: 0, y: 10, scale: 0.95 }}
         animate={{ opacity: 1, y: 0, scale: 1 }}
         exit={{ opacity: 0, y: 10, scale: 0.95 }}
         className="absolute top-full right-0 mt-3 w-64 bg-[#131825] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
        >
         <div className="p-4 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-sm font-bold text-white">Help & Resources</h3>
          <p className="text-xs text-slate-400 mt-1">Get the most out of Omnimind</p>
         </div>
         <div className="p-2 space-y-1">
          {[
           { icon: <Search size={14}/>, label: "Documentation", desc: "Browse guides & API refs" },
           { icon: <CheckCircle2 size={14}/>, label: "Keyboard Shortcuts", desc: "Speed up your workflow" },
           { icon: <LogOut size={14} className="rotate-180"/>, label: "Contact Support", desc: "Get help from the team" }
          ].map((item, i) => (
           <button 
            key={i} 
            onClick={() => setShowHelp(false)}
            className="w-full text-left p-3 rounded-lg flex items-start gap-3 transition hover:bg-white/5 group"
           >
            <div className="mt-0.5 shrink-0 p-1.5 rounded-full bg-white/5 text-slate-400 group-hover:group-hover:bg-purple-500/20 group-hover:group-hover:text-purple-400 transition">
             {item.icon}
            </div>
            <div>
             <p className="text-xs font-bold text-slate-200 group-hover:text-white transition">{item.label}</p>
             <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
            </div>
           </button>
          ))}
         </div>
        </motion.div>
       )}
      </AnimatePresence>
     </div>
     
     <button 
      onClick={() => setTheme(isDarkMode ? "light" : "dark")}
      className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white group relative overflow-hidden h-9 w-9"
     >
      <motion.div
       initial={false}
       animate={{ rotate: isDarkMode ? 0 : 180, scale: isDarkMode ? 1 : 0 }}
       transition={{ duration: 0.3 }}
       className="absolute inset-0 flex items-center justify-center"
      >
       <Moon className="h-5 w-5 text-purple-400" />
      </motion.div>
      <motion.div
       initial={false}
       animate={{ rotate: isDarkMode ? -180 : 0, scale: isDarkMode ? 0 : 1 }}
       transition={{ duration: 0.3 }}
       className="absolute inset-0 flex items-center justify-center"
      >
       <Sun className="h-5 w-5 text-amber-400" />
      </motion.div>
      {/* Invisible placeholder to maintain button size */}
      <Moon className="h-5 w-5 opacity-0" />
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