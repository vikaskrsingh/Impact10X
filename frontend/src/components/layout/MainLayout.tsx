import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout() {
 const location = useLocation();

 return (
  <div className="flex h-screen text-slate-200 bg-slate-950 relative overflow-hidden ">
   {/* Background glow effects */}
   <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-slate-900 to-slate-950 " />
    <div className="absolute -left-1/4 -bottom-1/4 w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full " />
    <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full " />
   </div>

   <Sidebar />
   <div className="flex flex-1 flex-col relative z-10">
    <Header />

    <main className="flex-1 overflow-x-hidden p-6 lg:p-8 flex flex-col relative">
     <AnimatePresence mode="wait">
      <motion.div
       key={location.pathname}
       initial={{ opacity: 0, scale: 0.98, y: 10 }}
       animate={{ opacity: 1, scale: 1, y: 0 }}
       exit={{ opacity: 0, scale: 0.98, y: -10 }}
       transition={{ duration: 0.4, ease: "easeOut" }}
       className="flex-1 flex flex-col h-full relative z-10 w-full"
      >
       <Outlet />
      </motion.div>
     </AnimatePresence>
    </main>
   </div>
  </div>
 );
}