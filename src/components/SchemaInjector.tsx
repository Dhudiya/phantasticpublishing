import { useEffect } from "react";
import { useSiteSettings } from "../contexts/SiteSettingsContext";

/*
 * SchemaInjector — manages JSON-LD <script> tags in the document head.
 *
 * Accepts an array of schema objects and ensures exactly one script tag
 * per schema type exists at any time. On unmount or change, stale scripts
 * are removed and new ones are injected. This prevents duplicate schema
 * across SPA route changes.
 */

const SCRIPT_ID_PREFIX = "json-ld-schema";

interface SchemaInjectorProps {
  schemas: object[];
}

function schemaKey(schema: object): string {
  const s = schema as Record<string, unknown>;
  return s["@type"] as string || "generic";
}

export default function SchemaInjector({ schemas }: SchemaInjectorProps) {
  const settings = useSiteSettings();

  useEffect(() => {
    // Build the full schema list, always including Organization + WebSite
    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: settings.site_name || "Phantastic Publishing",
      description: settings.seo_description || settings.description || "",
      url: typeof window !== "undefined" ? window.location.origin : "",
      logo: settings.seo_og_image || "",
    };

    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: settings.site_name || "Phantastic Publishing",
      url: typeof window !== "undefined" ? window.location.origin : "",
    };

    const allSchemas = [orgSchema, websiteSchema, ...schemas];

    // Remove all existing schema scripts we injected
    document.querySelectorAll(`script[id^="${SCRIPT_ID_PREFIX}"]`).forEach((el) => {
      el.remove();
    });

    // Inject new ones
    allSchemas.forEach((schema) => {
      const key = schemaKey(schema);
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = `${SCRIPT_ID_PREFIX}-${key}`;
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      document.querySelectorAll(`script[id^="${SCRIPT_ID_PREFIX}"]`).forEach((el) => {
        el.remove();
      });
    };
  }, [schemas, settings.site_name, settings.seo_description, settings.description, settings.seo_og_image]);

  return null;
}

/*
 * Schema builder helpers — produce valid JSON-LD objects for each page type.
 */

export function buildBookSchema(book: {
  title: string;
  description: string;
  cover_image: string;
  isbn: string;
  year: number;
  author_name: string;
}): object {
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    description: book.description,
    image: book.cover_image || undefined,
    isbn: book.isbn || undefined,
    datePublished: book.year ? String(book.year) : undefined,
    author: {
      "@type": "Person",
      name: book.author_name,
    },
  };
}

export function buildPersonSchema(author: {
  name: string;
  bio: string;
  photo: string;
  genre: string;
  website?: string | null;
  twitter?: string | null;
  instagram?: string | null;
}): object {
  const sameAs: string[] = [];
  if (author.website) sameAs.push(author.website);
  if (author.twitter) sameAs.push(author.twitter);
  if (author.instagram) sameAs.push(author.instagram);

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    description: author.bio,
    image: author.photo || undefined,
    jobTitle: "Author",
    knowsAbout: author.genre || undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };
}

export function buildBreadcrumbSchema(
  items: { name: string; url: string }[]
): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildArticleSchema(article: {
  title: string;
  description: string;
  image: string;
  datePublished: string;
  authorName: string;
}): object {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: article.image || undefined,
    datePublished: article.datePublished,
    author: {
      "@type": "Person",
      name: article.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "Phantastic Publishing",
    },
  };
}
