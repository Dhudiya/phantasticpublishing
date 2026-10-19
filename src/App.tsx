import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import RequireRole from "./components/RequireRole";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import BooksPage from "./pages/BooksPage";
import BookDetailPage from "./pages/BookDetailPage";
import AuthorsPage from "./pages/AuthorsPage";
import AuthorDetailPage from "./pages/AuthorDetailPage";
import ServicesPage from "./pages/ServicesPage";
import ContactPage from "./pages/ContactPage";
import NotFoundPage from "./pages/NotFoundPage";
import { AuthProvider } from "./admin/AuthContext";
import AdminLogin from "./pages/admin/AdminLogin";

// Admin pages are code-split: public visitors never download admin code.
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const PageEditor = lazy(() => import("./pages/admin/PageEditor"));
const BooksManagement = lazy(() => import("./pages/admin/BooksManagement"));
const AuthorsManagement = lazy(() => import("./pages/admin/AuthorsManagement"));
const ServicesManagement = lazy(() => import("./pages/admin/ServicesManagement"));
const TestimonialsManagement = lazy(() => import("./pages/admin/TestimonialsManagement"));
const TeamManagement = lazy(() => import("./pages/admin/TeamManagement"));
const ContentManagement = lazy(() => import("./pages/admin/ContentManagement"));
const MediaManager = lazy(() => import("./pages/admin/MediaManager"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const WebsiteSettings = lazy(() => import("./pages/admin/WebsiteSettings"));
const ThemeSettings = lazy(() => import("./pages/admin/ThemeSettings"));
const InquiryManagement = lazy(() => import("./pages/admin/InquiryManagement"));
const AnalyticsPage = lazy(() => import("./pages/admin/AnalyticsPage"));
const SeoBotPage = lazy(() => import("./pages/admin/SeoBotPage"));

function AdminFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <div className="w-8 h-8 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<AdminFallback />}>
          <Routes>
            {/* Public site */}
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/books" element={<BooksPage />} />
              <Route path="/books/:slug" element={<BookDetailPage />} />
              <Route path="/authors" element={<AuthorsPage />} />
              <Route path="/authors/:slug" element={<AuthorDetailPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="pages" element={<RequireRole roles={["super_admin", "admin", "editor"]}><PageEditor /></RequireRole>} />
              <Route path="books" element={<RequireRole roles={["super_admin", "admin", "editor"]}><BooksManagement /></RequireRole>} />
              <Route path="authors" element={<RequireRole roles={["super_admin", "admin", "editor"]}><AuthorsManagement /></RequireRole>} />
              <Route path="services" element={<RequireRole roles={["super_admin", "admin", "editor"]}><ServicesManagement /></RequireRole>} />
              <Route path="testimonials" element={<RequireRole roles={["super_admin", "admin", "editor"]}><TestimonialsManagement /></RequireRole>} />
              <Route path="team" element={<RequireRole roles={["super_admin", "admin", "editor"]}><TeamManagement /></RequireRole>} />
              <Route path="content" element={<RequireRole roles={["super_admin", "admin", "editor"]}><ContentManagement /></RequireRole>} />
              <Route path="media" element={<RequireRole roles={["super_admin", "admin", "editor"]}><MediaManager /></RequireRole>} />
              <Route path="inquiries" element={<RequireRole roles={["super_admin", "admin", "editor"]}><InquiryManagement /></RequireRole>} />
              <Route path="analytics" element={<RequireRole roles={["super_admin", "admin", "editor"]}><AnalyticsPage /></RequireRole>} />
              <Route path="seo" element={<RequireRole roles={["super_admin", "admin", "editor"]}><SeoBotPage /></RequireRole>} />
              <Route path="users" element={<RequireRole roles={["super_admin"]}><UserManagement /></RequireRole>} />
              <Route path="settings" element={<RequireRole roles={["super_admin", "admin"]}><WebsiteSettings /></RequireRole>} />
              <Route path="theme" element={<RequireRole roles={["super_admin", "admin"]}><ThemeSettings /></RequireRole>} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
