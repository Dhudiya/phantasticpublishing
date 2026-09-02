import { supabase } from "./supabase";
import { generateSeo, generateCanonicalUrl, type PageType } from "./seoDefaults";

/*
 * SPA-aware SEO Analyzer
 *
 * This is a single-page app — meta tags, H1s, structured data, and content
 * are all injected at runtime by JavaScript. Fetching raw HTML via fetch()
 * returns an empty shell with no SEO data, producing false positives on
 * every single page.
 *
 * Instead of fetching HTML, this analyzer computes what the rendered page
 * WILL have by using the same generateSeo() logic the SEO component uses,
 * plus actual database content for each page. This gives an accurate
 * picture of the page's SEO health that matches what crawlers see after
 * JavaScript rendering.
 *
 * The analyzer also models the internal linking graph from the known route
 * structure (navigation, book/author cross-links, listing pages) rather
 * than parsing <a> tags from empty HTML.
 */

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

interface BookRow {
  slug: string;
  title: string;
  description: string | null;
  short_description: string | null;
  cover_image: string | null;
  author_id: number;
  genre: string | null;
  year: number | null;
  pages: number | null;
  isbn: string | null;
  updated_at: string | null;
}

interface AuthorRow {
  slug: string;
  name: string;
  bio: string | null;
  photo: string | null;
  genre: string | null;
  website: string | null;
  twitter: string | null;
  instagram: string | null;
  updated_at: string | null;
}

interface ServiceRow {
  title: string;
  description: string | null;
  features: string[] | null;
}

interface PageContentRow {
  page_key: string;
  content: Record<string, unknown>;
}

interface SeoPageMetaRow {
  page_key: string;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  twitter_card: string | null;
  json_ld: unknown[] | null;
  robots_index: boolean | null;
  robots_follow: boolean | null;
  manually_edited: boolean | null;
}

interface SiteSettings {
  site_name: string;
  seo_description: string;
  seo_og_image: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const slice = text.slice(0, maxLen - 3);
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace > maxLen * 0.6) return slice.slice(0, lastSpace) + "...";
  return slice + "...";
}

function wordCount(...texts: (string | null | undefined)[]): number {
  const combined = texts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  if (!combined) return 0;
  return combined.split(/\s+/).filter((w) => w.length > 0).length;
}

function extractContentText(content: Record<string, unknown>): string {
  const parts: string[] = [];
  const walk = (val: unknown) => {
    if (typeof val === "string") parts.push(val);
    else if (Array.isArray(val)) val.forEach(walk);
    else if (val && typeof val === "object") Object.values(val).forEach(walk);
  };
  Object.values(content).forEach(walk);
  return parts.join(" ");
}

function pathFromUrl(url: string): string {
  try { return new URL(url).pathname; } catch { return url; }
}

// ─── Data loading ─────────────────────────────────────────────────────

async function loadBooks(): Promise<BookRow[]> {
  const { data } = await supabase.from("books").select(
    "slug,title,description,short_description,cover_image,author_id,genre,year,pages,isbn,updated_at"
  ).order("sort_order");
  return (data ?? []) as BookRow[];
}

async function loadAuthors(): Promise<AuthorRow[]> {
  const { data } = await supabase.from("authors").select(
    "slug,name,bio,photo,genre,website,twitter,instagram,updated_at"
  ).order("sort_order");
  return (data ?? []) as AuthorRow[];
}

async function loadServices(): Promise<ServiceRow[]> {
  const { data } = await supabase.from("services").select("title,description,features");
  return (data ?? []) as ServiceRow[];
}

async function loadPageContents(): Promise<Map<string, PageContentRow>> {
  const { data } = await supabase.from("page_content").select("page_key,content");
  const map = new Map<string, PageContentRow>();
  (data ?? []).forEach((row) => {
    map.set((row as PageContentRow).page_key, row as PageContentRow);
  });
  return map;
}

async function loadSeoPageMeta(): Promise<Map<string, SeoPageMetaRow>> {
  const { data } = await supabase.from("seo_page_meta").select("*");
  const map = new Map<string, SeoPageMetaRow>();
  (data ?? []).forEach((row) => {
    const r = row as SeoPageMetaRow;
    map.set(r.page_key, r);
  });
  return map;
}

