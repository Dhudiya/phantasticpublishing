import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/books", label: "Books" },
  { to: "/authors", label: "Authors" },
  { to: "/services", label: "Services" },
  { to: "/contact", label: "Contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    // Read initial scroll position
    setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // On the home page (before scrolling) the hero is dark, so use light text.
  // Everywhere else (scrolled or non-home) the header is on a light glass → dark text.
  const onDarkBg = isHome && !scrolled;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
          <nav
            className={`
              flex items-center justify-between px-4 sm:px-6 h-16
              rounded-2xl
              transition-all duration-500 ease-out
              ${onDarkBg ? "glass-dark" : "glass"}
            `}
          >
            {/* Logo */}
            <Link
              to="/"
              className="shrink-0 transition-transform duration-300 hover:scale-[1.03] active:scale-[0.97]"
            >
              <Logo variant="auto" onDark={onDarkBg} />
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-0.5">
              {navLinks.map((link) => {
                const active = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`
                      px-4 py-2 text-[13px] font-medium tracking-wide rounded-full
                      transition-all duration-300 ease-out
                      ${active
                        ? onDarkBg
                          ? "bg-white/20 text-white border border-white/25"
                          : "bg-neutral-900 text-white shadow-sm"
                        : onDarkBg
                        ? "text-white/65 hover:text-white hover:bg-white/12 glass-pill"
                        : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-900/6 glass-pill"
                      }
                    `}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Mobile toggle */}
            <button
              className={`
                md:hidden w-10 h-10 rounded-xl flex items-center justify-center
                transition-all duration-200 active:scale-90
                ${onDarkBg
                  ? "text-white hover:bg-white/12"
                  : "text-neutral-700 hover:bg-neutral-900/8"
                }
              `}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              <span
                className={`
                  absolute transition-all duration-300
                  ${mobileOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90"}
                `}
              >
                <X size={20} />
              </span>
              <span
                className={`
                  absolute transition-all duration-300
                  ${mobileOpen ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"}
                `}
              >
                <Menu size={20} />
              </span>
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={`
          fixed inset-0 z-40 md:hidden
          transition-all duration-400
          ${mobileOpen ? "visible" : "invisible pointer-events-none"}
        `}
      >
        {/* Backdrop */}
        <div
          className={`
            absolute inset-0 bg-black/30 backdrop-blur-[2px]
            transition-opacity duration-400
            ${mobileOpen ? "opacity-100" : "opacity-0"}
          `}
          onClick={closeMobile}
        />

        {/* Sheet */}
        <div
          className={`
            absolute top-[76px] left-3 right-3
            bg-white/90 backdrop-blur-2xl
            border border-white/60
            rounded-3xl p-2
            shadow-2xl shadow-black/10
            transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]
            ${mobileOpen
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-3 scale-[0.96]"}
          `}
        >
          <div className="space-y-0.5">
            {navLinks.map((link, i) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMobile}
                  className={`
                    flex items-center px-4 py-3.5 rounded-2xl text-[15px] font-medium
                    transition-all duration-200
                    ${active
                      ? "bg-neutral-950 text-white"
                      : "text-neutral-700 hover:bg-neutral-100 active:scale-[0.98]"
                    }
                  `}
                  style={{
                    transitionDelay: mobileOpen ? `${i * 35}ms` : "0ms",
                    transform: mobileOpen ? "translateY(0)" : "translateY(-4px)",
                    opacity: mobileOpen ? 1 : 0,
                    transition: `opacity 0.3s ease ${i * 35}ms, transform 0.3s ease ${i * 35}ms, background-color 0.2s`,
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
