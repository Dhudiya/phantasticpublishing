import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Card, PageHeader, Spinner, Button, Badge } from "../../admin/ui";
import { runFullAudit, type AuditResult, type SeoIssue } from "../../lib/seoAnalyzer";
import {
  Search, AlertCircle, AlertTriangle, Info, CheckCircle,
  RefreshCw, Bug, FileText, TrendingUp, Clock, Activity,
} from "lucide-react";

interface AuditRow {
  id: string;
  audit_date: string;
  overall_score: number;
  pages_crawled: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  passed_count: number;
}

interface IssueRow {
  id: string;
  audit_id: string | null;
  severity: "critical" | "high" | "medium" | "low";
  issue_type: string;
  page_url: string;
  title: string;
  description: string;
  recommendation: string;
  status: "open" | "fixed" | "ignored";
  fix_notes: string | null;
}

type Tab = "overview" | "issues" | "pages" | "sitemap" | "crawl" | "history";

export default function SeoBotPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);
  const [lastResult, setLastResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    const [auditsResp, issuesResp] = await Promise.all([
      supabase.from("seo_audits").select("*").order("audit_date", { ascending: false }).limit(20),
      supabase.from("seo_issues").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setAudits((auditsResp.data as AuditRow[]) ?? []);
    setIssues((issuesResp.data as IssueRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCrawl = async () => {
    setCrawling(true);
    setError(null);
    try {
      const result = await runFullAudit();
      setLastResult(result);
      await loadData();
    } catch (e) {
      setError(`Crawl failed: ${(e as Error).message}`);
    }
    setCrawling(false);
  };

  const handleFixIssue = async (id: string) => {
    await supabase
      .from("seo_issues")
      .update({ status: "fixed", fix_date: new Date().toISOString() })
      .eq("id", id);
    loadData();
  };

  const handleIgnoreIssue = async (id: string) => {
    await supabase
      .from("seo_issues")
      .update({ status: "ignored" })
      .eq("id", id);
    loadData();
  };

  if (loading) return <Spinner />;

  const latestAudit = audits[0];
  const openIssues = issues.filter((i) => i.status === "open");
  const filteredIssues = filterSeverity === "all" ? openIssues : openIssues.filter((i) => i.severity === filterSeverity);

  const severityIcon = (s: string) => {
    if (s === "critical") return <AlertCircle size={16} className="text-red-600" />;
    if (s === "high") return <AlertTriangle size={16} className="text-orange-600" />;
    if (s === "medium") return <Info size={16} className="text-amber-600" />;
    return <Info size={16} className="text-blue-600" />;
  };

  const severityBadge = (s: string) => {
    const colors = { critical: "red", high: "amber", medium: "amber", low: "blue" } as const;
    return <Badge color={colors[s as keyof typeof colors] ?? "neutral"}>{s}</Badge>;
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: <TrendingUp size={14} /> },
    { id: "issues", label: "Issues", icon: <Bug size={14} /> },
    { id: "pages", label: "Pages", icon: <FileText size={14} /> },
    { id: "sitemap", label: "Sitemap", icon: <Search size={14} /> },
    { id: "crawl", label: "Crawl", icon: <RefreshCw size={14} /> },
    { id: "history", label: "Audit History", icon: <Clock size={14} /> },
  ] as const;

  return (
    <div>
      <PageHeader
        title="SEO Bot"
        description="Automatic crawler that analyzes your entire website for SEO health."
        action={
          <Button onClick={handleCrawl} disabled={crawling}>
            {crawling ? (
              <><RefreshCw size={16} className="animate-spin" /> Crawling...</>
            ) : (
              <><RefreshCw size={16} /> Run Crawl</>
            )}
          </Button>
        }
      />

      {error && (
        <Card className="p-4 mb-4 border border-red-200">
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle size={16} /> {error}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              tab === t.id ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4 sm:space-y-6">
          {/* Score + stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="p-5">
              <p className="text-xs text-neutral-500 mb-2">SEO Score</p>
              <p className={`text-3xl font-bold ${scoreColor(latestAudit?.overall_score ?? 0)}`}>
                {latestAudit?.overall_score ?? "—"}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs text-neutral-500 mb-2">Pages Crawled</p>
              <p className="text-3xl font-bold text-neutral-900">{latestAudit?.pages_crawled ?? 0}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs text-neutral-500 mb-2">Open Issues</p>
              <p className="text-3xl font-bold text-red-600">{openIssues.length}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs text-neutral-500 mb-2">Last Audit</p>
              <p className="text-sm font-medium text-neutral-900">
                {latestAudit ? new Date(latestAudit.audit_date).toLocaleDateString() : "Never"}
              </p>
            </Card>
          </div>

          {/* Issue breakdown */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: "Critical", count: openIssues.filter((i) => i.severity === "critical").length, color: "bg-red-50 text-red-600", icon: <AlertCircle size={16} /> },
              { label: "High", count: openIssues.filter((i) => i.severity === "high").length, color: "bg-orange-50 text-orange-600", icon: <AlertTriangle size={16} /> },
              { label: "Medium", count: openIssues.filter((i) => i.severity === "medium").length, color: "bg-amber-50 text-amber-600", icon: <Info size={16} /> },
              { label: "Low", count: openIssues.filter((i) => i.severity === "low").length, color: "bg-blue-50 text-blue-600", icon: <Info size={16} /> },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>{s.icon}</div>
                <p className="text-xl font-bold text-neutral-900">{s.count}</p>
                <p className="text-xs text-neutral-500">{s.label}</p>
              </Card>
            ))}
          </div>

          {/* Recent issues */}
          <Card className="p-5 sm:p-6">
            <h3 className="font-serif text-lg font-bold text-neutral-900 mb-4">Recent Issues</h3>
            {openIssues.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle size={32} className="mx-auto text-green-500 mb-2" />
                <p className="text-sm text-neutral-500">No open issues. Run a crawl to check for problems.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {openIssues.slice(0, 8).map((issue) => (
                  <div key={issue.id} className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50">
                    {severityIcon(issue.severity)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{issue.title}</p>
                      <p className="text-xs text-neutral-500 truncate">{issue.page_url}</p>
                    </div>
                    {severityBadge(issue.severity)}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "issues" && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {["all", "critical", "high", "medium", "low"].map((f) => (
              <button
                key={f}
                onClick={() => setFilterSeverity(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                  filterSeverity === f ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {filteredIssues.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle size={32} className="mx-auto text-green-500 mb-2" />
              <p className="text-sm text-neutral-500">No {filterSeverity !== "all" ? filterSeverity : ""} issues found.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredIssues.map((issue) => (
                <Card key={issue.id} className="p-4">
                  <div className="flex items-start gap-3">
                    {severityIcon(issue.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-neutral-900">{issue.title}</p>
                        {severityBadge(issue.severity)}
                      </div>
                      <p className="text-xs text-neutral-500 mb-1">{issue.page_url}</p>
                      <p className="text-xs text-neutral-600 mb-2">{issue.description}</p>
                      <p className="text-xs text-neutral-500"><span className="font-medium">Fix:</span> {issue.recommendation}</p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="secondary" onClick={() => handleFixIssue(issue.id)}>
                          <CheckCircle size={14} /> Mark Fixed
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleIgnoreIssue(issue.id)}>
                          Ignore
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "pages" && (
        <Card className="p-5 sm:p-6">
          <h3 className="font-serif text-lg font-bold text-neutral-900 mb-4">Crawled Pages</h3>
          {lastResult ? (
            <div className="space-y-2">
              {lastResult.pageAnalyses.map((p) => {
                const pageScore = p.issues.length === 0 ? 100 : Math.max(0, 100 - p.issues.reduce((s, i) => s + ({ critical: 15, high: 8, medium: 4, low: 1 }[i.severity]), 0));
                return (
                  <div key={p.url} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${scoreColor(pageScore)}`}>
                      {pageScore}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{new URL(p.url).pathname}</p>
                      <p className="text-xs text-neutral-500">{p.wordCount} words · {p.h1Count} H1 · {p.jsonLdScripts} schema · {p.imagesWithoutAlt} img missing alt</p>
                    </div>
                    <span className="text-xs text-neutral-400">{p.statusCode}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-neutral-400 py-8 text-center">Run a crawl to see page-by-page analysis.</p>
          )}
        </Card>
      )}

      {tab === "sitemap" && (
        <div className="space-y-4">
          <Card className="p-5 sm:p-6">
            <h3 className="font-serif text-lg font-bold text-neutral-900 mb-2">Sitemap.xml</h3>
            <p className="text-sm text-neutral-500 mb-4">
              Your dynamic sitemap is served by an edge function at <code className="text-xs bg-neutral-100 px-1.5 py-0.5 rounded">/sitemap.xml</code>.
              It automatically includes all static pages, books, and authors.
            </p>
            <div className="bg-neutral-900 text-neutral-300 p-4 rounded-lg text-xs font-mono overflow-x-auto">
              <p>{`<?xml version="1.0" encoding="UTF-8"?>`}</p>
              <p>{`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`}</p>
              <p>{`  <url><loc>/</loc><priority>1.0</priority></url>`}</p>
              <p>{`  <url><loc>/books</loc><priority>0.9</priority></url>`}</p>
              <p>{`  <url><loc>/authors</loc><priority>0.9</priority></url>`}</p>
              <p>{`  ... (all books and authors)</p>`}</p>
              <p>{`</urlset>`}</p>
            </div>
          </Card>
          <Card className="p-5 sm:p-6">
            <h3 className="font-serif text-lg font-bold text-neutral-900 mb-2">Robots.txt</h3>
            <p className="text-sm text-neutral-500 mb-4">
              Your robots.txt is served by an edge function at <code className="text-xs bg-neutral-100 px-1.5 py-0.5 rounded">/robots.txt</code>.
              It allows all crawlers access to public pages and blocks <code>/admin</code>.
            </p>
            <div className="bg-neutral-900 text-neutral-300 p-4 rounded-lg text-xs font-mono">
              <p>User-agent: *</p>
              <p>Allow: /</p>
              <p>Disallow: /admin</p>
              <p className="mt-2">Sitemap: /sitemap.xml</p>
            </div>
          </Card>
        </div>
      )}

      {tab === "crawl" && (
        <Card className="p-5 sm:p-6">
          <h3 className="font-serif text-lg font-bold text-neutral-900 mb-4">Crawl Control</h3>
          <p className="text-sm text-neutral-500 mb-4">
            The SEO Bot crawls all known public pages (static pages + all books + all authors), fetches their HTML,
            and checks for SEO issues including: missing titles, meta descriptions, canonical URLs, H1 structure,
            Open Graph, Twitter Cards, structured data, image ALTs, broken links, orphan pages, thin content, and more.
          </p>
          <p className="text-sm text-neutral-500 mb-4">
            Results are saved to the database. The crawl runs with a 200ms delay between requests to avoid
            overwhelming the server. Only public pages are crawled — admin pages are excluded.
          </p>
          <Button onClick={handleCrawl} disabled={crawling}>
            {crawling ? <><RefreshCw size={16} className="animate-spin" /> Crawling in progress...</> : <><Activity size={16} /> Start New Crawl</>}
          </Button>
          {lastResult && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">
                Crawl complete: {lastResult.pagesCrawled} pages analyzed, {lastResult.issues.length} issues found, score: {lastResult.score}/100
              </p>
            </div>
          )}
        </Card>
      )}

      {tab === "history" && (
        <Card className="p-5 sm:p-6">
          <h3 className="font-serif text-lg font-bold text-neutral-900 mb-4">Audit History</h3>
          {audits.length === 0 ? (
            <p className="text-sm text-neutral-400 py-8 text-center">No audits have been run yet.</p>
          ) : (
            <div className="space-y-2">
              {audits.map((a) => (
                <div key={a.id} className="flex items-center gap-4 p-3 rounded-lg bg-neutral-50">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${scoreColor(a.overall_score)}`}>
                    {a.overall_score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900">{new Date(a.audit_date).toLocaleString()}</p>
                    <p className="text-xs text-neutral-500">{a.pages_crawled} pages · {a.critical_count} critical · {a.high_count} high · {a.medium_count} medium · {a.low_count} low</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