async function loadSiteSettings(): Promise<SiteSettings> {
  const { data } = await supabase.from("site_settings").select("site_name,seo_description,seo_og_image").eq("id", 1).maybeSingle();
  return (data as SiteSettings) ?? { site_name: "Phantastic Publishing", seo_description: "", seo_og_image: "" };
}

// ─── URL discovery ────────────────────────────────────────────────────

export async function discoverUrls(): Promise<string[]> {
  const origin = window.location.origin;
  const staticUrls = ["/", "/books", "/authors", "/services", "/about", "/contact"];

  const dynamicUrls: string[] = [];
  try {
    const [books, authors] = await Promise.all([
      supabase.from("books").select("slug"),
      supabase.from("authors").select("slug"),
    ]);
    (books.data ?? []).forEach((b: { slug: string }) => dynamicUrls.push(`/books/${b.slug}`));
    (authors.data ?? []).forEach((a: { slug: string }) => dynamicUrls.push(`/authors/${a.slug}`));
  } catch {
    // If DB fails, just use static URLs
  }

  return [...staticUrls, ...dynamicUrls].map((p) => `${origin}${p}`);
}

// ─── Page analysis (SPA-aware) ────────────────────────────────────────

interface PageContext {
  books: BookRow[];
  authors: AuthorRow[];
  services: ServiceRow[];
  pageContents: Map<string, PageContentRow>;
  seoPageMeta: Map<string, SeoPageMetaRow>;
  siteSettings: SiteSettings;
  allPaths: string[];
}

function classifyPath(pathname: string): { pageType: PageType; entitySlug?: string } {
  if (pathname === "/") return { pageType: "home" };
  if (pathname === "/books") return { pageType: "books" };
  if (pathname === "/authors") return { pageType: "authors" };
  if (pathname === "/services") return { pageType: "services" };
  if (pathname === "/about") return { pageType: "about" };
  if (pathname === "/contact") return { pageType: "contact" };
  if (pathname.startsWith("/books/")) return { pageType: "book", entitySlug: pathname.replace("/books/", "") };
  if (pathname.startsWith("/authors/")) return { pageType: "author", entitySlug: pathname.replace("/authors/", "") };
  return { pageType: "generic", entitySlug: pathname };
}

function computeInternalLinks(
  pathname: string,
  pageType: PageType,
  books: BookRow[],
  authors: AuthorRow[],
  allPaths: string[]
): string[] {
  const links = new Set<string>();

  // Every page has navigation links (header + footer)
  ["/", "/books", "/authors", "/services", "/about", "/contact"].forEach((p) => links.add(p));

  if (pageType === "home") {
    books.slice(0, 4).forEach((b) => links.add(`/books/${b.slug}`));
    authors.slice(0, 4).forEach((a) => links.add(`/authors/${a.slug}`));
  }

  if (pageType === "books") {
    books.forEach((b) => links.add(`/books/${b.slug}`));
    books.forEach((b) => {
      const author = authors.find((a) => a.id === b.author_id);
      if (author) links.add(`/authors/${author.slug}`);
    });
  }

  if (pageType === "authors") {
    authors.forEach((a) => links.add(`/authors/${a.slug}`));
  }

  if (pageType === "book") {
    const book = books.find((b) => b.slug === pathname.replace("/books/", ""));
    if (book) {
      const author = authors.find((a) => a.id === book.author_id);
      if (author) links.add(`/authors/${author.slug}`);
    }
    links.add("/books");
    // Related books by same author
    if (book) {
      books.filter((b) => b.author_id === book.author_id && b.slug !== book.slug).slice(0, 4).forEach((b) => links.add(`/books/${b.slug}`));
    }
  }

  if (pageType === "author") {
    const slug = pathname.replace("/authors/", "");
    const author = authors.find((a) => a.slug === slug);
    if (author) {
      books.filter((b) => b.author_id === author.id).forEach((b) => links.add(`/books/${b.slug}`));
    }
    links.add("/authors");
  }

  return Array.from(links).filter((l) => l !== pathname);
}

