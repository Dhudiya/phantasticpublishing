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
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const useDarkText = scrolled || !isHome;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
          <nav
            className={`
              flex items-center justify-between px-4 sm:px-6 h-16
              rounded-2xl
              transition-all duration-500 ease-out
              ${
                scrolled
                  ? "glass"
                  : isHome
                  ? "glass-dark"
                  : "glass"
              }
            `}
          >
            {/* Logo */}
            <Link to="/" className="group shrink-0 transition-transform duration-300 group-hover:scale-[1.03]">
              <Logo variant="auto" onDark={!useDarkText} />
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`
                      relative px-4 py-2 text-[13px] font-medium tracking-wide rounded-full
                      transition-all duration-300 ease-out
                      ${
                        active
                          ? useDarkText
                            ? "text-white bg-neutral-900 shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                            : "text-white glass-pill bg-white/25 border-white/30"
                          : useDarkText
                          ? "text-neutral-500 hover:text-neutral-900 glass-pill hover:bg-white/60 hover:border-white/70"
                          : "text-white/70 hover:text-white glass-pill hover:bg-white/15 hover:border-white/25"
                      }
                    `}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-90"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 glass-pill ${
                  useDarkText
                    ? "hover:bg-white/60 hover:border-white/70"
                    : "hover:bg-white/15 hover:border-white/25"
                }`}
              >
                {mobileOpen ? (
                  <X
                    size={20}
                    className={`transition-transform duration-300 ${useDarkText ? "text-neutral-900" : "text-white"}`}
                  />
                ) : (
                  <Menu
                    size={20}
                    className={`transition-transform duration-300 ${useDarkText ? "text-neutral-900" : "text-white"}`}
                  />
                )}
              </div>
            </button>
          </nav>
        </div>
      </header>

      {/* iOS 26 mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ${
          mobileOpen ? "visible" : "invisible pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-500 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeMobile}
        />

        {/* Sheet */}
        <div
          className={`
            absolute top-20 left-3 right-3
            glass
            rounded-3xl
            p-3
            transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
            ${mobileOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-4 scale-[0.97]"}
          `}
        >
          <div className="space-y-1">
            {navLinks.map((link, i) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMobile}
                  className={`
                    flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[15px] font-medium
                    transition-all duration-300 ease-out
                    ${
                      active
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-700 hover:bg-neutral-100/80 active:scale-[0.98]"
                    }
                    ${mobileOpen ? "animate-menu-item" : ""}
                  `}
                  style={{ animationDelay: `${i * 40}ms` }}
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
