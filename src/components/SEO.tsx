import { useEffect, useState } from "react";
import { useSiteSettings } from "../contexts/SiteSettingsContext";
import { supabase } from "../lib/supabase";
import ogDefault from "../assets/og-default.jpg";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article";
  canonicalPath?: string;
  noindex?: boolean;
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

export default function SEO({
  title,
  description,
  image,
  type = "website",
  canonicalPath,
  noindex = false,
  nofollow = false,
}: SEOProps) {
  const settings = useSiteSettings();
  const [pageMeta, setPageMeta] = useState<SeoPageMeta | null>(null);

  // Fetch any auto-fixed SEO metadata from the seo_page_meta table
  useEffect(() => {
    const path = canonicalPath || window.location.pathname;
    let cancelled = false;

    supabase
      .from("seo_page_meta")
      .select("seo_title, seo_description, canonical_url, og_title, og_description, og_image, twitter_card, json_ld, robots_index, robots_follow")
      .eq("page_key", path)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setPageMeta(data as SeoPageMeta);
      });

    return () => { cancelled = true; };
  }, [canonicalPath]);

  // Auto-fixed metadata overrides the component props
  const fullTitle = pageMeta?.seo_title
    || (title ? `${title} — ${SITE_NAME}` : settings.seo_title || `${SITE_NAME} — Bringing Stories to Life`);
  const desc = pageMeta?.seo_description
    || description
    || settings.seo_description
    || "An independent publishing house dedicated to discovering and nurturing bold literary voices across every genre.";
  const ogTitle = pageMeta?.og_title || fullTitle;
  const ogDesc = pageMeta?.og_description || desc;
  const ogImage = pageMeta?.og_image || image || settings.seo_og_image || ogDefault;
  const twitterCardType = pageMeta?.twitter_card || "summary_large_image";
  const effectiveNoindex = pageMeta?.robots_index === false ? true : noindex;
  const effectiveNofollow = pageMeta?.robots_follow === false ? true : nofollow;

  const canonicalUrl = pageMeta?.canonical_url
    || (canonicalPath
      ? `${typeof window !== "undefined" ? window.location.origin : ""}${canonicalPath}`
      : typeof window !== "undefined" ? window.location.href : "");

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
    setMeta("property", "og:type", type);
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
  }, [fullTitle, desc, ogTitle, ogDesc, ogImage, twitterCardType, type, canonicalUrl, effectiveNoindex, effectiveNofollow, settings.seo_keywords]);

  // Inject auto-fixed JSON-LD if present in seo_page_meta
  useEffect(() => {
    if (!pageMeta?.json_ld || !Array.isArray(pageMeta.json_ld) || pageMeta.json_ld.length === 0) return;

    const SCRIPT_ID = "json-ld-autofix";
    // Remove any previously injected auto-fix scripts
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
