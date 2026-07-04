interface PlatformLogoProps {
  className?: string;
}

/** Google Books "G" logo */
export function GoogleBooksLogo({ className = "" }: PlatformLogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#4285F4"/>
      <path d="M12 2v10l6.5-3.5C17.5 5.5 15 2 12 2z" fill="#EA4335"/>
      <path d="M2 12c0 1.7.43 3.3 1.18 4.7L12 12 3.18 7.3C2.43 8.7 2 10.3 2 12z" fill="#FBBC05"/>
      <path d="M12 12l6.5 6.5C20.5 16.5 22 14.5 22 12c0-1.7-.43-3.3-1.18-4.7L12 12z" fill="#34A853"/>
      <path d="M12 22c2.5 0 4.8-.9 6.5-2.5L12 12 5.5 19.5C7.2 21.1 9.5 22 12 22z" fill="#4285F4"/>
    </svg>
  );
}

/** Apple Books logo — open book with Apple-style gradient */
export function AppleBooksLogo({ className = "" }: PlatformLogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#000"/>
      <path d="M12 7c-1.2-.6-3-.8-4.5-.5-.6.1-1 .5-1 1.1v8.2c0 .6.5 1 1 .9 1.5-.3 3.3-.1 4.5.5 1.2-.6 3-.8 4.5-.5.5.1 1-.3 1-.9V7.6c0-.6-.4-1-1-1.1-1.5-.3-3.3-.1-4.5.5z" fill="#fff"/>
      <path d="M12 7.5v9" stroke="#000" strokeWidth="0.8" strokeLinecap="round"/>
    </svg>
  );
}

/** Amazon Kindle logo — "k" on dark background */
export function AmazonKindleLogo({ className = "" }: PlatformLogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#232F3E"/>
      <path d="M8 7v10h1.8v-4.2l3.5 4.2h2.2l-3.8-4.5 3.5-4.5h-2l-3.4 4.2V7H8z" fill="#FF9900"/>
    </svg>
  );
}

export interface PlatformLink {
  url: string;
  label: string;
  logo: React.ReactNode;
}

interface PlatformBadgesProps {
  googleBooksUrl?: string;
  appleBooksUrl?: string;
  amazonKindleUrl?: string;
}

/** Renders platform badges — only shows logos for platforms that have a URL configured */
export default function PlatformBadges({
  googleBooksUrl,
  appleBooksUrl,
  amazonKindleUrl,
}: PlatformBadgesProps) {
  const platforms: PlatformLink[] = [];
  if (googleBooksUrl) platforms.push({ url: googleBooksUrl, label: "Google Books", logo: <GoogleBooksLogo className="w-5 h-5" /> });
  if (appleBooksUrl) platforms.push({ url: appleBooksUrl, label: "Apple Books", logo: <AppleBooksLogo className="w-5 h-5" /> });
  if (amazonKindleUrl) platforms.push({ url: amazonKindleUrl, label: "Amazon Kindle", logo: <AmazonKindleLogo className="w-5 h-5" /> });

  if (platforms.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2.5 mt-4 sm:mt-5 md:mt-6">
      {platforms.map((p) => (
        <a
          key={p.label}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Buy on ${p.label}`}
          className="group inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 rounded-xl hover:border-neutral-900 hover:shadow-md transition-all duration-300 active:scale-[0.97]"
        >
          {p.logo}
          <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900 transition-colors">
            {p.label}
          </span>
        </a>
      ))}
    </div>
  );
}
