import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import { useSiteSettings, useSiteSettingsLoaded } from "../contexts/SiteSettingsContext";

type Variant = "light" | "dark" | "auto";

interface LogoProps {
  variant?: Variant;
  onDark?: boolean;
  showText?: boolean;
  className?: string;
}

export default function Logo({
  variant = "auto",
  onDark = false,
  showText = true,
  className = "",
}: LogoProps) {
  const settings = useSiteSettings();
  const loaded = useSiteSettingsLoaded();
  const isDark = variant === "dark" || (variant === "auto" && onDark);

  const customUrl = isDark ? settings.logo_dark_url : settings.logo_light_url;
  const fallbackUrl = isDark ? settings.logo_light_url : settings.logo_dark_url;
  const logoUrl = customUrl || fallbackUrl;

  // Track image load state to avoid flash of unstyled image
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    if (!logoUrl) {
      setImgLoaded(false);
      return;
    }
    // If the image is already cached, it loads synchronously
    const img = new Image();
    img.onload = () => setImgLoaded(true);
    img.src = logoUrl;
    if (img.complete) setImgLoaded(true);
  }, [logoUrl]);

  // Reserve space to prevent layout shift — matches the h-9 (36px) logo height
  const placeholder = (
    <span
      className={`inline-block h-9 ${showText ? "w-[140px]" : "w-9"} ${className}`}
      aria-hidden
    />
  );

  // While settings are loading, show placeholder to prevent text flash
  if (!loaded) return placeholder;

  if (logoUrl) {
    return (
      <span className={`inline-flex items-center h-9 ${className}`}>
        {!imgLoaded && <span className="inline-block h-9 w-9" aria-hidden />}
        <img
          src={logoUrl}
          alt={settings.site_name || "Phantastic Publishing"}
          className={`h-9 w-auto object-contain transition-opacity duration-200 ${imgLoaded ? "opacity-100" : "opacity-0 absolute"}`}
        />
      </span>
    );
  }

  // Default icon + text logo
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Mark */}
      <span
        className={`
          w-9 h-9 rounded-xl flex items-center justify-center shrink-0
          transition-all duration-500 ease-out
          ${isDark
            ? "bg-white/15 border border-white/20"
            : "bg-neutral-900"}
        `}
      >
        <BookOpen
          size={18}
          strokeWidth={2.25}
          className={`transition-colors duration-500 ${isDark ? "text-white" : "text-white"}`}
        />
      </span>

      {showText && (
        <span className="flex flex-col leading-tight select-none">
          <span
            className={`font-serif text-[17px] font-bold tracking-tight transition-colors duration-500 ${
              isDark ? "text-white" : "text-neutral-900"
            }`}
          >
            {settings.site_name || "Phantastic"}
          </span>
          <span
            className={`text-[8.5px] uppercase tracking-[0.22em] transition-colors duration-500 ${
              isDark ? "text-white/55" : "text-neutral-400"
            }`}
          >
            {settings.tagline || "Publishing"}
          </span>
        </span>
      )}
    </span>
  );
}
