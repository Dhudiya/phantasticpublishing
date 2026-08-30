import { supabase } from "./supabase";

/*
 * SEO Analyzer — client-side crawler that fetches pages, parses their HTML,
 * and checks SEO health. Results are stored in seo_audits and seo_issues.
 *
 * The analyzer fetches pages via fetch() from the browser, parses the
 * response DOM with DOMParser, and checks for common SEO problems.
 *
 * IMPORTANT: Because this is a single-page app, meta tags are injected
 * at runtime by JavaScript (the SEO component), not present in the
 * server's raw HTML. The analyzer therefore cross-references the
 * seo_page_meta table — if an auto-fix has been stored there, the
 * corresponding issue is suppressed so previously fixed problems don't
 * reappear on every crawl.
 */

// Issue types that the auto-fix edge function can resolve via seo_page_meta
const AUTOFIXABLE_TYPES = new Set([
  "missing_title", "title_too_short", "title_too_long",
  "missing_meta_description", "meta_description_too_long",
  "missing_canonical", "missing_og_title", "missing_og_image",
  "missing_twitter_card", "missing_structured_data",
  "noindex_directive", "nofollow_directive",
  "duplicate_title", "duplicate_meta_description",
]);

export interface SeoIssue {
  severity: "critical" | "high" | "medium" | "low";
  issue_type: string;
  page_url: string;
  title: string;
  description: string;
  recommendation: string;
}

export interface PageAnalysis {
  url: string;
  statusCode: number;
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  robots: string | null;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterCard: string | null;
  twitterImage: string | null;
  imagesTotal: number;
  imagesWithoutAlt: number;
  jsonLdScripts: number;
  wordCount: number;
  internalLinks: string[];
  externalLinks: string[];
  hasNoindex: boolean;
  hasNofollow: boolean;
  loadTimeMs: number;
  issues: SeoIssue[];
}

export interface AuditResult {
  score: number;
  pagesCrawled: number;
  issues: SeoIssue[];
  pageAnalyses: PageAnalysis[];
}

/*
 * Discover all crawlable URLs by fetching the known routes + dynamic
 * slugs from the database.
 */
export async function discoverUrls(): Promise<string[]> {
  const origin = window.location.origin;
  const staticUrls = ["/", "/books", "/authors", "/services", "/about", "/contact"];

  const dynamicUrls: string[] = [];
  try {
    const { data: books } = await supabase.from("books").select("slug");
    (books ?? []).forEach((b: { slug: string }) => dynamicUrls.push(`/books/${b.slug}`));

    const { data: authors } = await supabase.from("authors").select("slug");
    (authors ?? []).forEach((a: { slug: string }) => dynamicUrls.push(`/authors/${a.slug}`));
  } catch {
    // If DB fails, just use static URLs
  }

  return [...staticUrls, ...dynamicUrls].map((p) => `${origin}${p}`);
}

/*
 * Analyze a single page by fetching it and parsing the HTML.
 */