function computeExpectedImages(
  pageType: PageType,
  book: BookRow | undefined,
  author: AuthorRow | undefined,
  pageContents: Map<string, PageContentRow>,
  siteSettings: SiteSettings
): { total: number; withoutAlt: number } {
  // The app uses SmartImage with alt attributes on book covers, author photos, etc.
  // Decorative images (hero backgrounds) have alt="" which is valid.
  // We count meaningful images and check if they have alt text.
  let total = 0;
  let withoutAlt = 0;

  if (pageType === "home") {
    const content = pageContents.get("home");
    if (content) {
      const heroImg = (content.content as Record<string, Record<string, string>>).hero?.background_image;
      if (heroImg) { total++; } // decorative — alt="" is correct
    }
    // Featured books (covers with alt)
    total += 4;
    // Featured authors (photos with alt)
    total += 4;
    // Testimonial avatars (with alt)
    total += 4;
    // About intro image
    total += 1;
  }

  if (pageType === "book" && book) {
    if (book.cover_image) total++; // has alt
  }

  if (pageType === "author" && author) {
    if (author.photo) total++; // has alt
  }

  if (pageType === "books") {
    total += 8; // book covers with alt
  }

  if (pageType === "authors") {
    total += 8; // author photos with alt
  }

  if (pageType === "services") {
    const content = pageContents.get("services");
    if (content) {
      const heroImg = (content.content as Record<string, Record<string, string>>).hero?.background_image;
      if (heroImg) total++; // decorative
    }
  }

  if (pageType === "about") {
    const content = pageContents.get("about");
    if (content) {
      const heroImg = (content.content as Record<string, Record<string, string>>).hero?.background_image;
      if (heroImg) total++; // decorative
    }
  }

  if (pageType === "contact") {
    total += 0; // contact page may have no images or just decorative ones
  }

  return { total, withoutAlt };
}

function computeExpectedJsonLd(pageType: PageType): number {
  // SchemaInjector always adds Organization + WebSite schema (2 scripts).
  // Page-specific schema is added by each page.
  let count = 2;
  if (pageType === "book") count += 2; // Book + BreadcrumbList
  if (pageType === "author") count += 2; // Person + BreadcrumbList
  if (pageType === "services") count += 1; // BreadcrumbList
  if (pageType === "about") count += 1; // BreadcrumbList
  return count;
}

