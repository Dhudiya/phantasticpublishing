import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../admin/AuthContext";
import { Card, PageHeader, Spinner } from "../../admin/ui";
import {
  BookOpen, Users, Inbox, Image as ImageIcon, FileText, TrendingUp,
  ArrowUpRight, Plus, Mail, Eye,
} from "lucide-react";

interface Stats {
  books: number;
  authors: number;
  inquiries: number;
  newInquiries: number;
  media: number;
  pages: number;
  pageViews: number;
  pageViews7d: number;
}

interface RecentInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  type: string;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentInquiry[]>([]);
  const [traffic, setTraffic] = useState<{ date: string; views: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [books, authors, inquiries, newInq, media, pages, views, views7d, recentInq, trafficData] = await Promise.all([
        supabase.from("books").select("id", { count: "exact", head: true }),
        supabase.from("authors").select("id", { count: "exact", head: true }),
        supabase.from("inquiries").select("id", { count: "exact", head: true }),
        supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("media").select("id", { count: "exact", head: true }),
        supabase.from("pages").select("id", { count: "exact", head: true }),
        supabase.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", "page_view"),
        supabase.from("analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("event_type", "page_view")
          .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
        supabase.from("inquiries").select("id,name,email,subject,type,status,created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("analytics_events")
          .select("created_at")
          .eq("event_type", "page_view")
          .gte("created_at", new Date(Date.now() - 14 * 86400000).toISOString())
          .order("created_at", { ascending: true })
          .limit(500),
      ]);

      setStats({
        books: books.count ?? 0,
        authors: authors.count ?? 0,
        inquiries: inquiries.count ?? 0,
        newInquiries: newInq.count ?? 0,
        media: media.count ?? 0,
        pages: pages.count ?? 0,
        pageViews: views.count ?? 0,
        pageViews7d: views7d.count ?? 0,
      });
      setRecent((recentInq.data as RecentInquiry[]) ?? []);

      // bucket traffic by day
      const buckets: Record<string, number> = {};
      (trafficData.data as { created_at: string }[] | null)?.forEach((r) => {
        const day = new Date(r.created_at).toISOString().slice(0, 10);
        buckets[day] = (buckets[day] ?? 0) + 1;
      });
      const days: { date: string; views: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        days.push({ date: d, views: buckets[d] ?? 0 });
      }
      setTraffic(days);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <Spinner />;

  const statCards = [
    { label: "Books", value: stats?.books ?? 0, icon: <BookOpen size={20} />, to: "/admin/books", color: "bg-blue-50 text-blue-600" },
    { label: "Authors", value: stats?.authors ?? 0, icon: <Users size={20} />, to: "/admin/authors", color: "bg-purple-50 text-purple-600" },
    { label: "Inquiries", value: stats?.inquiries ?? 0, icon: <Inbox size={20} />, to: "/admin/inquiries", color: "bg-amber-50 text-amber-600", badge: stats?.newInquiries },
    { label: "Media Files", value: stats?.media ?? 0, icon: <ImageIcon size={20} />, to: "/admin/media", color: "bg-green-50 text-green-600" },
    { label: "Pages", value: stats?.pages ?? 0, icon: <FileText size={20} />, to: "/admin/pages", color: "bg-rose-50 text-rose-600" },
    { label: "Page Views (7d)", value: stats?.pageViews7d ?? 0, icon: <TrendingUp size={20} />, to: "/admin/analytics", color: "bg-cyan-50 text-cyan-600" },
  ];

  const maxTraffic = Math.max(...traffic.map((t) => t.views), 1);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${profile?.full_name?.split(" ")[0] ?? "Admin"}`}
        description="Here's what's happening with your site today."
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        {statCards.map((s) => (
          <Link key={s.label} to={s.to}>
            <Card className="p-4 hover:shadow-md transition-shadow h-full">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  {s.icon}
                </div>
                {s.badge ? (
                  <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                    {s.badge} new
                  </span>
                ) : null}
              </div>
              <p className="text-2xl font-bold text-neutral-900">{s.value}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Traffic chart */}
        <Card className="lg:col-span-2 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-lg font-bold text-neutral-900">Traffic — last 14 days</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Page views per day</p>
            </div>
            <Link to="/admin/analytics" className="text-xs font-medium text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1">
              Full report <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="flex items-end gap-1 h-40">
            {traffic.map((t) => (
              <div key={t.date} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full bg-neutral-100 rounded-t-md relative overflow-hidden" style={{ height: "100%" }}>
                  <div
                    className="absolute bottom-0 w-full bg-neutral-900 rounded-t-md transition-all duration-500 group-hover:bg-neutral-700"
                    style={{ height: `${(t.views / maxTraffic) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] text-neutral-400">{new Date(t.date).getDate()}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent inquiries */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg font-bold text-neutral-900">Recent inquiries</h3>
            <Link to="/admin/inquiries" className="text-xs font-medium text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1">
              All <ArrowUpRight size={12} />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-neutral-400 py-8 text-center">No inquiries yet.</p>
          ) : (
            <div className="space-y-3">
              {recent.map((inq) => (
                <Link
                  key={inq.id}
                  to="/admin/inquiries"
                  className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-medium text-neutral-600 shrink-0">
                    {inq.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 truncate">{inq.name}</p>
                    <p className="text-xs text-neutral-500 truncate">{inq.subject || inq.email}</p>
                  </div>
                  {inq.status === "new" && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <div className="mt-6">
        <h3 className="font-serif text-lg font-bold text-neutral-900 mb-4">Quick actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <QuickAction to="/admin/pages" icon={<Plus size={18} />} label="Edit site pages" />
          <QuickAction to="/admin/books" icon={<BookOpen size={18} />} label="Add a book" />
          <QuickAction to="/admin/inquiries" icon={<Mail size={18} />} label="View inquiries" />
          <QuickAction to="/admin/settings" icon={<Eye size={18} />} label="Site settings" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to}>
      <Card className="p-4 flex items-center gap-3 hover:shadow-md hover:border-neutral-300 transition-all">
        <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
          {icon}
        </div>
        <span className="text-sm font-medium text-neutral-900">{label}</span>
      </Card>
    </Link>
  );
}
