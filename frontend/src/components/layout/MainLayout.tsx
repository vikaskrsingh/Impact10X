import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen text-slate-200 selection:bg-primary/30">
      <div className="animated-bg" />
      
      <Sidebar />

      <div className="flex flex-col flex-1 relative overflow-hidden z-10">
        
        {/* Decorative background glow */}
        <div className="pointer-events-none absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />

        <Header />

        <main className="flex-1 p-8 overflow-auto z-10 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

      </div>

    </div>
  );
}