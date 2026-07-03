import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth, AdminRole } from "../../admin/AuthContext";
import Logo from "../../components/Logo";
import {
  LayoutDashboard, FileText, Image, Users, Settings, Palette,
  Inbox, BarChart3, LogOut, Menu, X, ExternalLink, ChevronDown,
  BookOpen, PenTool, Quote, UserCircle, LayoutTemplate,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles: AdminRole[];
}

const navItems: NavItem[] = [
  { to: "/admin",             label: "Dashboard",     icon: <LayoutDashboard size={17} />, roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/pages",       label: "Site Pages",    icon: <LayoutTemplate size={17} />,  roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/books",       label: "Books",         icon: <BookOpen size={17} />,        roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/authors",     label: "Authors",       icon: <UserCircle size={17} />,      roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/services",    label: "Services",      icon: <PenTool size={17} />,         roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/testimonials",label: "Testimonials",  icon: <Quote size={17} />,           roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/team",        label: "Team",          icon: <Users size={17} />,           roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/content",     label: "Custom Content",icon: <FileText size={17} />,        roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/media",       label: "Media",         icon: <Image size={17} />,           roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/inquiries",   label: "Inquiries",     icon: <Inbox size={17} />,           roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/analytics",   label: "Analytics",     icon: <BarChart3 size={17} />,       roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/users",       label: "Users",         icon: <Users size={17} />,           roles: ["super_admin"] },
  { to: "/admin/settings",    label: "Settings",      icon: <Settings size={17} />,        roles: ["super_admin", "admin"] },
  { to: "/admin/theme",       label: "Theme",         icon: <Palette size={17} />,         roles: ["super_admin", "admin"] },
];

const roleLabel: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
};

export default function AdminLayout() {
  const { profile, user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/admin/login", { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  if (loading) return <LoadingScreen message="Loading…" />;
  if (!user) return null;
  if (!profile) return <LoadingScreen message="Setting up your account…" />;

  if (!profile.active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="text-center max-w-sm">
          <h1 className="font-serif text-2xl font-bold mb-2">Account disabled</h1>
          <p className="text-neutral-500 text-sm mb-6">
            Your admin account has been deactivated. Contact a super admin to restore access.
          </p>
          <button onClick={() => signOut()} className="text-sm font-medium underline hover:text-neutral-600 transition-colors">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const visibleNav = navItems.filter((n) => n.roles.includes(profile.role));

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const pageLabel =
    navItems.find((n) => n.to === location.pathname)?.label ||
    (location.pathname.startsWith("/admin/pages")        ? "Site Pages" :
     location.pathname.startsWith("/admin/books")        ? "Books" :
     location.pathname.startsWith("/admin/authors")      ? "Authors" :
     location.pathname.startsWith("/admin/services")     ? "Services" :
     location.pathname.startsWith("/admin/testimonials") ? "Testimonials" :
     location.pathname.startsWith("/admin/team")         ? "Team" :
     location.pathname.startsWith("/admin/content")      ? "Custom Content" :
     location.pathname.startsWith("/admin/media")        ? "Media" :
     location.pathname.startsWith("/admin/inquiries")    ? "Inquiries" :
     location.pathname.startsWith("/admin/analytics")    ? "Analytics" :
     location.pathname.startsWith("/admin/users")        ? "Users" :
     location.pathname.startsWith("/admin/settings")     ? "Settings" :
     location.pathname.startsWith("/admin/theme")        ? "Theme" : "Dashboard");

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 glass-sidebar">
        <SidebarContent visibleNav={visibleNav} onSignOut={handleSignOut} />
      </aside>

      {/* Sidebar — mobile drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[3px] transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 flex flex-col glass-sidebar animate-menu-item">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors z-10"
            >
              <X size={18} />
            </button>
            <SidebarContent visibleNav={visibleNav} onSignOut={handleSignOut} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-40 glass-topbar">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-900/5 transition-all duration-300"
              >
                <Menu size={20} />
              </button>
              <span className="font-semibold text-sm text-neutral-900 hidden sm:block tracking-tight">
                {pageLabel}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/"
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-neutral-500 hover:text-neutral-900 hover:bg-neutral-900/5 transition-all duration-300"
              >
                View site <ExternalLink size={12} />
              </Link>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-lg hover:bg-neutral-900/5 transition-all duration-300"
                >
                  <div className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[11px] font-semibold shrink-0">
                    {(profile.full_name.charAt(0) || "A").toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-neutral-900 leading-tight">{profile.full_name}</p>
                    <p className="text-[10px] text-neutral-400 leading-tight">{roleLabel[profile.role]}</p>
                  </div>
                  <ChevronDown
                    size={13}
                    className={`text-neutral-400 transition-transform duration-300 ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* User dropdown */}
                <div
                  className={`
                    absolute right-0 top-full mt-1.5 w-52
                    glass-sheet rounded-2xl py-1 z-50
                    transition-all duration-300 origin-top-right
                    ${userMenuOpen
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-95 -translate-y-1 pointer-events-none"}
                  `}
                >
                  <div className="px-4 py-2.5 border-b border-neutral-100/60">
                    <p className="text-xs font-semibold text-neutral-900 truncate">{profile.full_name}</p>
                    <p className="text-[10px] text-neutral-400 truncate mt-0.5">{user.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-neutral-600 hover:bg-neutral-900/5 hover:text-neutral-900 transition-colors duration-200"
                  >
                    <LogOut size={13} /> Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main key={location.pathname} className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  visibleNav,
  onSignOut,
}: {
  visibleNav: NavItem[];
  onSignOut: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 h-14 flex items-center border-b border-white/8 shrink-0">
        <Logo variant="dark" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/admin"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 ${
                isActive
                  ? "glass-nav-active text-white"
                  : "text-neutral-400 hover:text-white hover:bg-white/8"
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-white/8 shrink-0">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-neutral-500 hover:text-white hover:bg-white/8 transition-all duration-300"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
        <p className="text-xs text-neutral-400">{message}</p>
      </div>
    </div>
  );
}
