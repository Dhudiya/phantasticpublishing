import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Card, PageHeader, Spinner, Select } from "../../admin/ui";
import { TrendingUp, Eye, MousePointerClick, Users, Globe } from "lucide-react";

interface EventRow {
  event_type: string; path: string; referrer: string | null;
  created_at: string; metadata: Record<string, unknown>;
}

export default function AnalyticsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");

  const load = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - Number(range) * 86400000).toISOString();
    const { data } = await supabase.from("analytics_events")
      .select("event_type, path, referrer, created_at, metadata")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);
    setEvents((data as EventRow[]) ?? []);
    setLoading(false);
  }, [range]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;

  const pageViews = events.filter((e) => e.event_type === "page_view");
  const clicks = events.filter((e) => e.event_type === "click");
  const uniquePaths = new Set(pageViews.map((e) => e.path)).size;
  const uniqueReferrers = new Set(pageViews.map((e) => e.referrer).filter(Boolean)).size;

  // bucket by day
  const buckets: Record<string, number> = {};
  pageViews.forEach((e) => {
    const day = new Date(e.created_at).toISOString().slice(0, 10);
    buckets[day] = (buckets[day] ?? 0) + 1;
  });
  const days: { date: string; views: number }[] = [];
  const numDays = Number(range);
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    days.push({ date: d, views: buckets[d] ?? 0 });
  }
  const maxViews = Math.max(...days.map((d) => d.views), 1);

  // top pages
  const pathCounts: Record<string, number> = {};
  pageViews.forEach((e) => { pathCounts[e.path] = (pathCounts[e.path] ?? 0) + 1; });
  const topPages = Object.entries(pathCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // top referrers
  const refCounts: Record<string, number> = {};
  pageViews.forEach((e) => {
    const r = e.referrer || "(direct)";
    refCounts[r] = (refCounts[r] ?? 0) + 1;
  });
  const topReferrers = Object.entries(refCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const stats = [
    { label: "Page views", value: pageViews.length, icon: <Eye size={18} />, color: "bg-blue-50 text-blue-600" },
    { label: "Unique pages", value: uniquePaths, icon: <Globe size={18} />, color: "bg-purple-50 text-purple-600" },
    { label: "Click events", value: clicks.length, icon: <MousePointerClick size={18} />, color: "bg-amber-50 text-amber-600" },
    { label: "Referrer sources", value: uniqueReferrers, icon: <Users size={18} />, color: "bg-green-50 text-green-600" },
  ];

  return (
    <div>
      <PageHeader
        title="Performance & Analytics"
        description="Traffic, engagement, and content reports."
        action={
          <Select value={range} onChange={setRange} className="w-32"
            options={[
              { value: "7", label: "Last 7 days" },
              { value: "30", label: "Last 30 days" },
              { value: "90", label: "Last 90 days" },
            ]} />
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
            <p className="text-2xl font-bold text-neutral-900">{s.value}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {/* Traffic chart */}
        <Card className="lg:col-span-2 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-neutral-400" />
            <h3 className="font-serif text-lg font-bold text-neutral-900">Page views over time</h3>
          </div>
          {days.every((d) => d.views === 0) ? (
            <div className="h-48 flex items-center justify-center text-sm text-neutral-400">
              No traffic data yet. Events are logged as visitors browse the site.
            </div>
          ) : (
            <div className="flex items-end gap-1 h-48">
              {days.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full bg-neutral-100 rounded-t-md relative overflow-hidden h-full">
                    <div
                      className="absolute bottom-0 w-full bg-neutral-900 rounded-t-md transition-all duration-500 group-hover:bg-neutral-700"
                      style={{ height: `${(d.views / maxViews) * 100}%` }}
                    />
                  </div>
                  {numDays <= 31 && (
                    <span className="text-[9px] text-neutral-400">{new Date(d.date).getDate()}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top referrers */}
        <Card className="p-5 sm:p-6">
          <h3 className="font-serif text-lg font-bold text-neutral-900 mb-4">Top referrers</h3>
          {topReferrers.length === 0 ? (
            <p className="text-sm text-neutral-400 py-8 text-center">No referrer data.</p>
          ) : (
            <div className="space-y-3">
              {topReferrers.map(([ref, count]) => (
                <div key={ref} className="flex items-center justify-between">
                  <span className="text-sm text-neutral-700 truncate flex-1 mr-2">{ref}</span>
                  <span className="text-xs font-medium text-neutral-500">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Top pages */}
      <Card className="p-5 sm:p-6">
        <h3 className="font-serif text-lg font-bold text-neutral-900 mb-4">Top pages</h3>
        {topPages.length === 0 ? (
          <p className="text-sm text-neutral-400 py-8 text-center">No page view data yet.</p>
        ) : (
          <div className="space-y-2">
            {topPages.map(([path, count]) => {
              const pct = (count / pageViews.length) * 100;
              return (
                <div key={path} className="flex items-center gap-4">
                  <span className="text-sm text-neutral-700 w-40 truncate shrink-0">{path || "/"}</span>
                  <div className="flex-1 h-6 bg-neutral-50 rounded-md overflow-hidden">
                    <div className="h-full bg-neutral-900 rounded-md transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-medium text-neutral-500 w-12 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <p className="text-xs text-neutral-400 mt-4">
        Analytics events are logged via the public <code className="text-neutral-500">analytics_events</code> table.
        Connect an external analytics provider in Website Settings for advanced reporting.
      </p>
    </div>
  );
}
