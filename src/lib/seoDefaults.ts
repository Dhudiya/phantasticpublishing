/*
 * Centralized SEO metadata generation.
 *
 * Produces unique, page-specific titles, meta descriptions, and H1 headings
 * for every page type following consistent naming conventions.
 *
 * Priority chain (highest wins):
 *   1. Manually configured seo_page_meta (handled by SEO component)
 *   2. Page-specific data passed via props (book title, author name, etc.)
 *   3. Auto-generated metadata from this module
 *   4. Website-wide fallback from SiteSettings
 */

export type PageType =
  | "home"
  | "book"
  | "author"
  | "books"
  | "authors"
  | "services"
  | "about"
  | "contact"
  | "generic";

interface SeoInput {
  pageType: PageType;
  entityName?: string;
  entityDescription?: string;
  entityImage?: string;
  entityType?: "website" | "article";
  /** For book pages: author name */
  authorName?: string;
  /** For book pages: genre */
  genre?: string;
  /** For book pages: short description */
  shortDescription?: string;
  /** For book pages: year, pages, isbn */
  year?: number;
  pages?: number;
  isbn?: string;
  /** For author pages: bio */
  bio?: string;
  /** For author pages: list of book titles */
  bookTitles?: string[];
  /** For services: list of service names */
  serviceNames?: string[];
  /** Custom page name for generic pages */
  pageName?: string;
}

export interface GeneratedSeo {
  title: string;
  description: string;
  h1: string;
  image?: string;
  type: "website" | "article";
}

const SITE_NAME = "Phantastic Publishing";

/**
 * Truncate text to maxLen characters, ending with "..." if truncated.
 * Tries to break at a word boundary.
 */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const slice = text.slice(0, maxLen - 3);
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace > maxLen * 0.6) {
    return slice.slice(0, lastSpace) + "...";
  }
  return slice + "...";
}

function cleanText(text: string | undefined | null): string {
  if (!text) return "";
  return text.replace(/\s+/g, " ").trim();
}

export function generateSeo(input: SeoInput): GeneratedSeo {
  const name = cleanText(input.entityName);
  const desc = cleanText(input.entityDescription);
  const shortDesc = cleanText(input.shortDescription);
  const bio = cleanText(input.bio);

  switch (input.pageType) {
    case "home":
      return {
        title: `${SITE_NAME} — Bringing Stories to Life`,
        description: truncate(
          `${SITE_NAME} is an independent publishing house dedicated to discovering and nurturing bold literary voices across every genre. Explore our books, authors, and publishing services.`,
          160
        ),
        h1: SITE_NAME,
        type: "website",
      };

    case "book": {
      const bookDesc = shortDesc || desc || `${name} by ${input.authorName || "Phantastic Publishing"}.`;
      const genrePart = input.genre ? ` Genre: ${input.genre}.` : "";
      const yearPart = input.year ? ` Published ${input.year}.` : "";
      return {
        title: `${name} | ${SITE_NAME}`,
        description: truncate(`${bookDesc}${genrePart}${yearPart}`, 160),
        h1: name,
        image: input.entityImage,
        type: "article",
      };
    }

    case "author": {
      const authorBio = bio || shortDesc || desc || `Author at ${SITE_NAME}.`;
      const booksPart = input.bookTitles && input.bookTitles.length > 0
        ? ` Books: ${input.bookTitles.slice(0, 5).join(", ")}.`
        : "";
      return {
        title: `${name} | ${SITE_NAME}`,
        description: truncate(`${authorBio}${booksPart}`, 160),
        h1: name,
        image: input.entityImage,
        type: "article",
      };
    }

    case "books":
      return {
        title: `Books | ${SITE_NAME}`,
        description: truncate(
          `Browse the full catalog of books published by ${SITE_NAME} — fiction, non-fiction, poetry, and more across every genre. Discover your next great read.`,
          160
        ),
        h1: "Books",
        type: "website",
      };

    case "authors":
      return {
        title: `Authors | ${SITE_NAME}`,
        description: truncate(
          `Discover the talented authors published by ${SITE_NAME} — their stories, awards, genres, and published works. Meet the voices behind our books.`,
          160
        ),
        h1: "Authors",
        type: "website",
      };

    case "services": {
      const servicesPart = input.serviceNames && input.serviceNames.length > 0
        ? ` Services include ${input.serviceNames.slice(0, 5).join(", ")}.`
        : "";
      return {
        title: `Publishing Services | ${SITE_NAME}`,
        description: truncate(
          `Explore the publishing services offered by ${SITE_NAME} — editing, design, printing, distribution, and marketing for authors.${servicesPart}`,
          160
        ),
        h1: "Publishing Services",
        type: "website",
      };
    }

    case "about":
      return {
        title: `About ${SITE_NAME} | Independent Publisher`,
        description: truncate(
          `Learn about ${SITE_NAME} — our story, mission, and the team dedicated to bringing bold literary voices to life. An independent publisher committed to great storytelling.`,
          160
        ),
        h1: `About ${SITE_NAME}`,
        type: "website",
      };

    case "contact":
      return {
        title: `Contact ${SITE_NAME}`,
        description: truncate(
          `Get in touch with ${SITE_NAME} for general enquiries, author submissions, careers, and business partnerships. We'd love to hear from you.`,
          160
        ),
        h1: `Contact ${SITE_NAME}`,
        type: "website",
      };

    default: {
      const pageName = name || input.pageName || SITE_NAME;
      return {
        title: `${pageName} | ${SITE_NAME}`,
        description: truncate(`${pageName} — ${SITE_NAME}.`, 160),
        h1: pageName,
        type: "website",
      };
    }
  }
}

/**
 * Generate a canonical URL for a path.
 * Uses HTTPS, strips tracking parameters, and ensures
 * the URL matches the actual page route.
 */
export function generateCanonicalUrl(canonicalPath: string): string {
  const origin = typeof window !== "undefined"
    ? window.location.origin
    : "";
  // Strip query parameters (tracking, etc.) — canonical should be the clean URL
  const cleanPath = canonicalPath.split("?")[0];
  // Ensure no trailing slash except for root
  const normalized = cleanPath === "/" ? "/" : cleanPath.replace(/\/$/, "");
  return `${origin}${normalized}`;
}
