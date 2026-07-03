import { BookOpen } from "lucide-react";
import { useSiteSettings } from "../contexts/SiteSettingsContext";

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
  const isDark = variant === "dark" || (variant === "auto" && onDark);

  // Use custom logo images when provided
  const customUrl = isDark ? settings.logo_dark_url : settings.logo_light_url;
  // Fall back to the other URL if only one is configured
  const fallbackUrl = isDark ? settings.logo_light_url : settings.logo_dark_url;
  const logoUrl = customUrl || fallbackUrl;

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={settings.site_name || "Phantastic Publishing"}
        className={`h-9 w-auto object-contain transition-opacity duration-300 ${className}`}
      />
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
