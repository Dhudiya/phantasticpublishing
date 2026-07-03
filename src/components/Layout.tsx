import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout() {
  const { pathname } = useLocation();
  const [transitioning, setTransitioning] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTransitioning(true);
    const timer = setTimeout(() => setTransitioning(false), 50);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main
        ref={mainRef}
        className={`flex-1 ${transitioning ? "opacity-0" : "page-enter"}`}
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
