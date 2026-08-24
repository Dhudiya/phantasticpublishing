import { BookOpen } from "lucide-react";
import { useSiteSettings } from "../contexts/SiteSettingsContext";
import logoLight from "../assets/logo-dark.svg";
import logoDark from "../assets/logo-light.svg";

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

  const logoUrl = isDark ? logoDark : logoLight;

  if (logoUrl) {
    return (
      <span className={`inline-flex items-center h-9 ${className}`}>
        <img
          src={logoUrl}
          alt={settings.site_name || "Phantastic Publishing"}
          className="h-9 w-auto object-contain"
        />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`
          w-9 h-9 rounded-xl flex items-center justify-center shrink-0
          ${isDark
            ? "bg-white/15 border border-white/20"
            : "bg-neutral-900"}
        `}
      >
        <BookOpen
          size={18}
          strokeWidth={2.25}
          className={isDark ? "text-white" : "text-white"}
        />
      </span>

      {showText && (
        <span className="flex flex-col leading-tight select-none">
          <span
            className={`font-serif text-[17px] font-bold tracking-tight ${
              isDark ? "text-white" : "text-neutral-900"
            }`}
          >
            {settings.site_name || "Phantastic"}
          </span>
          <span
            className={`text-[8.5px] uppercase tracking-[0.22em] ${
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
