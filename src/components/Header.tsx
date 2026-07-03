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
              relative flex items-center justify-between px-4 sm:px-6 h-16
              rounded-2xl
              transition-all duration-500 ease-out
              ${onDarkBg ? "glass-dark" : "glass"}
            `}
          >
            {/* Specular highlight — light catching the top edge of the glass */}
            <span
              className="pointer-events-none absolute inset-x-4 top-0 h-px"
              style={{
                background: onDarkBg
                  ? "linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.30) 50%, transparent 90%)"
                  : "linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.95) 50%, transparent 90%)",
              }}
            />

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
                      relative px-4 py-2 text-[13px] font-medium tracking-wide rounded-full
                      transition-all duration-300 ease-out
                      ${active
                        ? onDarkBg
                          ? "glass-nav-active text-white"
                          : "bg-neutral-900 text-white shadow-sm"
                        : onDarkBg
                        ? "text-white/65 hover:text-white hover:bg-white/10 glass-pill"
                        : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-900/5 glass-pill"
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
                relative md:hidden w-10 h-10 rounded-xl flex items-center justify-center
                transition-all duration-300 active:scale-90
                ${onDarkBg
                  ? "text-white hover:bg-white/10"
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
          transition-all duration-500
          ${mobileOpen ? "visible" : "invisible pointer-events-none"}
        `}
      >
        {/* Backdrop */}
        <div
          className={`
            absolute inset-0 bg-black/20 backdrop-blur-[3px]
            transition-opacity duration-500
            ${mobileOpen ? "opacity-100" : "opacity-0"}
          `}
          onClick={closeMobile}
        />

        {/* Sheet */}
        <div
          className={`
            absolute top-[76px] left-3 right-3
            glass-sheet rounded-3xl p-2
            transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
            ${mobileOpen
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-4 scale-[0.95]"}
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
                    transition-all duration-300
                    ${active
                      ? "bg-neutral-950 text-white"
                      : "text-neutral-700 hover:bg-neutral-900/5 active:scale-[0.98]"
                    }
                  `}
                  style={{
                    transitionDelay: mobileOpen ? `${i * 40}ms` : "0ms",
                    transform: mobileOpen ? "translateY(0)" : "translateY(-6px)",
                    opacity: mobileOpen ? 1 : 0,
                    transition: `opacity 0.4s ease ${i * 40}ms, transform 0.4s ease ${i * 40}ms, background-color 0.2s`,
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