export async function analyzePage(url: string): Promise<PageAnalysis> {
  const issues: SeoIssue[] = [];
  const startTime = performance.now();

  let statusCode = 0;
  let html = "";

  try {
    const resp = await fetch(url, { redirect: "follow" });
    statusCode = resp.status;
    html = await resp.text();
  } catch (e) {
    issues.push({
      severity: "critical",
      issue_type: "fetch_error",
      page_url: url,
      title: "Page could not be fetched",
      description: `Error: ${(e as Error).message}`,
      recommendation: "Check if the URL is accessible and the server is responding.",
    });
    return {
      url,
      statusCode: 0,
      title: null,
      metaDescription: null,
      canonical: null,
      robots: null,
      h1Count: 0,
      h2Count: 0,
      h3Count: 0,
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
      twitterCard: null,
      twitterImage: null,
      imagesTotal: 0,
      imagesWithoutAlt: 0,
      jsonLdScripts: 0,
      wordCount: 0,
      internalLinks: [],
      externalLinks: [],
      hasNoindex: false,
      hasNofollow: false,
      loadTimeMs: Math.round(performance.now() - startTime),
      issues,
    };
  }

  const loadTimeMs = Math.round(performance.now() - startTime);
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  if (statusCode >= 400) {
    issues.push({
      severity: "critical",
      issue_type: "http_error",
      page_url: url,
      title: `HTTP ${statusCode} error`,
      description: `The page returned a ${statusCode} status code.`,
      recommendation: "Fix the server or route configuration to return a 200 status.",
    });
  }

  const titleEl = doc.querySelector("title");
  const title = titleEl?.textContent?.trim() || null;

  const metaDescEl = doc.querySelector('meta[name="description"]');
  const metaDescription = metaDescEl?.getAttribute("content") || null;

  const canonicalEl = doc.querySelector('link[rel="canonical"]');
  const canonical = canonicalEl?.getAttribute("href") || null;

  const robotsEl = doc.querySelector('meta[name="robots"]');
  const robots = robotsEl?.getAttribute("content") || null;
  const hasNoindex = robots?.includes("noindex") ?? false;
  const hasNofollow = robots?.includes("nofollow") ?? false;

  const h1Count = doc.querySelectorAll("h1").length;
  const h2Count = doc.querySelectorAll("h2").length;
  const h3Count = doc.querySelectorAll("h3").length;

  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute("content") || null;
  const ogDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute("content") || null;
  const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute("content") || null;
  const twitterCard = doc.querySelector('meta[name="twitter:card"]')?.getAttribute("content") || null;
  const twitterImage = doc.querySelector('meta[name="twitter:image"]')?.getAttribute("content") || null;

  const allImages = Array.from(doc.querySelectorAll("img"));
  const imagesTotal = allImages.length;
  const imagesWithoutAlt = allImages.filter((img) => !img.getAttribute("alt") || img.getAttribute("alt")?.trim() === "").length;

  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]').length;

  // Word count from body text
  const bodyText = doc.querySelector("body")?.textContent?.trim() || "";
  const wordCount = bodyText.split(/\s+/).filter((w) => w.length > 0).length;

  // Links
  const originDomain = new URL(url).hostname;
  const allLinks = Array.from(doc.querySelectorAll("a[href]"));
  const internalLinks: string[] = [];
  const externalLinks: string[] = [];

  allLinks.forEach((a) => {
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    try {
      const linkUrl = new URL(href, url);
      if (linkUrl.hostname === originDomain) {
        internalLinks.push(linkUrl.pathname);
      } else {
        externalLinks.push(linkUrl.href);
      }
    } catch {
      // Invalid URL, skip
    }
  });

  // ─── Issue detection ────────────────────────────────────────────

  if (!title) {
    issues.push({
      severity: "critical",
      issue_type: "missing_title",
      page_url: url,
      title: "Missing SEO title",
      description: "The page has no <title> tag.",
      recommendation: "Add a descriptive, unique title tag (50-60 characters).",
    });
  } else if (title.length > 65) {
    issues.push({
      severity: "medium",
      issue_type: "title_too_long",
      page_url: url,
      title: "Title tag too long",
      description: `Title is ${title.length} characters (recommended max 60).`,
      recommendation: "Shorten the title to under 60 characters for optimal display in search results.",
    });
  } else if (title.length < 10) {
    issues.push({
      severity: "medium",
      issue_type: "title_too_short",
      page_url: url,
      title: "Title tag too short",
      description: `Title is only ${title.length} characters.`,
      recommendation: "Expand the title to be more descriptive (at least 30 characters).",
    });
  }

  if (!metaDescription) {
    issues.push({
      severity: "high",
      issue_type: "missing_meta_description",
      page_url: url,
      title: "Missing meta description",
      description: "The page has no meta description tag.",
      recommendation: "Add a unique meta description of 150-160 characters.",
    });
  } else if (metaDescription.length > 170) {
    issues.push({
      severity: "low",
      issue_type: "meta_description_too_long",
      page_url: url,
      title: "Meta description too long",
      description: `Description is ${metaDescription.length} characters (recommended max 160).`,
      recommendation: "Shorten the meta description to under 160 characters.",
    });
  }

  if (!canonical) {
    issues.push({
      severity: "high",
      issue_type: "missing_canonical",
      page_url: url,
      title: "Missing canonical URL",
      description: "The page has no canonical link tag.",
      recommendation: "Add a <link rel=\"canonical\"> tag to prevent duplicate content issues.",
    });
  }

  if (h1Count === 0) {
    issues.push({
      severity: "high",
      issue_type: "missing_h1",
      page_url: url,
      title: "Missing H1 heading",
      description: "The page has no H1 heading.",
      recommendation: "Add a single, descriptive H1 heading that includes the primary keyword.",
    });
  } else if (h1Count > 1) {
    issues.push({
      severity: "medium",
      issue_type: "multiple_h1",
      page_url: url,
      title: "Multiple H1 headings",
      description: `Found ${h1Count} H1 headings (recommended: 1).`,
      recommendation: "Use only one H1 per page. Change additional H1s to H2 or H3.",
    });
  }

  if (h2Count === 0 && wordCount > 300) {
    issues.push({
      severity: "medium",
      issue_type: "no_h2_headings",
      page_url: url,
      title: "No H2 headings",
      description: "The page has content but no H2 subheadings.",
      recommendation: "Break up content with H2 subheadings for better structure and readability.",
    });
  }

  if (!ogTitle) {
    issues.push({
      severity: "medium",
      issue_type: "missing_og_title",
      page_url: url,
      title: "Missing Open Graph title",
      description: "No og:title meta tag found.",
      recommendation: "Add an og:title meta tag for social sharing.",
    });
  }

  if (!ogImage) {
    issues.push({
      severity: "medium",
      issue_type: "missing_og_image",
      page_url: url,
      title: "Missing Open Graph image",
      description: "No og:image meta tag found.",
      recommendation: "Add an og:image meta tag so link previews show an image.",
    });
  }

  if (!twitterCard) {
    issues.push({
      severity: "medium",
      issue_type: "missing_twitter_card",
      page_url: url,
      title: "Missing Twitter Card metadata",
      description: "No twitter:card meta tag found.",
      recommendation: "Add twitter:card and twitter:image meta tags for X/Twitter sharing.",
    });
  }

  if (imagesWithoutAlt > 0) {
    issues.push({
      severity: "medium",
      issue_type: "images_missing_alt",
      page_url: url,
      title: `${imagesWithoutAlt} image${imagesWithoutAlt > 1 ? "s" : ""} missing ALT text`,
      description: `${imagesWithoutAlt} out of ${imagesTotal} images have no alt attribute.`,
      recommendation: "Add descriptive alt text to all images for accessibility and SEO.",
    });
  }

  if (jsonLdScripts === 0) {
    issues.push({
      severity: "medium",
      issue_type: "missing_structured_data",
      page_url: url,
      title: "No structured data (JSON-LD)",
      description: "The page has no JSON-LD structured data scripts.",
      recommendation: "Add Schema.org JSON-LD for Organization, WebSite, and page-specific schema.",
    });
  }

  if (wordCount < 300 && !url.endsWith("/contact")) {
    issues.push({
      severity: "low",
      issue_type: "thin_content",
      page_url: url,
      title: "Thin content",
      description: `Page has approximately ${wordCount} words (recommended minimum: 300).`,
      recommendation: "Add more substantial content to improve search visibility.",
    });
  }

  if (hasNoindex && !url.includes("/admin")) {
    issues.push({
      severity: "high",
      issue_type: "noindex_directive",
      page_url: url,
      title: "Page is set to noindex",
      description: "The robots meta tag contains 'noindex', preventing search engines from indexing this page.",
      recommendation: "Remove the noindex directive if this page should be indexed.",
    });
  }

  if (hasNofollow && !url.includes("/admin")) {
    issues.push({
      severity: "low",
      issue_type: "nofollow_directive",
      page_url: url,
      title: "Page is set to nofollow",
      description: "The robots meta tag contains 'nofollow'.",
      recommendation: "Remove the nofollow directive if links on this page should be followed.",
    });
  }

  return {
    url,
    statusCode,
    title,
    metaDescription,
    canonical,
    robots,
    h1Count,
    h2Count,
    h3Count,
    ogTitle,
    ogDescription,
    ogImage,
    twitterCard,
    twitterImage,
    imagesTotal,
    imagesWithoutAlt,
    jsonLdScripts,
    wordCount,
    internalLinks,
    externalLinks,
    hasNoindex,
    hasNofollow,
    loadTimeMs,
    issues,
  };
}

