import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Dashboard } from "@/lib/index/components/Dashboard";
import { Header } from "@/lib/index/components/Header";
import { Records } from "@/lib/index/components/Records";
import { Registration } from "@/lib/index/components/Registration";
import { FollowUp } from "@/lib/index/components/followup/FollowUp";
import { Sidebar } from "@/lib/index/components/Sidebar";
import { pageTitles } from "@/lib/index/data";

export default function Index() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const initial = location.pathname.includes("register")
    ? "register"
    : location.pathname.includes("records")
      ? "records"
      : location.pathname.includes("followup")
        ? "followup"
        : "dashboard";
  const [view, setViewState] = useState(initial);
  const setView = (next: string) => {
    setViewState(next);
    navigate(next === "dashboard" ? "/" : `/${next}`, { replace: true });
  };
  return (
    <div className="min-h-screen bg-[#f5f9f9] font-sans text-[#103e54]">
      <div className="flex min-h-screen">
        <div className="hidden lg:block">
          <Sidebar view={view} setView={setView} />
        </div>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              className="fixed inset-y-0 left-0 z-30 lg:hidden"
            >
              <Sidebar
                view={view}
                setView={setView}
                close={() => setMobileOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-20 bg-[#103e54]/20 lg:hidden"
          />
        )}
        <main className="min-w-0 flex-1">
          <Header title={pageTitles[view]} onMenu={() => setMobileOpen(true)} />
          <div className="mx-auto max-w-[1480px] p-5 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
              >
                {view === "dashboard" ? (
                  <Dashboard setView={setView} />
                ) : view === "register" ? (
                  <Registration setView={setView} />
                ) : view === "records" ? (
                  <Records setView={setView} />
                ) : (
                  <FollowUp />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