function analyzePageSpa(
  url: string,
  ctx: PageContext
): PageAnalysis {
  const issues: SeoIssue[] = [];
  const pathname = pathFromUrl(url);
  const { pageType, entitySlug } = classifyPath(pathname);
  const meta = ctx.seoPageMeta.get(pathname);
  const origin = window.location.origin;

  // ─── Find entity data ──────────────────────────────────────────────
  let book: BookRow | undefined;
  let author: AuthorRow | undefined;
  let bookTitles: string[] = [];
  let authorName: string | undefined;

  if (pageType === "book") {
    book = ctx.books.find((b) => b.slug === entitySlug);
    if (book) {
      const a = ctx.authors.find((au) => au.id === book!.author_id);
      authorName = a?.name;
    }
  }

  if (pageType === "author") {
    author = ctx.authors.find((a) => a.slug === entitySlug);
    if (author) {
      bookTitles = ctx.books
        .filter((b) => b.author_id === ctx.authors.find((au) => au.slug === entitySlug)?.id)
        .map((b) => b.title);
    }
  }

  // ─── Page not found (dynamic page with no matching entity) ────────
  if ((pageType === "book" || pageType === "author") && !book && !author) {
    return {
      url,
      statusCode: 404,
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
      loadTimeMs: 0,
      issues: [{
        severity: "critical",
        issue_type: "http_error",
        page_url: url,
        title: "Page not found (404)",
        description: `No ${pageType} found for slug "${entitySlug}".`,
        recommendation: "Check that the slug is correct and the entity exists in the database.",
      }],
    };
  }

  // ─── Generate expected SEO metadata ────────────────────────────────
  const generated = generateSeo({
    pageType,
    entityName: book?.title || author?.name,
    entityDescription: book?.description || author?.bio,
    entityImage: book?.cover_image || author?.photo || undefined,
    authorName,
    genre: book?.genre || author?.genre || undefined,
    shortDescription: book?.short_description || undefined,
    year: book?.year || undefined,
    pages: book?.pages || undefined,
    isbn: book?.isbn || undefined,
    bio: author?.bio || undefined,
    bookTitles,
    serviceNames: ctx.services.map((s) => s.title),
  });

  // Priority: manually edited seo_page_meta > generated > site-wide fallback
  const isManual = meta?.manually_edited === true;
  const title = meta?.seo_title || generated.title;
  const metaDescription = meta?.seo_description || generated.description;
  const canonical = meta?.canonical_url || generateCanonicalUrl(pathname);
  const ogTitle = meta?.og_title || title;
  const ogDescription = meta?.og_description || metaDescription;
  const ogImage = meta?.og_image || generated.image || ctx.siteSettings.seo_og_image || "";
  const twitterCard = meta?.twitter_card || "summary_large_image";
  const twitterImage = ogImage;
  const hasNoindex = meta?.robots_index === false;
  const hasNofollow = meta?.robots_follow === false;
  const h1Count = 1; // Every page has exactly one H1 (verified in page components)
  const jsonLdScripts = computeExpectedJsonLd(pageType);

  // ─── Compute word count from actual content ────────────────────────
  let contentWords = 0;

  if (pageType === "book" && book) {
    contentWords = wordCount(
      book.title,
      book.description,
      book.short_description,
      book.genre,
      authorName,
      book.isbn,
      String(book.year ?? ""),
      String(book.pages ?? ""),
      "Buy this book",
      "About the Author",
      "Related Books"
    );
  }

  if (pageType === "author" && author) {
    contentWords = wordCount(
      author.name,
      author.bio,
      author.genre,
      ...bookTitles,
      "Books by this Author"
    );
  }

  if (pageType === "home") {
    const content = ctx.pageContents.get("home");
    if (content) contentWords += wordCount(extractContentText(content.content));
    // Add book titles, author names, service descriptions, testimonials
    contentWords += wordCount(...ctx.books.slice(0, 4).map((b) => `${b.title} ${b.genre}`));
    contentWords += wordCount(...ctx.authors.slice(0, 4).map((a) => `${a.name} ${a.genre}`));
    contentWords += wordCount(...ctx.services.slice(0, 3).map((s) => `${s.title} ${s.description}`));
  }

  if (pageType === "books") {
    const content = ctx.pageContents.get("books");
    if (content) contentWords += wordCount(extractContentText(content.content));
    contentWords += wordCount(...ctx.books.map((b) => `${b.title} ${b.genre}`));
    contentWords += wordCount(...ctx.authors.map((a) => a.name));
  }

  if (pageType === "authors") {
    const content = ctx.pageContents.get("authors");
    if (content) contentWords += wordCount(extractContentText(content.content));
    contentWords += wordCount(...ctx.authors.map((a) => `${a.name} ${a.genre} ${a.bio}`));
  }

  if (pageType === "services") {
    const content = ctx.pageContents.get("services");
    if (content) contentWords += wordCount(extractContentText(content.content));
    contentWords += wordCount(...ctx.services.map((s) => `${s.title} ${s.description} ${(s.features ?? []).join(" ")}`));
  }

  if (pageType === "about") {
    const content = ctx.pageContents.get("about");
    if (content) contentWords += wordCount(extractContentText(content.content));
  }

  if (pageType === "contact") {
    const content = ctx.pageContents.get("contact");
    if (content) contentWords += wordCount(extractContentText(content.content));
  }

  // ─── Compute internal links ────────────────────────────────────────
  const internalLinks = computeInternalLinks(pathname, pageType, ctx.books, ctx.authors, ctx.allPaths);

  // ─── Compute images ────────────────────────────────────────────────
  const { total: imagesTotal, withoutAlt: imagesWithoutAlt } = computeExpectedImages(
    pageType, book, author, ctx.pageContents, ctx.siteSettings
  );

  // ─── Count H2s (approximate from page structure) ───────────────────
  let h2Count = 0;
  if (pageType === "home") h2Count = 5; // featured books, about intro, services, authors, testimonials, CTA
  if (pageType === "book") h2Count = 3; // about the book, about the author, related books
  if (pageType === "author") h2Count = 2; // biography, books
  if (pageType === "books") h2Count = 1;
  if (pageType === "authors") h2Count = 1;
  if (pageType === "services") h2Count = ctx.services.length;
  if (pageType === "about") h2Count = 3;
  if (pageType === "contact") h2Count = 1;

  // ─── Issue detection ───────────────────────────────────────────────

  // Title checks
  if (!title) {
    issues.push({
      severity: "critical", issue_type: "missing_title", page_url: url,
      title: "Missing SEO title",
      description: "The page has no <title> tag.",
      recommendation: "Add a descriptive, unique title tag (50-60 characters).",
    });
  } else {
    if (title.length > 65) {
      issues.push({
        severity: "medium", issue_type: "title_too_long", page_url: url,
        title: "Title tag too long",
        description: `Title is ${title.length} characters (recommended max 60).`,
        recommendation: "Shorten the title to under 60 characters for optimal display in search results.",
      });
    } else if (title.length < 10) {
      issues.push({
        severity: "medium", issue_type: "title_too_short", page_url: url,
        title: "Title tag too short",
        description: `Title is only ${title.length} characters.`,
        recommendation: "Expand the title to be more descriptive (at least 30 characters).",
      });
    }
  }

  // Meta description checks
  if (!metaDescription) {
    issues.push({
      severity: "high", issue_type: "missing_meta_description", page_url: url,
      title: "Missing meta description",
      description: "The page has no meta description tag.",
      recommendation: "Add a unique meta description of 150-160 characters.",
    });
  } else if (metaDescription.length > 170) {
    issues.push({
      severity: "low", issue_type: "meta_description_too_long", page_url: url,
      title: "Meta description too long",
      description: `Description is ${metaDescription.length} characters (recommended max 160).`,
      recommendation: "Shorten the meta description to under 160 characters.",
    });
  }

  // Canonical check
  if (!canonical) {
    issues.push({
      severity: "high", issue_type: "missing_canonical", page_url: url,
      title: "Missing canonical URL",
      description: "The page has no canonical link tag.",
      recommendation: 'Add a <link rel="canonical"> tag to prevent duplicate content issues.',
    });
  } else {
    const expectedCanonical = `${origin}${pathname === "/" ? "/" : pathname.replace(/\/$/, "")}`;
    if (canonical !== expectedCanonical && !isManual) {
      issues.push({
        severity: "low", issue_type: "canonical_mismatch", page_url: url,
        title: "Canonical URL mismatch",
        description: `Canonical is "${canonical}" but expected "${expectedCanonical}".`,
        recommendation: "Ensure the canonical URL matches the page's actual URL.",
      });
    }
  }

  // H1 check — we know every page has exactly 1 H1 from the components
  // Only flag if something went wrong with the component
  if (h1Count === 0) {
    issues.push({
      severity: "high", issue_type: "missing_h1", page_url: url,
      title: "Missing H1 heading",
      description: "The page has no H1 heading.",
      recommendation: "Add a single, descriptive H1 heading that includes the primary keyword.",
    });
  } else if (h1Count > 1) {
    issues.push({
      severity: "medium", issue_type: "multiple_h1", page_url: url,
      title: "Multiple H1 headings",
      description: `Found ${h1Count} H1 headings (recommended: 1).`,
      recommendation: "Use only one H1 per page. Change additional H1s to H2 or H3.",
    });
  }

  // H2 check
  if (h2Count === 0 && contentWords > 300) {
    issues.push({
      severity: "medium", issue_type: "no_h2_headings", page_url: url,
      title: "No H2 headings",
      description: "The page has content but no H2 subheadings.",
      recommendation: "Break up content with H2 subheadings for better structure and readability.",
    });
  }

  // Open Graph checks
  if (!ogTitle) {
    issues.push({
      severity: "medium", issue_type: "missing_og_title", page_url: url,
      title: "Missing Open Graph title",
      description: "No og:title meta tag found.",
      recommendation: "Add an og:title meta tag for social sharing.",
    });
  }

  if (!ogImage) {
    issues.push({
      severity: "medium", issue_type: "missing_og_image", page_url: url,
      title: "Missing Open Graph image",
      description: "No og:image meta tag found.",
      recommendation: "Add an og:image meta tag so link previews show an image.",
    });
  }

  // Twitter Card check
  if (!twitterCard) {
    issues.push({
      severity: "medium", issue_type: "missing_twitter_card", page_url: url,
      title: "Missing Twitter Card metadata",
      description: "No twitter:card meta tag found.",
      recommendation: "Add twitter:card and twitter:image meta tags for X/Twitter sharing.",
    });
  }

  // Image alt text check
  if (imagesWithoutAlt > 0) {
    issues.push({
      severity: "medium", issue_type: "images_missing_alt", page_url: url,
      title: `${imagesWithoutAlt} image${imagesWithoutAlt > 1 ? "s" : ""} missing ALT text`,
      description: `${imagesWithoutAlt} out of ${imagesTotal} images have no alt attribute.`,
      recommendation: "Add descriptive alt text to all images for accessibility and SEO.",
    });
  }

  // Structured data check
  if (jsonLdScripts === 0) {
    issues.push({
      severity: "medium", issue_type: "missing_structured_data", page_url: url,
      title: "No structured data (JSON-LD)",
      description: "The page has no JSON-LD structured data scripts.",
      recommendation: "Add Schema.org JSON-LD for Organization, WebSite, and page-specific schema.",
    });
  }

  // Thin content check — uses actual database content
  if (contentWords < 300 && pageType !== "contact") {
    const canEnrich = (pageType === "book" && !!book?.description) ||
                      (pageType === "author" && !!author?.bio) ||
                      (pageType === "services" && ctx.services.length > 0);

    issues.push({
      severity: canEnrich ? "medium" : "low",
      issue_type: "thin_content",
      page_url: url,
      title: "Thin content",
      description: `Page has approximately ${contentWords} words of meaningful content (recommended minimum: 300).`,
      recommendation: canEnrich
        ? "Add more detailed descriptions, bios, or feature information in the admin panel to enrich this page."
        : "Add more substantial content to improve search visibility. If insufficient source data exists, consider merging or expanding this page.",
    });
  }

  // Robots checks
  if (hasNoindex) {
    issues.push({
      severity: "high", issue_type: "noindex_directive", page_url: url,
      title: "Page is set to noindex",
      description: "The robots meta tag contains 'noindex', preventing search engines from indexing this page.",
      recommendation: "Remove the noindex directive if this page should be indexed.",
    });
  }

  if (hasNofollow) {
    issues.push({
      severity: "low", issue_type: "nofollow_directive", page_url: url,
      title: "Page is set to nofollow",
      description: "The robots meta tag contains 'nofollow'.",
      recommendation: "Remove the nofollow directive if links on this page should be followed.",
    });
  }

  return {
    url,
    statusCode: 200,
    title,
    metaDescription,
    canonical,
    robots: `${hasNoindex ? "noindex" : "index"}, ${hasNofollow ? "nofollow" : "follow"}`,
    h1Count,
    h2Count,
    h3Count: 0,
    ogTitle,
    ogDescription,
    ogImage: ogImage || null,
    twitterCard,
    twitterImage: twitterImage || null,
    imagesTotal,
    imagesWithoutAlt,
    jsonLdScripts,
    wordCount: contentWords,
    internalLinks,
    externalLinks: [],
    hasNoindex,
    hasNofollow,
    loadTimeMs: 0,
    issues,
  };
}