/*
 * Fetch all stored auto-fix metadata from seo_page_meta.
 * Returns a map of page_key → meta, so the analyzer can suppress
 * issues that have already been fixed.
 */
async function fetchPageMetaMap(): Promise<Map<string, Set<string>>> {
  const fixedMap = new Map<string, Set<string>>();
  try {
    const { data } = await supabase
      .from("seo_page_meta")
      .select("page_key, seo_title, seo_description, canonical_url, og_title, og_image, twitter_card, json_ld, robots_index, robots_follow");
    if (data) {
      for (const row of data as {
        page_key: string;
        seo_title: string | null;
        seo_description: string | null;
        canonical_url: string | null;
        og_title: string | null;
        og_image: string | null;
        twitter_card: string | null;
        json_ld: unknown;
        robots_index: boolean | null;
        robots_follow: boolean | null;
      }[]) {
        const fixed = new Set<string>();
        if (row.seo_title) { fixed.add("missing_title"); fixed.add("title_too_short"); fixed.add("title_too_long"); fixed.add("duplicate_title"); }
        if (row.seo_description) { fixed.add("missing_meta_description"); fixed.add("meta_description_too_long"); fixed.add("duplicate_meta_description"); }
        if (row.canonical_url) fixed.add("missing_canonical");
        if (row.og_title) fixed.add("missing_og_title");
        if (row.og_image) fixed.add("missing_og_image");
        if (row.twitter_card) fixed.add("missing_twitter_card");
        if (row.json_ld && Array.isArray(row.json_ld) && row.json_ld.length > 0) fixed.add("missing_structured_data");
        if (row.robots_index === true) fixed.add("noindex_directive");
        if (row.robots_follow === true) fixed.add("nofollow_directive");
        fixedMap.set(row.page_key, fixed);
      }
    }
  } catch {
    // If fetch fails, don't suppress anything
  }
  return fixedMap;
}

