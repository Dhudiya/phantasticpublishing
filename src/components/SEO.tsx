import { useEffect, useState } from "react";
import { useSiteSettings } from "../contexts/SiteSettingsContext";
import { supabase } from "../lib/supabase";
import { generateSeo, generateCanonicalUrl, type PageType, type GeneratedSeo } from "../lib/seoDefaults";
import ogDefault from "../assets/og-default.jpg";

export interface SEOProps {
  /** Page type — drives auto-generated titles, descriptions, and H1 */
  pageType: PageType;
  /** Entity name (book title, author name, page name) */
  entityName?: string;
  /** Entity description (book description, author bio) */
  entityDescription?: string;
  /** Entity image (book cover, author photo) */
  entityImage?: string;
  /** Entity type for OG tag */
  entityType?: "website" | "article";
  /** Canonical path for this page (e.g. "/books/my-book") */
  canonicalPath?: string;
  /** For book pages: author name */
  authorName?: string;
  /** For book pages: genre */
  genre?: string;
  /** For book pages: short description */
  shortDescription?: string;
  /** For book pages: year, pages, isbn */
  year?: number;
  pages?: number;
  isbn?: string;
  /** For author pages: full bio */
  bio?: string;
  /** For author pages: list of book titles */
  bookTitles?: string[];
  /** For services: list of service names */
  serviceNames?: string[];
  /** Custom page name for generic pages */
  pageName?: string;
  /** Override noindex */
  noindex?: boolean;
  /** Override nofollow */
  nofollow?: boolean;
}

interface SeoPageMeta {
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
}

const SITE_NAME = "Phantastic Publishing";

export default function SEO(props: SEOProps) {
  const settings = useSiteSettings();
  const [pageMeta, setPageMeta] = useState<SeoPageMeta | null>(null);

  const canonicalPath = props.canonicalPath
    || (typeof window !== "undefined" ? window.location.pathname : "/");

  // Fetch any manually configured/auto-fixed SEO metadata from seo_page_meta
  useEffect(() => {
    let cancelled = false;
    supabase
      .from("seo_page_meta")
      .select("seo_title, seo_description, canonical_url, og_title, og_description, og_image, twitter_card, json_ld, robots_index, robots_follow")
      .eq("page_key", canonicalPath)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setPageMeta(data as SeoPageMeta);
      });
    return () => { cancelled = true; };
  }, [canonicalPath]);

  // Generate default SEO values from page data
  const generated: GeneratedSeo = generateSeo({
    pageType: props.pageType,
    entityName: props.entityName,
    entityDescription: props.entityDescription,
    entityImage: props.entityImage,
    entityType: props.entityType,
    authorName: props.authorName,
    genre: props.genre,
    shortDescription: props.shortDescription,
    year: props.year,
    pages: props.pages,
    isbn: props.isbn,
    bio: props.bio,
    bookTitles: props.bookTitles,
    serviceNames: props.serviceNames,
    pageName: props.pageName,
  });

  // Priority chain: manual meta > page-specific props > auto-generated > site-wide fallback
  const fullTitle = pageMeta?.seo_title || generated.title;
  const desc = pageMeta?.seo_description
    || props.entityDescription
    || generated.description;
  const ogTitle = pageMeta?.og_title || fullTitle;
  const ogDesc = pageMeta?.og_description || desc;
  const ogImage = pageMeta?.og_image || props.entityImage || generated.image || settings.seo_og_image || ogDefault;
  const twitterCardType = pageMeta?.twitter_card || "summary_large_image";
  const effectiveNoindex = pageMeta?.robots_index === false ? true : (props.noindex ?? false);
  const effectiveNofollow = pageMeta?.robots_follow === false ? true : (props.nofollow ?? false);
  const ogType = props.entityType || generated.type;
  const canonicalUrl = pageMeta?.canonical_url || generateCanonicalUrl(canonicalPath);
  const h1Text = generated.h1;

  // Apply meta tags to the document head
  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (attr: string, attrVal: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${attrVal}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, attrVal);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta("name", "description", desc);
    setMeta("property", "og:title", ogTitle);
    setMeta("property", "og:description", ogDesc);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("property", "og:image", ogImage);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("name", "twitter:card", twitterCardType);
    setMeta("name", "twitter:title", ogTitle);
    setMeta("name", "twitter:description", ogDesc);
    setMeta("name", "twitter:image", ogImage);

    // Robots meta
    const robotsDirectives: string[] = [];
    if (effectiveNoindex) robotsDirectives.push("noindex");
    else robotsDirectives.push("index");
    if (effectiveNofollow) robotsDirectives.push("nofollow");
    else robotsDirectives.push("follow");
    setMeta("name", "robots", robotsDirectives.join(", "));

    // Canonical URL
    let canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.rel = "canonical";
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = canonicalUrl;

    if (settings.seo_keywords) {
      setMeta("name", "keywords", settings.seo_keywords);
    }
  }, [fullTitle, desc, ogTitle, ogDesc, ogImage, twitterCardType, ogType, canonicalUrl, effectiveNoindex, effectiveNofollow, settings.seo_keywords]);

  // Inject H1 heading if the page doesn't already have one
  useEffect(() => {
    const existingH1 = document.querySelectorAll("h1");
    if (existingH1.length === 0) {
      // No H1 on the page — inject a visually-hidden but crawlable one
      const h1 = document.createElement("h1");
      h1.textContent = h1Text;
      h1.style.position = "absolute";
      h1.style.width = "1px";
      h1.style.height = "1px";
      h1.style.overflow = "hidden";
      h1.style.clip = "rect(0,0,0,0)";
      h1.style.whiteSpace = "nowrap";
      h1.style.border = "0";
      h1.style.padding = "0";
      h1.style.margin = "-1px";
      h1.setAttribute("aria-hidden", "true");
      h1.setAttribute("data-seo-h1", "true");
      document.body.appendChild(h1);

      return () => {
        h1.remove();
      };
    } else if (existingH1.length > 1) {
      // Multiple H1s — remove extras that we injected (keep the first real one)
      for (let i = 1; i < existingH1.length; i++) {
        if (existingH1[i].getAttribute("data-seo-h1") === "true") {
          existingH1[i].remove();
        }
      }
    }
  }, [h1Text]);

  // Inject auto-fixed JSON-LD if present in seo_page_meta
  useEffect(() => {
    if (!pageMeta?.json_ld || !Array.isArray(pageMeta.json_ld) || pageMeta.json_ld.length === 0) return;

    const SCRIPT_ID = "json-ld-autofix";
    document.querySelectorAll(`script[id^="${SCRIPT_ID}"]`).forEach((el) => el.remove());

    (pageMeta.json_ld as object[]).forEach((schema, i) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = `${SCRIPT_ID}-${i}`;
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      document.querySelectorAll(`script[id^="${SCRIPT_ID}"]`).forEach((el) => el.remove());
    };
  }, [pageMeta?.json_ld]);

  return null;
}
