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
  { to: "/admin", label: "Dashboard", icon: <LayoutDashboard size={18} />, roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/pages", label: "Site Pages", icon: <LayoutTemplate size={18} />, roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/books", label: "Books", icon: <BookOpen size={18} />, roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/authors", label: "Authors", icon: <UserCircle size={18} />, roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/services", label: "Services", icon: <PenTool size={18} />, roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/testimonials", label: "Testimonials", icon: <Quote size={18} />, roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/team", label: "Team", icon: <Users size={18} />, roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/content", label: "Custom Content", icon: <FileText size={18} />, roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/media", label: "Media", icon: <Image size={18} />, roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/inquiries", label: "Inquiries", icon: <Inbox size={18} />, roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/analytics", label: "Analytics", icon: <BarChart3 size={18} />, roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/users", label: "Users", icon: <Users size={18} />, roles: ["super_admin"] },
  { to: "/admin/settings", label: "Settings", icon: <Settings size={18} />, roles: ["super_admin", "admin"] },
  { to: "/admin/theme", label: "Theme", icon: <Palette size={18} />, roles: ["super_admin", "admin"] },
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
    if (!loading && !user) {
      navigate("/admin/login", { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
          <p className="text-sm text-neutral-400">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Profile may still be auto-creating after a fresh login — show a loader
  // instead of a blank page so the user isn't stranded.
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
          <p className="text-sm text-neutral-400">Setting up your account…</p>
        </div>
      </div>
    );
  }

  if (!profile.active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="text-center max-w-sm">
          <h1 className="font-serif text-2xl font-bold mb-2">Account disabled</h1>
          <p className="text-neutral-500 text-sm mb-6">
            Your admin account has been deactivated. Contact a super admin to restore access.
          </p>
          <button onClick={() => signOut()} className="text-sm font-medium underline">
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

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 glass-dark rounded-r-3xl">
        <SidebarContent visibleNav={visibleNav} onSignOut={handleSignOut} />
      </aside>

      {/* Sidebar — mobile drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 flex flex-col bg-neutral-950 text-white animate-menu-item">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <SidebarContent visibleNav={visibleNav} onSignOut={handleSignOut} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-neutral-200">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-neutral-600 hover:text-neutral-900"
              >
                <Menu size={22} />
              </button>
              <h2 className="font-serif text-lg font-bold text-neutral-900 hidden sm:block">
                {navItems.find((n) => n.to === location.pathname)?.label ||
                  (location.pathname.startsWith("/admin/pages") ? "Site Pages" :
                   location.pathname.startsWith("/admin/books") ? "Books" :
                   location.pathname.startsWith("/admin/authors") ? "Authors" :
                   location.pathname.startsWith("/admin/services") ? "Services" :
                   location.pathname.startsWith("/admin/testimonials") ? "Testimonials" :
                   location.pathname.startsWith("/admin/team") ? "Team" :
                   location.pathname.startsWith("/admin/content") ? "Custom Content" :
                   location.pathname.startsWith("/admin/media") ? "Media" :
                   location.pathname.startsWith("/admin/inquiries") ? "Inquiries" :
                   location.pathname.startsWith("/admin/analytics") ? "Analytics" :
                   location.pathname.startsWith("/admin/users") ? "Users" :
                   location.pathname.startsWith("/admin/settings") ? "Settings" :
                   location.pathname.startsWith("/admin/theme") ? "Theme" : "Dashboard")}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/"
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                View site <ExternalLink size={14} />
              </Link>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-medium">
                    {profile.full_name.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-neutral-900 leading-tight">{profile.full_name}</p>
                    <p className="text-[10px] text-neutral-400 leading-tight">{roleLabel[profile.role]}</p>
                  </div>
                  <ChevronDown size={14} className="text-neutral-400" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-neutral-200 rounded-xl shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-neutral-100">
                      <p className="text-sm font-medium text-neutral-900 truncate">{profile.full_name}</p>
                      <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
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
      <div className="px-6 h-16 flex items-center border-b border-white/10">
        <Logo variant="dark" />
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/admin"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </div>
  );
}
