import { useSiteSettings } from "../contexts/SiteSettingsContext";
import { safeHref, safeSrc } from "../lib/security";

// ── Built-in fallback SVG logos ───────────────────────────────────────

interface SvgProps { className?: string }

function GoogleBooksSvg({ className = "" }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21.35 11.1h-9.17v2.73h5.51c-.27 1.57-1.67 4.22-5.51 4.22-3.31 0-6.01-2.74-6.01-6.11 0-3.37 2.7-6.11 6.01-6.11 1.88 0 3.14.8 3.86 1.49l2.64-2.54C16.96 3.42 14.68 2.25 11.7 2.25 6.44 2.25 2.24 6.45 2.24 11.7s4.2 9.45 9.46 9.45c5.45 0 9.09-3.83 9.09-9.22 0-.62-.07-1.09-.14-1.57l-.1-.26z" fill="#4285F4"/>
      <path d="M3.64 7.35l2.98 2.19C7.39 7.57 9.38 6.04 11.7 6.04c1.88 0 3.14.8 3.86 1.49l2.64-2.54C16.96 3.42 14.68 2.25 11.7 2.25c-3.54 0-6.55 1.99-8.06 4.95l-.3.15z" fill="#EA4335"/>
      <path d="M11.7 21.15c2.88 0 5.3-0.95 7.07-2.58l-3.26-2.68c-.89.63-2.09 1.07-3.81 1.07-3.35 0-6.21-2.65-6.01-6.11l-2.92 2.26C4.26 18.3 7.63 21.15 11.7 21.15z" fill="#34A853"/>
      <path d="M21.35 11.1l-.1-.26H11.7v2.73h5.51c-.27 1.4-.98 2.59-2.03 3.36l.01-.01 3.26 2.68c-.21.19 3.26-2.38 3.26-7.37 0-.62-.07-1.09-.14-1.57l-.22.44z" fill="#FBBC05"/>
    </svg>
  );
}

function AppleBooksSvg({ className = "" }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="5.4" fill="#fff"/>
      <rect width="24" height="24" rx="5.4" stroke="#E5E5E5" strokeWidth="0.5"/>
      <path d="M12 4.5C12 4.5 7.5 6 7.5 10.5C7.5 10.5 7.5 17.5 7.5 18.5C7.5 19 8 19.5 8.5 19C9 18.5 10.5 17.5 12 17.5C13.5 17.5 15 18.5 15.5 19C16 19.5 16.5 19 16.5 18.5V10.5C16.5 6 12 4.5 12 4.5Z" fill="#2196F3" opacity="0.9"/>
      <path d="M12 4.5V17.5" stroke="white" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
}

function AmazonKindleSvg({ className = "" }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="5.4" fill="#232F3E"/>
      <path d="M8.5 7v10h1.6V13l3 4h2l-3.4-4.2L14.6 9h-1.9L9.9 13V7H8.5z" fill="#FF9900"/>
      <path d="M6.5 18.5c2.5 1.2 5 1.2 7.5.5 1.5-.4 2.8-1.1 3.8-2" stroke="#FF9900" strokeWidth="0.8" strokeLinecap="round"/>
    </svg>
  );
}

// ── Platform logo (image or SVG fallback) ─────────────────────────────

interface PlatformIconProps {
  customUrl: string;
  label: string;
  fallback: React.ReactNode;
}

function PlatformIcon({ customUrl, label, fallback }: PlatformIconProps) {
  if (customUrl) {
    return (
      <img
        src={customUrl}
        alt={label}
        className="w-5 h-5 object-contain"
      />
    );
  }
  return <>{fallback}</>;
}

// ── Public-facing badge strip ─────────────────────────────────────────

interface PlatformBadgesProps {
  googleBooksUrl?: string;
  appleBooksUrl?: string;
  amazonKindleUrl?: string;
}

/** Renders clickable platform badges. Logos are pulled from global site settings;
 *  built-in SVGs are used when no custom logo is configured.
 *  A badge is only shown if the book has a URL for that platform. */
export default function PlatformBadges({
  googleBooksUrl,
  appleBooksUrl,
  amazonKindleUrl,
}: PlatformBadgesProps) {
  const settings = useSiteSettings();

  const platforms = [
    {
      label: "Google Books",
      url: safeHref(googleBooksUrl),
      icon: (
        <PlatformIcon
          customUrl={safeSrc(settings.google_books_logo_url) ?? ""}
          label="Google Books"
          fallback={<GoogleBooksSvg className="w-5 h-5" />}
        />
      ),
    },
    {
      label: "Apple Books",
      url: safeHref(appleBooksUrl),
      icon: (
        <PlatformIcon
          customUrl={safeSrc(settings.apple_books_logo_url) ?? ""}
          label="Apple Books"
          fallback={<AppleBooksSvg className="w-5 h-5" />}
        />
      ),
    },
    {
      label: "Amazon Kindle",
      url: safeHref(amazonKindleUrl),
      icon: (
        <PlatformIcon
          customUrl={safeSrc(settings.amazon_kindle_logo_url) ?? ""}
          label="Amazon Kindle"
          fallback={<AmazonKindleSvg className="w-5 h-5" />}
        />
      ),
    },
  ].filter((p) => !!p.url);

  if (platforms.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2.5">
      {platforms.map((p) => (
        <a
          key={p.label}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Buy on ${p.label}`}
          className="group inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 rounded-xl hover:border-neutral-800 hover:shadow-md transition-all duration-300 active:scale-[0.97]"
        >
          {p.icon}
          <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900 transition-colors whitespace-nowrap">
            {p.label}
          </span>
        </a>
      ))}
    </div>
  );
}
