import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import {
  Card, PageHeader, Button, Spinner,
} from "../../admin/ui";
import { Save, Check, Palette, Sun, Moon, Monitor, Upload, Image as ImageIcon } from "lucide-react";
import { validateUploadFile, sanitizeFilename } from "../../lib/security";

interface ThemeSettings {
  theme_mode: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_light_url: string;
  logo_dark_url: string;
  favicon_url: string;
}

export default function ThemeSettings() {
  const [settings, setSettings] = useState<ThemeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("site_settings")
      .select("theme_mode, primary_color, secondary_color, accent_color, logo_light_url, logo_dark_url, favicon_url")
      .eq("id", 1).maybeSingle();
    if (data) setSettings(data as ThemeSettings);
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

  const [logoError, setLogoError] = useState<string | null>(null);

  async function uploadLogo(variant: "logo_light_url" | "logo_dark_url" | "favicon_url", file: File) {
    const validationError = validateUploadFile(file);
    if (validationError) { setLogoError(validationError); return; }
    setLogoError(null);
    const ext = sanitizeFilename(file.name).split(".").pop();
    const path = `logos/${variant}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, {
      upsert: false,
      contentType: file.type,
    });
    if (error) {
      if (error.message.includes("not found") || error.message.includes("Bucket")) {
        await supabase.storage.createBucket("media", { public: true });
        const { error: retryErr } = await supabase.storage.from("media").upload(path, file, {
          upsert: false,
          contentType: file.type,
        });
        if (retryErr) { setLogoError(`Upload failed: ${retryErr.message}`); return; }
      } else { setLogoError(`Upload failed: ${error.message}`); return; }
    }
    const { data: pub } = supabase.storage.from("media").getPublicUrl(path);
    setSettings({ ...settings!, [variant]: pub.publicUrl });
  }

  if (loading || !settings) return <Spinner />;

  const themeOptions = [
    { value: "light", label: "Light", icon: <Sun size={18} /> },
    { value: "dark", label: "Dark", icon: <Moon size={18} /> },
    { value: "system", label: "System", icon: <Monitor size={18} /> },
  ];

  const colorFields = [
    { key: "primary_color", label: "Primary" },
    { key: "secondary_color", label: "Secondary" },
    { key: "accent_color", label: "Accent" },
  ] as const;

  return (
    <div>
      <PageHeader
        title="Theme Settings"
        description="Control appearance, brand colours, and logo variants."
        action={
          <Button onClick={save} disabled={saving}>
            {saved ? <><Check size={16} /> Saved</> : saving ? "Saving…" : <><Save size={16} /> Save changes</>}
          </Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Theme mode */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3 pb-3 mb-4 border-b border-neutral-100">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600"><Palette size={16} /></div>
            <div>
              <h3 className="font-serif text-base font-bold text-neutral-900">Default theme mode</h3>
              <p className="text-xs text-neutral-500">How the site appears to new visitors.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSettings({ ...settings, theme_mode: opt.value })}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  settings.theme_mode === opt.value
                    ? "border-neutral-900 bg-neutral-50"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <span className={settings.theme_mode === opt.value ? "text-neutral-900" : "text-neutral-400"}>{opt.icon}</span>
                <span className="text-xs font-medium text-neutral-700">{opt.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Brand colours */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3 pb-3 mb-4 border-b border-neutral-100">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600"><Palette size={16} /></div>
            <div>
              <h3 className="font-serif text-base font-bold text-neutral-900">Brand colours</h3>
              <p className="text-xs text-neutral-500">Core palette used across the site.</p>
            </div>
          </div>
          <div className="space-y-4">
            {colorFields.map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">{f.label}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings[f.key]}
                    onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                    className="w-12 h-10 rounded-lg border border-neutral-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings[f.key]}
                    onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                    className="flex-1 px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm font-mono focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            {colorFields.map((f) => (
              <div key={f.key} className="flex-1 h-12 rounded-lg" style={{ background: settings[f.key] }} />
            ))}
          </div>
        </Card>

        {/* Logo variants */}
        <Card className="p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-center gap-3 pb-3 mb-4 border-b border-neutral-100">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600"><ImageIcon size={16} /></div>
            <div>
              <h3 className="font-serif text-base font-bold text-neutral-900">Logo variants</h3>
              <p className="text-xs text-neutral-500">Light version for dark backgrounds, dark version for light backgrounds.</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <LogoSlot
              label="Light logo (for dark backgrounds)"
              previewBg="bg-neutral-950"
              url={settings.logo_light_url}
              onUpload={(f) => uploadLogo("logo_light_url", f)}
              onClear={() => setSettings({ ...settings, logo_light_url: "" })}
            />
            <LogoSlot
              label="Dark logo (for light backgrounds)"
              previewBg="bg-white border border-neutral-200"
              url={settings.logo_dark_url}
              onUpload={(f) => uploadLogo("logo_dark_url", f)}
              onClear={() => setSettings({ ...settings, logo_dark_url: "" })}
            />
            <LogoSlot
              label="Favicon"
              previewBg="bg-white border border-neutral-200"
              url={settings.favicon_url}
              onUpload={(f) => uploadLogo("favicon_url", f)}
              onClear={() => setSettings({ ...settings, favicon_url: "" })}
              small
            />
          </div>
          <p className="text-xs text-neutral-400 mt-4">
            If no custom logo is uploaded, the default Phantastic Publishing wordmark is used.
          </p>
        </Card>
      </div>
      {logoError && (
        <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {logoError}
        </div>
      )}
    </div>
  );
}

function LogoSlot({
  label, previewBg, url, onUpload, onClear, small,
}: {
  label: string; previewBg: string; url: string;
  onUpload: (f: File) => void; onClear: () => void; small?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-600 mb-1.5">{label}</label>
      <div className={`${previewBg} rounded-xl flex items-center justify-center ${small ? "h-20" : "h-28"} relative overflow-hidden`}>
        {url ? (
          <img src={url} alt={label} className={small ? "w-8 h-8 object-contain" : "max-h-16 max-w-[80%] object-contain"} />
        ) : (
          <span className="text-xs text-neutral-400">No logo</span>
        )}
      </div>
      <div className="flex gap-2 mt-2">
        <label className="flex-1 cursor-pointer">
          <span className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 hover:border-neutral-300 transition-colors">
            <Upload size={13} /> Upload
          </span>
          <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/avif,image/svg+xml" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
        </label>
        {url && (
          <button onClick={onClear} className="px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
