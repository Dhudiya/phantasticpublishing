import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface FooterLink {
  label: string;
  url: string;
}

export interface SiteSettings {
  site_name: string;
  tagline: string;
  logo_light_url: string;
  logo_dark_url: string;
  favicon_url: string;
  social_twitter: string;
  social_instagram: string;
  social_facebook: string;
  social_linkedin: string;
  social_youtube: string;
  footer_copyright: string;
  footer_address: string;
  footer_email: string;
  footer_nav_links: FooterLink[];
  footer_legal_links: FooterLink[];
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  google_books_logo_url: string;
  apple_books_logo_url: string;
  amazon_kindle_logo_url: string;
}

interface SiteSettingsContextValue {
  settings: SiteSettings;
  loaded: boolean;
}

const defaults: SiteSettings = {
  site_name: "Phantastic Publishing",
  tagline: "Bringing Stories to Life",
  logo_light_url: "",
  logo_dark_url: "",
  favicon_url: "",
  social_twitter: "",
  social_instagram: "",
  social_facebook: "",
  social_linkedin: "",
  social_youtube: "",
  footer_copyright: "Phantastic Publishing. All rights reserved.",
  footer_address: "Brooklyn, New York",
  footer_email: "contact@phantasticpub.com",
  footer_nav_links: [
    { label: "Home",     url: "/" },
    { label: "Books",    url: "/books" },
    { label: "Authors",  url: "/authors" },
    { label: "Services", url: "/services" },
    { label: "About",    url: "/about" },
    { label: "Contact",  url: "/contact" },
  ],
  footer_legal_links: [
    { label: "Terms of Use",                         url: "/contact" },
    { label: "Privacy Policy",                       url: "/contact" },
    { label: "Addendum to the Global Privacy Policy", url: "/contact" },
    { label: "Interest Based Ads",                   url: "/contact" },
  ],
  seo_title: "Phantastic Publishing — Bringing Stories to Life",
  seo_description:
    "An independent publishing house dedicated to discovering and nurturing bold literary voices across every genre.",
  seo_keywords: "publishing, books, authors, literary, independent publisher",
  google_books_logo_url: "",
  apple_books_logo_url: "",
  amazon_kindle_logo_url: "",
};

const SiteSettingsContext = createContext<SiteSettingsContextValue>({ settings: defaults, loaded: false });

// Module-level cache: once settings are fetched, subsequent mounts reuse the
// cached values so the logo renders instantly without a flash.
let cachedSettings: SiteSettings | null = null;
let cachedLoaded = false;

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(cachedSettings ?? defaults);
  const [loaded, setLoaded] = useState(cachedLoaded);

  useEffect(() => {
    if (cachedLoaded) return; // already fetched in a prior mount

    supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        const merged = data ? { ...defaults, ...(data as SiteSettings) } : defaults;
        cachedSettings = merged;
        cachedLoaded = true;
        setSettings(merged);
        setLoaded(true);

        // Preload logo images so they render instantly when the Logo component mounts
        const urls = [merged.logo_light_url, merged.logo_dark_url].filter(Boolean);
        urls.forEach((url) => {
          const img = new Image();
          img.src = url;
        });
      });
  }, []);

  // Favicon is served locally from /public/favicon.svg — no dynamic override needed.

  return (
    <SiteSettingsContext.Provider value={{ settings, loaded }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext).settings;
}

export function useSiteSettingsLoaded() {
  return useContext(SiteSettingsContext).loaded;
}
