import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Card, PageHeader, Spinner, Select } from "../../admin/ui";
import {
  TrendingUp, Eye, MousePointerClick, Users, Globe, Smartphone,
  Monitor, Tablet, Search, Clock, Activity, MapPin,
} from "lucide-react";

interface EventRow {
  event_type: string;
  path: string;
  referrer: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
  visitor_id: string | null;
  session_id: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  page_title: string | null;
}

type DateRange = "today" | "yesterday" | "7" | "30" | "90" | "custom";

export default function AnalyticsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>("30");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "traffic" | "pages" | "sources" | "devices" | "geography">("overview");

  const getStartDate = useCallback((): string => {
    const now = new Date();
    switch (range) {
      case "today":
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      case "yesterday": {
        const y = new Date(now.getTime() - 86400000);
        return new Date(y.getFullYear(), y.getMonth(), y.getDate()).toISOString();
      }
      case "7":
        return new Date(now.getTime() - 7 * 86400000).toISOString();
      case "30":
        return new Date(now.getTime() - 30 * 86400000).toISOString();
      case "90":
        return new Date(now.getTime() - 90 * 86400000).toISOString();
      case "custom":
        return customStart ? new Date(customStart).toISOString() : new Date(now.getTime() - 30 * 86400000).toISOString();
      default:
        return new Date(now.getTime() - 30 * 86400000).toISOString();
    }
  }, [range, customStart]);

  const getEndDate = useCallback((): string | null => {
    if (range === "custom" && customEnd) {
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      return end.toISOString();
    }
    if (range === "yesterday") {
      const y = new Date(Date.now() - 86400000);
      y.setHours(23, 59, 59, 999);
      return y.toISOString();
    }
    return null;
  }, [range, customEnd]);

  const load = useCallback(async () => {
    setLoading(true);
    const since = getStartDate();
    const until = getEndDate();
    let query = supabase
      .from("analytics_events")
      .select("event_type, path, referrer, created_at, metadata, visitor_id, session_id, device_type, browser, os, country, region, city, page_title")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(10000);
    if (until) query = query.lte("created_at", until);
    const { data } = await query;
    setEvents((data as EventRow[]) ?? []);
    setLoading(false);
  }, [getStartDate, getEndDate]);

  useEffect(() => {
    if (range === "custom" && (!customStart || !customEnd)) {
      setLoading(false);
      return;
    }
    load();
  }, [load, range, customStart, customEnd]);

  if (loading) return <Spinner />;

  const pageViews = events.filter((e) => e.event_type === "page_view");
  const clicks = events.filter((e) => e.event_type === "click");
  const searches = events.filter((e) => e.event_type === "search");
  const uniqueVisitors = new Set(pageViews.map((e) => e.visitor_id).filter(Boolean)).size;
  const uniqueSessions = new Set(pageViews.map((e) => e.session_id).filter(Boolean)).size;
  const uniquePaths = new Set(pageViews.map((e) => e.path)).size;

  // ─── Bucket by day ──────────────────────────────────────────────
  const buckets: Record<string, number> = {};
  pageViews.forEach((e) => {
    const day = new Date(e.created_at).toISOString().slice(0, 10);
    buckets[day] = (buckets[day] ?? 0) + 1;
  });
  const numDays = range === "today" ? 1 : range === "yesterday" ? 1 : range === "7" ? 7 : range === "30" ? 30 : range === "90" ? 90 : 30;
  const days: { date: string; views: number }[] = [];
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    days.push({ date: d, views: buckets[d] ?? 0 });
  }
  const maxViews = Math.max(...days.map((d) => d.views), 1);

  // ─── Top pages ──────────────────────────────────────────────────
  const pathCounts: Record<string, number> = {};
  pageViews.forEach((e) => {
    const cleanPath = e.path.split("?")[0];
    pathCounts[cleanPath] = (pathCounts[cleanPath] ?? 0) + 1;
  });
  const topPages = Object.entries(pathCounts).sort((a, b) => b[1] - a[1]).slice(0, 12);

  // ─── Landing pages (first page_view per session) ────────────────
  const sessionFirstViews = new Map<string, EventRow>();
  [...pageViews].reverse().forEach((e) => {
    if (e.session_id && !sessionFirstViews.has(e.session_id)) {
      sessionFirstViews.set(e.session_id, e);
    }
  });
  const landingCounts: Record<string, number> = {};
  sessionFirstViews.forEach((e) => {
    const cleanPath = e.path.split("?")[0];
    landingCounts[cleanPath] = (landingCounts[cleanPath] ?? 0) + 1;
  });
  const topLanding = Object.entries(landingCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // ─── Traffic sources ────────────────────────────────────────────
  const refCounts: Record<string, number> = {};
  pageViews.forEach((e) => {
    const ref = e.referrer || "";
    let source: string;
    if (!ref) source = "(direct)";
    else {
      try {
        const u = new URL(ref);
        source = u.hostname.replace("www.", "");
      } catch {
        source = ref;
      }
    }
    refCounts[source] = (refCounts[source] ?? 0) + 1;
  });
  const topReferrers = Object.entries(refCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const searchTraffic = searches.length;

  // ─── Devices ────────────────────────────────────────────────────
  const deviceCounts: Record<string, number> = {};
  pageViews.forEach((e) => {
    const d = e.device_type || "unknown";
    deviceCounts[d] = (deviceCounts[d] ?? 0) + 1;
  });
  const deviceData = Object.entries(deviceCounts).sort((a, b) => b[1] - a[1]);

  const browserCounts: Record<string, number> = {};
  pageViews.forEach((e) => {
    const b = e.browser || "unknown";
    browserCounts[b] = (browserCounts[b] ?? 0) + 1;
  });
  const browserData = Object.entries(browserCounts).sort((a, b) => b[1] - a[1]);

  const osCounts: Record<string, number> = {};
  pageViews.forEach((e) => {
    const o = e.os || "unknown";
    osCounts[o] = (osCounts[o] ?? 0) + 1;
  });
  const osData = Object.entries(osCounts).sort((a, b) => b[1] - a[1]);

  // ─── Geography ──────────────────────────────────────────────────
  const countryCounts: Record<string, number> = {};
  pageViews.forEach((e) => {
    const c = e.country || "unknown";
    countryCounts[c] = (countryCounts[c] ?? 0) + 1;
  });
  const countryData = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 12);

  const cityCounts: Record<string, number> = {};
  pageViews.forEach((e) => {
    const c = e.city || e.region || "unknown";
    if (c !== "unknown") cityCounts[c] = (cityCounts[c] ?? 0) + 1;
  });
  const cityData = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 12);

  // ─── New vs returning ───────────────────────────────────────────
  const visitorFirstSeen = new Map<string, string>();
  pageViews.forEach((e) => {
    if (e.visitor_id) {
      const existing = visitorFirstSeen.get(e.visitor_id);
      if (!existing || e.created_at < existing) {
        visitorFirstSeen.set(e.visitor_id, e.created_at);
      }
    }
  });
  const sinceDate = getStartDate();
  let newVisitors = 0;
  let returningVisitors = 0;
  visitorFirstSeen.forEach((firstSeen) => {
    if (firstSeen >= sinceDate) newVisitors++;
    else returningVisitors++;
  });

  // ─── Real-time (last 5 minutes) ─────────────────────────────────
  const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
  const realtimeVisitors = new Set(
    events.filter((e) => e.created_at >= fiveMinAgo && e.visitor_id).map((e) => e.visitor_id!)
  ).size;

  // ─── Stats cards ────────────────────────────────────────────────
  const stats = [
    { label: "Total page views", value: pageViews.length, icon: <Eye size={18} />, color: "bg-blue-50 text-blue-600" },
    { label: "Unique visitors", value: uniqueVisitors, icon: <Users size={18} />, color: "bg-purple-50 text-purple-600" },
    { label: "Sessions", value: uniqueSessions, icon: <Activity size={18} />, color: "bg-green-50 text-green-600" },
    { label: "Real-time (5min)", value: realtimeVisitors, icon: <Clock size={18} />, color: "bg-amber-50 text-amber-600" },
  ];

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "traffic", label: "Traffic" },
    { id: "pages", label: "Pages" },
    { id: "sources", label: "Sources" },
    { id: "devices", label: "Devices" },
    { id: "geography", label: "Geography" },
  ] as const;

  const deviceIcon = (d: string) => {
    if (d === "mobile") return <Smartphone size={16} />;
    if (d === "tablet") return <Tablet size={16} />;
    return <Monitor size={16} />;
  };

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Real visitor traffic, engagement, and content reports."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {range === "custom" && (
              <>
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="px-2 py-2 text-xs border border-neutral-200 rounded-lg" />
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="px-2 py-2 text-xs border border-neutral-200 rounded-lg" />
              </>
            )}
            <Select
              value={range}
              onChange={(v) => setRange(v as DateRange)}
              className="w-36"
              options={[
                { value: "today", label: "Today" },
                { value: "yesterday", label: "Yesterday" },
                { value: "7", label: "Last 7 days" },
                { value: "30", label: "Last 30 days" },
                { value: "90", label: "Last 90 days" },
                { value: "custom", label: "Custom range" },
              ]}
            />
          </div>
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

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-neutral-900 text-white"
                : "text-neutral-500 hover:bg-neutral-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {pageViews.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-neutral-400 mb-2">No analytics data yet for this period.</p>
          <p className="text-xs text-neutral-400">
            Analytics tracking is active. As visitors browse your public pages, page views, device info, and traffic sources will appear here automatically.
          </p>
        </Card>
      )}

      {pageViews.length > 0 && (
        <>
          {activeTab === "overview" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Traffic chart */}
                <Card className="lg:col-span-2 p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp size={18} className="text-neutral-400" />
                    <h3 className="font-serif text-lg font-bold text-neutral-900">Page views over time</h3>
                  </div>
                  {days.every((d) => d.views === 0) ? (
                    <div className="h-48 flex items-center justify-center text-sm text-neutral-400">No traffic in this period.</div>
                  ) : (
                    <div className="flex items-end gap-1 h-48">
                      {days.map((d) => (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                          <div className="w-full bg-neutral-100 rounded-t-md relative overflow-hidden h-full">
                            <div className="absolute bottom-0 w-full bg-neutral-900 rounded-t-md transition-all duration-500 group-hover:bg-neutral-700" style={{ height: `${(d.views / maxViews) * 100}%` }} />
                          </div>
                          {numDays <= 31 && <span className="text-[9px] text-neutral-400">{new Date(d.date).getDate()}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* New vs returning */}
                <Card className="p-5 sm:p-6">
                  <h3 className="font-serif text-lg font-bold text-neutral-900 mb-4">New vs Returning</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-neutral-600">New visitors</span>
                        <span className="font-medium text-neutral-900">{newVisitors}</span>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${(newVisitors / Math.max(newVisitors + returningVisitors, 1)) * 100}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-neutral-600">Returning</span>
                        <span className="font-medium text-neutral-900">{returningVisitors}</span>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(returningVisitors / Math.max(newVisitors + returningVisitors, 1)) * 100}%` }} />
                      </div>
                    </div>
                    <div className="pt-2 border-t border-neutral-100">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Click events</span>
                        <span className="font-medium text-neutral-900">{clicks.length}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-neutral-600">Search events</span>
                        <span className="font-medium text-neutral-900">{searchTraffic}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-neutral-600">Unique pages</span>
                        <span className="font-medium text-neutral-900">{uniquePaths}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Top pages + top referrers */}
              <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
                <Card className="p-5 sm:p-6">
                  <h3 className="font-serif text-lg font-bold text-neutral-900 mb-4">Top pages</h3>
                  <div className="space-y-2">
                    {topPages.slice(0, 6).map(([path, count]) => (
                      <div key={path} className="flex items-center gap-3">
                        <span className="text-sm text-neutral-700 truncate flex-1">{path || "/"}</span>
                        <span className="text-xs font-medium text-neutral-500">{count}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card className="p-5 sm:p-6">
                  <h3 className="font-serif text-lg font-bold text-neutral-900 mb-4">Top sources</h3>
                  <div className="space-y-2">
                    {topReferrers.slice(0, 6).map(([ref, count]) => (
                      <div key={ref} className="flex items-center gap-3">
                        <span className="text-sm text-neutral-700 truncate flex-1">{ref}</span>
                        <span className="text-xs font-medium text-neutral-500">{count}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "traffic" && (
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={18} className="text-neutral-400" />
                <h3 className="font-serif text-lg font-bold text-neutral-900">Daily traffic trend</h3>
              </div>
              <div className="flex items-end gap-1 h-56">
                {days.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full bg-neutral-100 rounded-t-md relative overflow-hidden h-full">
                      <div className="absolute bottom-0 w-full bg-neutral-900 rounded-t-md transition-all duration-500 group-hover:bg-neutral-700" style={{ height: `${(d.views / maxViews) * 100}%` }} />
                    </div>
                    {numDays <= 31 && <span className="text-[9px] text-neutral-400">{new Date(d.date).getDate()}</span>}
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-neutral-100">
                <div><p className="text-xs text-neutral-400">Avg / day</p><p className="text-lg font-bold">{Math.round(pageViews.length / Math.max(numDays, 1))}</p></div>
                <div><p className="text-xs text-neutral-400">Peak day</p><p className="text-lg font-bold">{maxViews}</p></div>
                <div><p className="text-xs text-neutral-400">Total</p><p className="text-lg font-bold">{pageViews.length}</p></div>
              </div>
            </Card>
          )}

          {activeTab === "pages" && (
            <div className="space-y-4 sm:space-y-6">
              <Card className="p-5 sm:p-6">
                <h3 className="font-serif text-lg font-bold text-neutral-900 mb-4">Top pages</h3>
                <div className="space-y-2">
                  {topPages.map(([path, count]) => {
                    const pct = (count / pageViews.length) * 100;
                    return (
                      <div key={path} className="flex items-center gap-4">
                        <span className="text-sm text-neutral-700 w-48 truncate shrink-0">{path || "/"}</span>
                        <div className="flex-1 h-6 bg-neutral-50 rounded-md overflow-hidden">
                          <div className="h-full bg-neutral-900 rounded-md transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-medium text-neutral-500 w-12 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
              <Card className="p-5 sm:p-6">
                <h3 className="font-serif text-lg font-bold text-neutral-900 mb-4">Top landing pages</h3>
                <div className="space-y-2">
                  {topLanding.map(([path, count]) => (
                    <div key={path} className="flex items-center justify-between">
                      <span className="text-sm text-neutral-700 truncate flex-1 mr-2">{path || "/"}</span>
                      <span className="text-xs font-medium text-neutral-500">{count} sessions</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === "sources" && (
            <div className="space-y-4 sm:space-y-6">
              <Card className="p-5 sm:p-6">
                <h3 className="font-serif text-lg font-bold text-neutral-900 mb-4">Traffic sources</h3>
                <div className="space-y-2">
                  {topReferrers.map(([ref, count]) => {
                    const pct = (count / pageViews.length) * 100;
                    return (
                      <div key={ref} className="flex items-center gap-4">
                        <span className="text-sm text-neutral-700 w-48 truncate shrink-0">{ref}</span>
                        <div className="flex-1 h-6 bg-neutral-50 rounded-md overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-md transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-medium text-neutral-500 w-12 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
              {searches.length > 0 && (
                <Card className="p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Search size={18} className="text-neutral-400" />
                    <h3 className="font-serif text-lg font-bold text-neutral-900">Search events</h3>
                  </div>
                  <div className="space-y-2">
                    {searches.slice(0, 10).map((s, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-neutral-700 truncate flex-1 mr-2">{(s.metadata as Record<string, unknown>)?.query as string || "Unknown"}</span>
                        <span className="text-xs text-neutral-400">{new Date(s.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === "devices" && (
            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
              <Card className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Monitor size={18} className="text-neutral-400" />
                  <h3 className="font-serif text-lg font-bold text-neutral-900">Device type</h3>
                </div>
                <div className="space-y-3">
                  {deviceData.map(([device, count]) => (
                    <div key={device} className="flex items-center justify-between">
                      <span className="text-sm text-neutral-700 flex items-center gap-2 capitalize">{deviceIcon(device)} {device}</span>
                      <span className="text-xs font-medium text-neutral-500">{count}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-5 sm:p-6">
                <h3 className="font-serif text-lg font-bold text-neutral-900 mb-4">Browser</h3>
                <div className="space-y-3">
                  {browserData.map(([browser, count]) => (
                    <div key={browser} className="flex items-center justify-between">
                      <span className="text-sm text-neutral-700 capitalize">{browser}</span>
                      <span className="text-xs font-medium text-neutral-500">{count}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-5 sm:p-6">
                <h3 className="font-serif text-lg font-bold text-neutral-900 mb-4">Operating system</h3>
                <div className="space-y-3">
                  {osData.map(([os, count]) => (
                    <div key={os} className="flex items-center justify-between">
                      <span className="text-sm text-neutral-700 capitalize">{os}</span>
                      <span className="text-xs font-medium text-neutral-500">{count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === "geography" && (
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Globe size={18} className="text-neutral-400" />
                  <h3 className="font-serif text-lg font-bold text-neutral-900">Countries</h3>
                </div>
                <div className="space-y-3">
                  {countryData.map(([country, count]) => (
                    <div key={country} className="flex items-center justify-between">
                      <span className="text-sm text-neutral-700">{country}</span>
                      <span className="text-xs font-medium text-neutral-500">{count}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={18} className="text-neutral-400" />
                  <h3 className="font-serif text-lg font-bold text-neutral-900">Cities / Regions</h3>
                </div>
                <div className="space-y-3">
                  {cityData.length === 0 ? (
                    <p className="text-sm text-neutral-400 py-4 text-center">No city/region data available yet.</p>
                  ) : (
                    cityData.map(([city, count]) => (
                      <div key={city} className="flex items-center justify-between">
                        <span className="text-sm text-neutral-700">{city}</span>
                        <span className="text-xs font-medium text-neutral-500">{count}</span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
