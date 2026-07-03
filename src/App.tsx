import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import BooksPage from "./pages/BooksPage";
import BookDetailPage from "./pages/BookDetailPage";
import AuthorsPage from "./pages/AuthorsPage";
import AuthorDetailPage from "./pages/AuthorDetailPage";
import ServicesPage from "./pages/ServicesPage";
import ContactPage from "./pages/ContactPage";
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
          </Route>

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="pages" element={<PageEditor />} />
            <Route path="books" element={<BooksManagement />} />
            <Route path="authors" element={<AuthorsManagement />} />
            <Route path="services" element={<ServicesManagement />} />
            <Route path="testimonials" element={<TestimonialsManagement />} />
            <Route path="team" element={<TeamManagement />} />
            <Route path="content" element={<ContentManagement />} />
            <Route path="media" element={<MediaManager />} />
            <Route path="inquiries" element={<InquiryManagement />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="settings" element={<WebsiteSettings />} />
            <Route path="theme" element={<ThemeSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