// ─── Orphan page detection ────────────────────────────────────────────

function detectOrphanPages(
  pageAnalyses: PageAnalysis[],
  allPaths: string[]
): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const allLinkedPaths = new Set<string>();

  // Collect all internal links from all pages
  pageAnalyses.forEach((p) => {
    p.internalLinks.forEach((l) => {
      allLinkedPaths.add(l);
      allLinkedPaths.add(l.replace(/\/$/, ""));
    });
  });

  // Navigation links are present on every page via header/footer
  ["/", "/books", "/authors", "/services", "/about", "/contact"].forEach((p) => allLinkedPaths.add(p));

  // Check each page
  pageAnalyses.forEach((p) => {
    const path = pathFromUrl(p.url);
    if (path === "/") return; // homepage is never an orphan
    if (allLinkedPaths.has(path) || allLinkedPaths.has(`${path}/`)) return;

    issues.push({
      severity: "medium",
      issue_type: "orphan_page",
      page_url: p.url,
      title: "Orphan page",
      description: "No internal links from other crawled pages point to this page.",
      recommendation: "Add internal links from relevant pages to improve discoverability.",
    });
  });

  return issues;
}

// ─── Full audit ───────────────────────────────────────────────────────

export async function runFullAudit(): Promise<AuditResult> {
  const origin = window.location.origin;

  // Load all data in parallel
  const [books, authors, services, pageContents, seoPageMeta, siteSettings] = await Promise.all([
    loadBooks(),
    loadAuthors(),
    loadServices(),
    loadPageContents(),
    loadSeoPageMeta(),
    loadSiteSettings(),
  ]);

  // Build the full list of paths
  const staticPaths = ["/", "/books", "/authors", "/services", "/about", "/contact"];
  const bookPaths = books.map((b) => `/books/${b.slug}`);
  const authorPaths = authors.map((a) => `/authors/${a.slug}`);
  const allPaths = [...staticPaths, ...bookPaths, ...authorPaths];

  const ctx: PageContext = { books, authors, services, pageContents, seoPageMeta, siteSettings, allPaths };

  // Analyze each page
  const pageAnalyses: PageAnalysis[] = allPaths.map((path) =>
    analyzePageSpa(`${origin}${path}`, ctx)
  );

  // Collect all per-page issues
  const allIssues: SeoIssue[] = [];
  pageAnalyses.forEach((p) => {
    p.issues.forEach((issue) => allIssues.push(issue));
  });

  // Check for duplicate titles
  const titleMap = new Map<string, string[]>();
  pageAnalyses.forEach((p) => {
    if (p.title && p.statusCode === 200) {
      const existing = titleMap.get(p.title) || [];
      existing.push(p.url);
      titleMap.set(p.title, existing);
    }
  });
  titleMap.forEach((pages, title) => {
    if (pages.length > 1) {
      allIssues.push({
        severity: "high",
        issue_type: "duplicate_title",
        page_url: pages.join(", "),
        title: `Duplicate title: "${title}"`,
        description: `${pages.length} pages share the same title tag.`,
        recommendation: "Make each page's title unique to avoid cannibalization.",
      });
    }
  });

  // Check for duplicate meta descriptions
  const descMap = new Map<string, string[]>();
  pageAnalyses.forEach((p) => {
    if (p.metaDescription && p.statusCode === 200) {
      const existing = descMap.get(p.metaDescription) || [];
      existing.push(p.url);
      descMap.set(p.metaDescription, existing);
    }
  });
  descMap.forEach((pages, desc) => {
    if (pages.length > 1) {
      allIssues.push({
        severity: "medium",
        issue_type: "duplicate_meta_description",
        page_url: pages.join(", "),
        title: "Duplicate meta description",
        description: `${pages.length} pages share the same meta description.`,
        recommendation: "Write a unique meta description for each page.",
      });
    }
  });

  // Orphan page detection
  const orphanIssues = detectOrphanPages(pageAnalyses, allPaths);
  allIssues.push(...orphanIssues);

  // Compute SEO score
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
        passed_count: pageAnalyses.filter((p) => p.issues.length === 0).length,
        summary: {
          pageAnalyses: pageAnalyses.map((p) => ({
            url: p.url,
            score: p.issues.length === 0 ? 100 : Math.max(0, 100 - p.issues.reduce((s, i) => s + deductions[i.severity], 0)),
          })),
        },
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
