import { useEffect } from "react";
import { useSiteSettings } from "../contexts/SiteSettingsContext";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article";
}

const SITE_NAME = "Phantastic Publishing";

export default function SEO({ title, description, image, type = "website" }: SEOProps) {
  const settings = useSiteSettings();
  const fullTitle = title
    ? `${title} — ${SITE_NAME}`
    : settings.seo_title || `${SITE_NAME} — Bringing Stories to Life`;
  const desc =
    description ||
    settings.seo_description ||
    "An independent publishing house dedicated to discovering and nurturing bold literary voices across every genre.";

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
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", desc);
    if (image) {
      setMeta("property", "og:image", image);
      setMeta("name", "twitter:image", image);
    }
    if (settings.seo_keywords) {
      setMeta("name", "keywords", settings.seo_keywords);
    }
  }, [fullTitle, desc, image, type, settings.seo_keywords]);

  return null;
}
