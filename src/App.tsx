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
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PageEditor from "./pages/admin/PageEditor";
import BooksManagement from "./pages/admin/BooksManagement";
import AuthorsManagement from "./pages/admin/AuthorsManagement";
import ServicesManagement from "./pages/admin/ServicesManagement";
import TestimonialsManagement from "./pages/admin/TestimonialsManagement";
import TeamManagement from "./pages/admin/TeamManagement";
import ContentManagement from "./pages/admin/ContentManagement";
import MediaManager from "./pages/admin/MediaManager";
import UserManagement from "./pages/admin/UserManagement";
import WebsiteSettings from "./pages/admin/WebsiteSettings";
import ThemeSettings from "./pages/admin/ThemeSettings";
import InquiryManagement from "./pages/admin/InquiryManagement";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import SeoBotPage from "./pages/admin/SeoBotPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AuthProvider>
  );
}
