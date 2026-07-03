import { BookOpen } from "lucide-react";
import { useSiteSettings } from "../contexts/SiteSettingsContext";

type Variant = "light" | "dark" | "auto";

interface LogoProps {
  variant?: Variant;
  /** When variant="auto", set true if the logo sits on a dark background */
  onDark?: boolean;
  showText?: boolean;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  subtextClassName?: string;
}

export default function Logo({
  variant = "auto",
  onDark = false,
  showText = true,
  className = "",
  iconClassName = "",
  textClassName = "",
  subtextClassName = "",
}: LogoProps) {
  const settings = useSiteSettings();
  const isDark = variant === "dark" || (variant === "auto" && onDark);

  const customLogo = isDark ? settings.logo_dark_url : settings.logo_light_url;
  const siteName = settings.site_name || "Phantastic";

  if (customLogo) {
    return (
      <img
        src={customLogo}
        alt={siteName}
        className={`h-9 w-auto object-contain ${className}`}
      />
    );
  }

  const markBg = isDark ? "bg-white/15 backdrop-blur-sm border border-white/25" : "bg-neutral-900";
  const markIcon = isDark ? "text-white" : "text-white";
  const title = isDark ? "text-white" : "text-neutral-900";
  const sub = isDark ? "text-white/60" : "text-neutral-400";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${markBg} ${iconClassName}`}
      >
        <BookOpen size={18} className={markIcon} strokeWidth={2.25} />
      </span>
      {showText && (
        <span className="flex flex-col leading-tight">
          <span className={`font-serif text-lg font-bold tracking-tight transition-colors duration-300 ${title} ${textClassName}`}>
            {siteName}
          </span>
          <span className={`text-[9px] uppercase tracking-[0.2em] transition-colors duration-300 ${sub} ${subtextClassName}`}>
            {settings.tagline || "Publishing"}
          </span>
        </span>
      )}
    </span>
  );
}
