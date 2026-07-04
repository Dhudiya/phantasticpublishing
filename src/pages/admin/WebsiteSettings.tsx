import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import {
  Card, PageHeader, Button, Input, Textarea, Spinner,
} from "../../admin/ui";
import { Save, Check, Globe, Search, Share2, Layout, Image as ImageIcon, Plus, Trash2, BookOpen } from "lucide-react";

interface FooterLink { label: string; url: string; }

interface Settings {
  site_name: string; tagline: string; description: string;
  seo_title: string; seo_description: string; seo_keywords: string;
  social_twitter: string; social_instagram: string; social_facebook: string;
  social_linkedin: string; social_youtube: string;
  header_cta_text: string; header_cta_link: string;
  footer_copyright: string; footer_address: string; footer_email: string; footer_phone: string;
  footer_nav_links: FooterLink[];
  footer_legal_links: FooterLink[];
  analytics_id: string;
  logo_light_url: string; logo_dark_url: string; favicon_url: string;
  google_books_logo_url: string;
  apple_books_logo_url: string;
  amazon_kindle_logo_url: string;
}

type Tab = "general" | "seo" | "social" | "header-footer" | "footer-links" | "platforms";

export default function WebsiteSettings() {
  const [tab, setTab] = useState<Tab>("general");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
    if (data) {
      setSettings({
        ...data,
        footer_nav_links: data.footer_nav_links ?? [],
        footer_legal_links: data.footer_legal_links ?? [],
        google_books_logo_url: data.google_books_logo_url ?? "",
        apple_books_logo_url: data.apple_books_logo_url ?? "",
        amazon_kindle_logo_url: data.amazon_kindle_logo_url ?? "",
      } as Settings);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!settings) return;
    setSaving(true);
    await supabase.from("site_settings").update(settings).eq("id", 1);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading || !settings) return <Spinner />;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "general",      label: "General",        icon: <Globe size={15} /> },
    { key: "seo",          label: "SEO",             icon: <Search size={15} /> },
    { key: "social",       label: "Social",          icon: <Share2 size={15} /> },
    { key: "header-footer", label: "Header & Footer", icon: <Layout size={15} /> },
    { key: "footer-links", label: "Footer Links",    icon: <Layout size={15} /> },
    { key: "platforms",    label: "Book Platforms",  icon: <BookOpen size={15} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Website Settings"
        description="Configure site metadata, SEO, social links, and footer."
        action={
          <Button onClick={save} disabled={saving}>
            {saved ? <><Check size={16} /> Saved</> : saving ? "Saving…" : <><Save size={16} /> Save changes</>}
          </Button>
        }
      />

      <div className="flex gap-1 mb-6 bg-neutral-100 p-1 rounded-xl w-fit overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <Card className="p-5 sm:p-6 max-w-3xl">
        {tab === "general" && (
          <div className="space-y-4">
            <SectionTitle icon={<Globe size={16} />} title="General" desc="Basic site information." />
            <Input label="Site name" value={settings.site_name} onChange={(v) => setSettings({ ...settings, site_name: v })} />
            <Input label="Tagline" value={settings.tagline} onChange={(v) => setSettings({ ...settings, tagline: v })} />
            <Textarea label="Description" value={settings.description} onChange={(v) => setSettings({ ...settings, description: v })} rows={3} />
            <Input label="Analytics ID" value={settings.analytics_id} onChange={(v) => setSettings({ ...settings, analytics_id: v })} placeholder="e.g. G-XXXXXXXXXX" />

            <div className="pt-2 space-y-4">
              <SectionTitle icon={<ImageIcon size={16} />} title="Branding" desc="Custom logo and favicon URLs. Leave blank to use the default logo." />
              <Input label="Logo URL (light background)" value={settings.logo_light_url ?? ""} onChange={(v) => setSettings({ ...settings, logo_light_url: v })} placeholder="https://…" />
              <Input label="Logo URL (dark background)" value={settings.logo_dark_url ?? ""} onChange={(v) => setSettings({ ...settings, logo_dark_url: v })} placeholder="https://…" />
              <Input label="Favicon URL" value={settings.favicon_url ?? ""} onChange={(v) => setSettings({ ...settings, favicon_url: v })} placeholder="https://…" />
              {(settings.logo_light_url || settings.logo_dark_url) && (
                <div className="flex gap-4">
                  {settings.logo_light_url && (
                    <div className="border border-neutral-200 rounded-lg p-3 bg-white">
                      <p className="text-[10px] text-neutral-400 mb-1">Light logo</p>
                      <img src={settings.logo_light_url} alt="" className="h-8 w-auto" />
                    </div>
                  )}
                  {settings.logo_dark_url && (
                    <div className="border border-neutral-200 rounded-lg p-3 bg-neutral-900">
                      <p className="text-[10px] text-neutral-500 mb-1">Dark logo</p>
                      <img src={settings.logo_dark_url} alt="" className="h-8 w-auto" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "seo" && (
          <div className="space-y-4">
            <SectionTitle icon={<Search size={16} />} title="SEO & Metadata" desc="Control how your site appears in search results." />
            <Input label="SEO title" value={settings.seo_title} onChange={(v) => setSettings({ ...settings, seo_title: v })} />
            <Textarea label="SEO description" value={settings.seo_description} onChange={(v) => setSettings({ ...settings, seo_description: v })} rows={3} />
            <Input label="SEO keywords" value={settings.seo_keywords} onChange={(v) => setSettings({ ...settings, seo_keywords: v })} placeholder="comma, separated, keywords" />
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
              <p className="text-xs font-medium text-neutral-500 mb-2">Search preview</p>
              <p className="text-blue-700 text-sm truncate">{settings.seo_title || settings.site_name}</p>
              <p className="text-green-700 text-xs truncate mt-0.5">https://phantasticpub.com</p>
              <p className="text-neutral-600 text-xs mt-0.5 line-clamp-2">{settings.seo_description}</p>
            </div>
          </div>
        )}

        {tab === "social" && (
          <div className="space-y-4">
            <SectionTitle icon={<Share2 size={16} />} title="Social Links" desc="Your social media profiles — these appear in the footer." />
            <Input label="Twitter / X" value={settings.social_twitter} onChange={(v) => setSettings({ ...settings, social_twitter: v })} placeholder="https://twitter.com/…" />
            <Input label="Instagram" value={settings.social_instagram} onChange={(v) => setSettings({ ...settings, social_instagram: v })} placeholder="https://instagram.com/…" />
            <Input label="Facebook" value={settings.social_facebook} onChange={(v) => setSettings({ ...settings, social_facebook: v })} placeholder="https://facebook.com/…" />
            <Input label="LinkedIn" value={settings.social_linkedin} onChange={(v) => setSettings({ ...settings, social_linkedin: v })} placeholder="https://linkedin.com/…" />
            <Input label="YouTube" value={settings.social_youtube} onChange={(v) => setSettings({ ...settings, social_youtube: v })} placeholder="https://youtube.com/…" />
          </div>
        )}

        {tab === "header-footer" && (
          <div className="space-y-4">
            <SectionTitle icon={<Layout size={16} />} title="Header & Footer" desc="Header CTA and footer contact/copyright details." />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Header CTA text" value={settings.header_cta_text} onChange={(v) => setSettings({ ...settings, header_cta_text: v })} />
              <Input label="Header CTA link" value={settings.header_cta_link} onChange={(v) => setSettings({ ...settings, header_cta_link: v })} />
            </div>
            <Textarea
              label="Footer copyright text"
              value={settings.footer_copyright}
              onChange={(v) => setSettings({ ...settings, footer_copyright: v })}
              rows={2}
            />
            <p className="text-xs text-neutral-500 -mt-2">Use the current year or write it out; a 4-digit year in the text is replaced automatically.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Footer address" value={settings.footer_address} onChange={(v) => setSettings({ ...settings, footer_address: v })} />
              <Input label="Footer email" value={settings.footer_email} onChange={(v) => setSettings({ ...settings, footer_email: v })} />
            </div>
            <Input label="Footer phone" value={settings.footer_phone} onChange={(v) => setSettings({ ...settings, footer_phone: v })} placeholder="+1 (555) 000-0000" />
          </div>
        )}

        {tab === "footer-links" && (
          <div className="space-y-6">
            <LinkListEditor
              title="Footer navigation links"
              desc="Main navigation links shown across the top of the footer."
              links={settings.footer_nav_links}
              onChange={(links) => setSettings({ ...settings, footer_nav_links: links })}
            />
            <div className="border-t border-neutral-100 pt-6">
              <LinkListEditor
                title="Legal links"
                desc="Links shown at the bottom of the footer (Terms, Privacy Policy, etc.)."
                links={settings.footer_legal_links}
                onChange={(links) => setSettings({ ...settings, footer_legal_links: links })}
              />
            </div>
          </div>
        )}

        {tab === "platforms" && (
          <div className="space-y-6">
            <SectionTitle
              icon={<BookOpen size={16} />}
              title="Book Store Platforms"
              desc="Upload logo images for each platform once. They appear automatically on every book page where the corresponding URL is set. Leave blank to use the built-in icon."
            />
            <PlatformLogoField
              label="Google Books"
              hint="Official Google Books logo URL"
              logoUrl={settings.google_books_logo_url ?? ""}
              onChange={(v) => setSettings({ ...settings, google_books_logo_url: v })}
              fallbackColor="#4285F4"
              fallbackText="G"
            />
            <PlatformLogoField
              label="Apple Books"
              hint="Official Apple Books logo URL"
              logoUrl={settings.apple_books_logo_url ?? ""}
              onChange={(v) => setSettings({ ...settings, apple_books_logo_url: v })}
              fallbackColor="#000000"
              fallbackText="A"
            />
            <PlatformLogoField
              label="Amazon Kindle"
              hint="Official Amazon Kindle logo URL"
              logoUrl={settings.amazon_kindle_logo_url ?? ""}
              onChange={(v) => setSettings({ ...settings, amazon_kindle_logo_url: v })}
              fallbackColor="#FF9900"
              fallbackText="K"
            />
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
              <p className="text-xs font-medium text-neutral-700 mb-1">How it works</p>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Set logo image URLs here once. When editing a book, enter the purchase URL for each platform. The logo + URL will appear on the book detail page. If a book has no URL for a platform, that platform's logo is hidden.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function LinkListEditor({
  title, desc, links, onChange,
}: {
  title: string;
  desc: string;
  links: FooterLink[];
  onChange: (links: FooterLink[]) => void;
}) {
  function update(i: number, field: keyof FooterLink, value: string) {
    const next = links.map((l, idx) => idx === i ? { ...l, [field]: value } : l);
    onChange(next);
  }
  function remove(i: number) { onChange(links.filter((_, idx) => idx !== i)); }
  function add() { onChange([...links, { label: "", url: "/" }]); }

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold text-neutral-900">{title}</h4>
        <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
      </div>
      <div className="space-y-2">
        {links.map((link, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={link.label}
              onChange={(e) => update(i, "label", e.target.value)}
              placeholder="Label"
              className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-900 transition-colors"
            />
            <input
              value={link.url}
              onChange={(e) => update(i, "url", e.target.value)}
              placeholder="URL or path"
              className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-900 transition-colors"
            />
            <button
              onClick={() => remove(i)}
              className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={add}
        className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
      >
        <Plus size={15} /> Add link
      </button>
    </div>
  );
}

function SectionTitle({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 pb-2 border-b border-neutral-100">
      <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600">{icon}</div>
      <div>
        <h3 className="font-serif text-base font-bold text-neutral-900">{title}</h3>
        <p className="text-xs text-neutral-500">{desc}</p>
      </div>
    </div>
  );
}

function PlatformLogoField({
  label, hint, logoUrl, onChange, fallbackColor, fallbackText,
}: {
  label: string;
  hint: string;
  logoUrl: string;
  onChange: (v: string) => void;
  fallbackColor: string;
  fallbackText: string;
}) {
  return (
    <div className="flex items-start gap-4">
      {/* Preview swatch */}
      <div className="shrink-0 w-12 h-12 rounded-xl border border-neutral-200 overflow-hidden flex items-center justify-center bg-neutral-50">
        {logoUrl ? (
          <img src={logoUrl} alt={label} className="w-full h-full object-contain p-1" />
        ) : (
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: fallbackColor }}
          >
            {fallbackText}
          </span>
        )}
      </div>
      <div className="flex-1 space-y-1.5">
        <label className="block text-xs font-medium text-neutral-600">{label} Logo URL</label>
        <input
          type="text"
          value={logoUrl}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`https://… (${hint})`}
          className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
        />
        <p className="text-[11px] text-neutral-400">
          Paste a direct image URL. Leave blank to use the built-in {label} icon.
        </p>
      </div>
    </div>
  );
}
