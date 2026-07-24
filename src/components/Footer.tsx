import { Link } from "react-router-dom";
import { Twitter, Instagram, Facebook, Linkedin, Youtube } from "lucide-react";
import Logo from "./Logo";
import { useSiteSettings } from "../contexts/SiteSettingsContext";
import { safeHref } from "../lib/security";

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  twitter:   <Twitter size={20} />,
  instagram: <Instagram size={20} />,
  facebook:  <Facebook size={20} />,
  linkedin:  <Linkedin size={20} />,
  youtube:   <Youtube size={20} />,
};

function SocialIcon({ url, icon, label }: { url: string; icon: React.ReactNode; label: string }) {
  const safeUrl = safeHref(url);
  if (!safeUrl) return null;
  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="text-neutral-400 hover:text-white transition-colors duration-200"
    >
      {icon}
    </a>
  );
}

function FooterNavLink({ label, url }: { label: string; url: string }) {
  const safeUrl = safeHref(url);
  if (!safeUrl) return null;
  const isExternal = safeUrl.startsWith("http");
  if (isExternal) {
    return (
      <a
        href={safeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-neutral-300 hover:text-white transition-colors duration-200 whitespace-nowrap"
      >
        {label}
      </a>
    );
  }
  return (
    <Link
      to={safeUrl}
      className="text-sm font-medium text-neutral-300 hover:text-white transition-colors duration-200 whitespace-nowrap"
    >
      {label}
    </Link>
  );
}

function FooterLegalLink({ label, url }: { label: string; url: string }) {
  const safeUrl = safeHref(url);
  if (!safeUrl) return null;
  const isExternal = safeUrl.startsWith("http");
  const cls = "text-xs text-neutral-400 hover:text-white transition-colors duration-200 whitespace-nowrap";
  if (isExternal) {
    return (
      <a href={safeUrl} target="_blank" rel="noopener noreferrer" className={cls}>
        {label}
      </a>
    );
  }
  return <Link to={safeUrl} className={cls}>{label}</Link>;
}

export default function Footer() {
  const settings = useSiteSettings();
  const year = new Date().getFullYear();

  const socials = [
    { key: "twitter",   url: settings.social_twitter,   label: "Twitter" },
    { key: "instagram", url: settings.social_instagram, label: "Instagram" },
    { key: "facebook",  url: settings.social_facebook,  label: "Facebook" },
    { key: "linkedin",  url: settings.social_linkedin,  label: "LinkedIn" },
    { key: "youtube",   url: settings.social_youtube,   label: "YouTube" },
  ].filter((s) => s.url);

  const copyright = settings.footer_copyright
    ? settings.footer_copyright.replace(/\d{4}/, String(year))
    : `Copyright ${year} © ${settings.site_name}. All rights reserved.`;

  return (
    <footer className="bg-neutral-950 text-white">
      {/* Top bar: logo | nav | social */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
        <div className="py-10 sm:py-12 md:py-14 flex flex-col lg:flex-row items-center gap-8 lg:gap-6">
          {/* Logo */}
          <div className="shrink-0 lg:w-48">
            <Logo variant="dark" />
          </div>

          {/* Nav links — centered */}
          <nav className="flex-1 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-10">
            {settings.footer_nav_links.map((link, i) => (
              <FooterNavLink key={i} label={link.label} url={link.url} />
            ))}
          </nav>

          {/* Social icons */}
          {socials.length > 0 && (
            <div className="shrink-0 lg:w-48 flex items-center justify-center lg:justify-end gap-5">
              {socials.map((s) => (
                <SocialIcon key={s.key} url={s.url} icon={SOCIAL_ICONS[s.key]} label={s.label} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-800" />

      {/* Bottom: legal links + copyright */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12 py-6 sm:py-8 flex flex-col items-center gap-3">
        {/* Legal links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:gap-x-8">
          {settings.footer_legal_links.map((link, i) => (
            <FooterLegalLink key={i} label={link.label} url={link.url} />
          ))}
        </div>

        {/* Copyright */}
        <p className="text-[11px] sm:text-xs text-neutral-500 uppercase tracking-wider text-center">
          {copyright}
        </p>
      </div>
    </footer>
  );
}
