import { useEffect } from "react";
import { useSiteSettings } from "../contexts/SiteSettingsContext";
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
  const fullTitle = title
    ? `${title} — ${SITE_NAME}`
    : settings.seo_title || `${SITE_NAME} — Bringing Stories to Life`;
  const desc =
    description ||
    settings.seo_description ||
    "An independent publishing house dedicated to discovering and nurturing bold literary voices across every genre.";

  const ogImage = image || settings.seo_og_image || ogDefault;
  const canonicalUrl = canonicalPath
    ? `${typeof window !== "undefined" ? window.location.origin : ""}${canonicalPath}`
    : typeof window !== "undefined"
      ? window.location.href
      : "";

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
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:type", type);
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("property", "og:image", ogImage);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:image", ogImage);

    // Robots meta
    const robotsDirectives: string[] = [];
    if (noindex) robotsDirectives.push("noindex");
    else robotsDirectives.push("index");
    if (nofollow) robotsDirectives.push("nofollow");
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
  }, [fullTitle, desc, ogImage, type, canonicalUrl, noindex, nofollow, settings.seo_keywords]);

  return null;
}