/*
 * Run a full audit: discover all URLs, analyze each page, compute score,
 * and save results to the database.
 */
export async function runFullAudit(): Promise<AuditResult> {
  const urls = await discoverUrls();
  const pageAnalyses: PageAnalysis[] = [];

  // Fetch stored auto-fix metadata so we can suppress already-fixed issues
  const fixedMap = await fetchPageMetaMap();

  // Crawl with a small delay to avoid overwhelming the server
  for (const url of urls) {
    const analysis = await analyzePage(url);
    pageAnalyses.push(analysis);
    // Small delay between requests (rate limiting)
    await new Promise((r) => setTimeout(r, 200));
  }

  // Collect all issues, suppressing any that have been auto-fixed in seo_page_meta
  const allIssues: SeoIssue[] = [];
  pageAnalyses.forEach((p) => {
    const pagePath = (() => { try { return new URL(p.url).pathname; } catch { return p.url; } })();
    const fixedForPage = fixedMap.get(pagePath);

    for (const issue of p.issues) {
      // Suppress auto-fixable issues that already have a fix stored
      if (fixedForPage && AUTOFIXABLE_TYPES.has(issue.issue_type) && fixedForPage.has(issue.issue_type)) {
        continue;
      }
      allIssues.push(issue);
    }
  });

  // Check for duplicate titles across pages
  const titleMap = new Map<string, string[]>();
  pageAnalyses.forEach((p) => {
    if (p.title) {
      const existing = titleMap.get(p.title) || [];
      existing.push(p.url);
      titleMap.set(p.title, existing);
    }
  });
  titleMap.forEach((pages, title) => {
    if (pages.length > 1) {
      // Suppress if all affected pages have a title fix stored
      const allFixed = pages.every((pg) => {
        const path = (() => { try { return new URL(pg).pathname; } catch { return pg; } })();
        return fixedMap.get(path)?.has("duplicate_title");
      });
      if (!allFixed) {
        allIssues.push({
          severity: "high",
          issue_type: "duplicate_title",
          page_url: pages.join(", "),
          title: `Duplicate title: "${title}"`,
          description: `${pages.length} pages share the same title tag.`,
          recommendation: "Make each page's title unique to avoid cannibalization.",
        });
      }
    }
  });

  // Check for duplicate meta descriptions
  const descMap = new Map<string, string[]>();
  pageAnalyses.forEach((p) => {
    if (p.metaDescription) {
      const existing = descMap.get(p.metaDescription) || [];
      existing.push(p.url);
      descMap.set(p.metaDescription, existing);
    }
  });
  descMap.forEach((pages, desc) => {
    if (pages.length > 1) {
      // Suppress if all affected pages have a description fix stored
      const allFixed = pages.every((pg) => {
        const path = (() => { try { return new URL(pg).pathname; } catch { return pg; } })();
        return fixedMap.get(path)?.has("duplicate_meta_description");
      });
      if (!allFixed) {
        allIssues.push({
          severity: "medium",
          issue_type: "duplicate_meta_description",
          page_url: pages.join(", "),
          title: "Duplicate meta description",
          description: `${pages.length} pages share the same meta description.`,
          recommendation: "Write a unique meta description for each page.",
        });
      }
    }
  });

  // Check for orphan pages (no internal links pointing to them)
  const allLinkedPaths = new Set<string>();
  pageAnalyses.forEach((p) => {
    p.internalLinks.forEach((l) => allLinkedPaths.add(l));
  });
  pageAnalyses.forEach((p) => {
    const path = new URL(p.url).pathname;
    if (path !== "/" && !allLinkedPaths.has(path) && !allLinkedPaths.has(`${path}/`)) {
      allIssues.push({
        severity: "medium",
        issue_type: "orphan_page",
        page_url: p.url,
        title: "Orphan page",
        description: "No internal links from other crawled pages point to this page.",
        recommendation: "Add internal links from relevant pages to improve discoverability.",
      });
    }
  });

  // Compute SEO score: start at 100, deduct based on issue severity
  let score = 100;
  const deductions = { critical: 15, high: 8, medium: 4, low: 1 };
  allIssues.forEach((issue) => {
    score -= deductions[issue.severity];
  });
  score = Math.max(0, Math.min(100, score));

  // Save audit to database
  try {
    const { data: audit } = await supabase
      .from("seo_audits")
      .insert({
        overall_score: score,
        pages_crawled: pageAnalyses.length,
        critical_count: allIssues.filter((i) => i.severity === "critical").length,
        high_count: allIssues.filter((i) => i.severity === "high").length,
        medium_count: allIssues.filter((i) => i.severity === "medium").length,
        low_count: allIssues.filter((i) => i.severity === "low").length,
        passed_count: 0,
        summary: { pageAnalyses: pageAnalyses.map((p) => ({ url: p.url, score: p.issues.length === 0 ? 100 : Math.max(0, 100 - p.issues.reduce((s, i) => s + deductions[i.severity], 0)) })) },
      })
      .select("id")
      .single();

    if (audit) {
      const issueRows = allIssues.map((issue) => ({
        audit_id: audit.id,
        severity: issue.severity,
        issue_type: issue.issue_type,
        page_url: issue.page_url,
        title: issue.title,
        description: issue.description,
        recommendation: issue.recommendation,
        status: "open",
      }));
      await supabase.from("seo_issues").insert(issueRows);
    }
  } catch {
    // Saving is best-effort; return results regardless
  }

  return {
    score,
    pagesCrawled: pageAnalyses.length,
    issues: allIssues,
    pageAnalyses,
  };
}
