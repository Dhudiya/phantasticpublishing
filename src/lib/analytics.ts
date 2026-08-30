import { supabase } from "./supabase";

/*
 * Analytics Tracker — lightweight client-side event collection.
 *
 * Design goals:
 * - No external dependencies, no secrets in the browser.
 * - SPA-safe: tracks route changes without double-counting re-renders.
 * - Deduplicates page views within a short time window per path.
 * - Generates persistent visitor_id (localStorage) and session_id
 *   (sessionStorage, rotates per browser session).
 * - Parses User-Agent client-side for device/browser/OS (best-effort).
 * - Sends events through the `analytics-track` edge function, which
 *   enriches them with IP-based geolocation (country, region, city)
 *   before inserting into the database.
 * - Uses the `sendBeacon` API when available so events are not lost
 *   on page unload; falls back to fetch keepalive.
 * - Never tracks admin routes (paths starting with /admin).
 */

const VISITOR_KEY = "pp_visitor_id";
const SESSION_KEY = "pp_session_id";
const LAST_VIEW_KEY = "pp_last_view";
const DEDUP_WINDOW_MS = 5000;

let initialized = false;
let currentPath = "";

function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

interface ParsedUA {
  device_type: string;
  browser: string;
  os: string;
}

function parseUserAgent(ua: string): ParsedUA {
  const lower = ua.toLowerCase();
  let device_type = "desktop";
  if (/mobile|android.*mobile|iphone|ipod/.test(lower)) device_type = "mobile";
  else if (/ipad|android(?!.*mobile)|tablet/.test(lower)) device_type = "tablet";

  let browser = "other";
  if (/edg\//.test(lower)) browser = "edge";
  else if (/opr\/|opera/.test(lower)) browser = "opera";
  else if (/chrome|crios/.test(lower)) browser = "chrome";
  else if (/firefox|fxios/.test(lower)) browser = "firefox";
  else if (/safari/.test(lower)) browser = "safari";

  let os = "other";
  if (/windows/.test(lower)) os = "windows";
  else if (/mac os|macintosh|iphone|ipad|ipod/.test(lower)) os = "ios";
  else if (/android/.test(lower)) os = "android";
  else if (/linux/.test(lower)) os = "linux";

  return { device_type, browser, os };
}

function shouldTrack(path: string): boolean {
  if (!path) return false;
  if (path.startsWith("/admin")) return false;
  return true;
}

function isDuplicate(path: string): boolean {
  try {
    const key = `${LAST_VIEW_KEY}:${path}`;
    const last = sessionStorage.getItem(key);
    const now = Date.now();
    if (last && now - Number(last) < DEDUP_WINDOW_MS) return true;
    sessionStorage.setItem(key, String(now));
    return false;
  } catch {
    return false;
  }
}

interface TrackOptions {
  event_type?: string;
  path?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
}

function track(opts: TrackOptions): void {
  const path = opts.path ?? window.location.pathname + window.location.search;
  if (!shouldTrack(path.split("?")[0])) return;

  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  const ua = navigator.userAgent || "";
  const { device_type, browser, os } = parseUserAgent(ua);
  const referrer = opts.referrer ?? (document.referrer || null);
  const pageTitle = document.title || "";

  const payload = {
    event_type: opts.event_type ?? "page_view",
    path,
    referrer,
    session_id: sessionId,
    user_agent: ua,
    visitor_id: visitorId,
    device_type,
    browser,
    os,
    page_title: pageTitle,
    session_start: null,
    metadata: opts.metadata ?? {},
  };

  // Send through the analytics-track edge function for IP geo-enrichment.
  // Fire-and-forget; errors are silently ignored to avoid disrupting UX.
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const endpoint = `${supabaseUrl}/functions/v1/analytics-track`;
  const payloadJson = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([payloadJson], { type: "application/json" });
    const ok = navigator.sendBeacon(endpoint, blob);
    if (ok) return;
  }

  fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
    },
    body: payloadJson,
    keepalive: true,
  }).then(() => {}, () => {});
}

export function trackPageView(path?: string): void {
  const p = path ?? window.location.pathname + window.location.search;
  const cleanPath = p.split("?")[0];
  if (!shouldTrack(cleanPath)) return;
  if (isDuplicate(cleanPath)) return;
  track({ event_type: "page_view", path: p });
}

export function trackEvent(
  event_type: string,
  metadata?: Record<string, unknown>
): void {
  const path = window.location.pathname + window.location.search;
  if (!shouldTrack(path.split("?")[0])) return;
  track({ event_type, path, metadata });
}

export function trackClick(
  label: string,
  target?: string
): void {
  track({
    event_type: "click",
    metadata: { label, target: target ?? "" },
  });
}

export function trackSearch(query: string, resultsCount?: number): void {
  track({
    event_type: "search",
    metadata: { query, results_count: resultsCount ?? 0 },
  });
}

/*
 * Initialize the SPA route tracker. Call once at app startup.
 * Uses a popstate listener + a history hook to catch pushState/replaceState.
 */
export function initAnalyticsTracker(): void {
  if (initialized) return;
  initialized = true;

  currentPath = window.location.pathname;

  // Track initial page load
  trackPageView();

  // Hook into History API to catch SPA navigations
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args: Parameters<typeof history.pushState>) {
    const result = originalPushState.apply(history, args);
    handleRouteChange();
    return result;
  };

  history.replaceState = function (...args: Parameters<typeof history.replaceState>) {
    const result = originalReplaceState.apply(history, args);
    handleRouteChange();
    return result;
  };

  window.addEventListener("popstate", handleRouteChange);
}

function handleRouteChange(): void {
  // Defer to let React update the DOM (and document.title)
  setTimeout(() => {
    const newPath = window.location.pathname;
    if (newPath !== currentPath) {
      currentPath = newPath;
      trackPageView();
    }
  }, 100);
}
