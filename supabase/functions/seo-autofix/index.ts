import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { issues, page_analyses } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const fixes: {
      page_url: string;
      page_key: string;
      issue_types: string[];
      actions: string[];
      meta: Record<string, unknown>;
    }[] = [];

    // Group issues by page
    const issuesByPage = new Map<string, typeof issues>();
    for (const issue of issues) {
      const url = issue.page_url;
      if (!issuesByPage.has(url)) issuesByPage.set(url, []);
      issuesByPage.get(url)!.push(issue);
    }

    // Load books and authors for generating page-specific metadata
    const [booksResp, authorsResp, servicesResp, settingsResp] = await Promise.all([
      supabase.from("books").select("slug,title,description,short_description,cover_image,author_id,genre,year,pages,isbn"),
      supabase.from("authors").select("slug,name,bio,photo,genre"),
      supabase.from("services").select("title,description"),
      supabase.from("site_settings").select("site_name,seo_description,seo_og_image").eq("id", 1).maybeSingle(),
    ]);

    const books = booksResp.data ?? [];
    const authors = authorsResp.data ?? [];
    const services = servicesResp.data ?? [];
    const siteSettings = settingsResp.data ?? { site_name: "Phantastic Publishing", seo_description: "", seo_og_image: "" };
    const SITE_NAME = siteSettings.site_name || "Phantastic Publishing";

    // Helper: generate page-specific title and description from the path
    function generatePageMeta(pageUrl: string): { title: string; description: string; image: string; jsonLd: object[] | null } {
      let pageKey = "/";
      try { pageKey = new URL(pageUrl).pathname; } catch { pageKey = pageUrl; }

      const image = "";
      const jsonLd: object[] | null = null;

      // Homepage
      if (pageKey === "/") {
        return {
          title: `${SITE_NAME} — Bringing Stories to Life`,
          description: `${SITE_NAME} is an independent publishing house dedicated to discovering and nurturing bold literary voices across every genre. Explore our books, authors, and publishing services.`,
          image: siteSettings.seo_og_image || "",
          jsonLd,
        };
      }

      // Book page
      if (pageKey.startsWith("/books/")) {
        const slug = pageKey.replace("/books/", "");
        const book = books.find((b: { slug: string }) => b.slug === slug);
        if (book) {
          const author = authors.find((a: { id: number }) => a.id === book.author_id);
          const desc = book.short_description || book.description || `${book.title} by ${author?.name || SITE_NAME}.`;
          const genrePart = book.genre ? ` Genre: ${book.genre}.` : "";
          const yearPart = book.year ? ` Published ${book.year}.` : "";
          return {
            title: `${book.title} | ${SITE_NAME}`,
            description: truncate(`${desc}${genrePart}${yearPart}`, 160),
            image: book.cover_image || "",
            jsonLd: [{
              "@context": "https://schema.org",
              "@type": "Book",
              name: book.title,
              description: desc,
              image: book.cover_image || undefined,
              isbn: book.isbn || undefined,
              datePublished: book.year ? String(book.year) : undefined,
              author: { "@type": "Person", name: author?.name || SITE_NAME },
            }],
          };
        }
      }

      // Author page
      if (pageKey.startsWith("/authors/")) {
        const slug = pageKey.replace("/authors/", "");
        const author = authors.find((a: { slug: string }) => a.slug === slug);
        if (author) {
          const authorBooks = books.filter((b: { author_id: number }) => b.author_id === author.id);
          const booksPart = authorBooks.length > 0 ? ` Books: ${authorBooks.slice(0, 5).map((b: { title: string }) => b.title).join(", ")}.` : "";
          return {
            title: `${author.name} | ${SITE_NAME}`,
            description: truncate(`${author.bio || `Author at ${SITE_NAME}.`}${booksPart}`, 160),
            image: author.photo || "",
            jsonLd: [{
              "@context": "https://schema.org",
              "@type": "Person",
              name: author.name,
              description: author.bio || undefined,
              image: author.photo || undefined,
              jobTitle: "Author",
              knowsAbout: author.genre || undefined,
            }],
          };
        }
      }

      // Static pages
      if (pageKey === "/books") {
        return {
          title: `Books | ${SITE_NAME}`,
          description: `Browse the full catalog of books published by ${SITE_NAME} — fiction, non-fiction, poetry, and more across every genre. Discover your next great read.`,
          image, jsonLd,
        };
      }
      if (pageKey === "/authors") {
        return {
          title: `Authors | ${SITE_NAME}`,
          description: `Discover the talented authors published by ${SITE_NAME} — their stories, awards, genres, and published works. Meet the voices behind our books.`,
          image, jsonLd,
        };
      }
      if (pageKey === "/services") {
        const serviceNames = services.map((s: { title: string }) => s.title);
        const servicesPart = serviceNames.length > 0 ? ` Services include ${serviceNames.slice(0, 5).join(", ")}.` : "";
        return {
          title: `Publishing Services | ${SITE_NAME}`,
          description: truncate(`Explore the publishing services offered by ${SITE_NAME} — editing, design, printing, distribution, and marketing for authors.${servicesPart}`, 160),
          image, jsonLd,
        };
      }
      if (pageKey === "/about") {
        return {
          title: `About ${SITE_NAME} | Independent Publisher`,
          description: `Learn about ${SITE_NAME} — our story, mission, and the team dedicated to bringing bold literary voices to life. An independent publisher committed to great storytelling.`,
          image, jsonLd,
        };
      }
      if (pageKey === "/contact") {
        return {
          title: `Contact ${SITE_NAME}`,
          description: `Get in touch with ${SITE_NAME} for general enquiries, author submissions, careers, and business partnerships. We'd love to hear from you.`,
          image, jsonLd,
        };
      }

      // Fallback
      const pageName = pageKey.split("/").pop() || pageKey;
      return {
        title: `${pageName} | ${SITE_NAME}`,
        description: truncate(`${pageName} — ${SITE_NAME}.`, 160),
        image, jsonLd,
      };
    }

    function truncate(text: string, maxLen: number): string {
      if (text.length <= maxLen) return text;
      const slice = text.slice(0, maxLen - 3);
      const lastSpace = slice.lastIndexOf(" ");
      if (lastSpace > maxLen * 0.6) return slice.slice(0, lastSpace) + "...";
      return slice + "...";
    }

    for (const [pageUrl, pageIssues] of issuesByPage) {
      const analysis = page_analyses?.find((p: { url: string }) => p.url === pageUrl);
      if (!analysis) continue;

      let pageKey = "/";
      try { pageKey = new URL(pageUrl).pathname; } catch { pageKey = pageUrl; }

      const issueTypes = pageIssues.map((i: { issue_type: string }) => i.issue_type);
      const actions: string[] = [];
      const meta: Record<string, unknown> = {
        page_key: pageKey,
        page_type: "page",
        auto_generated: true,
        manually_edited: false,
      };

      // Generate page-specific metadata
      const pageMeta = generatePageMeta(pageUrl);

      // ─── Auto-fix: missing/duplicate title ─────────────────────
      if (issueTypes.includes("missing_title") || issueTypes.includes("title_too_short") || issueTypes.includes("duplicate_title")) {
        meta.seo_title = pageMeta.title.slice(0, 60);
        actions.push(`Generated unique SEO title: "${pageMeta.title.slice(0, 60)}"`);
      }

      // ─── Auto-fix: title too long ──────────────────────────────
      if (issueTypes.includes("title_too_long") && analysis.title) {
        meta.seo_title = truncate(analysis.title, 60);
        actions.push("Truncated title to 60 characters");
      }

      // ─── Auto-fix: missing/duplicate meta description ──────────
      if (issueTypes.includes("missing_meta_description") || issueTypes.includes("duplicate_meta_description")) {
        meta.seo_description = pageMeta.description.slice(0, 160);
        actions.push("Generated unique meta description from page content");
      }

      // ─── Auto-fix: meta description too long ───────────────────
      if (issueTypes.includes("meta_description_too_long") && analysis.metaDescription) {
        meta.seo_description = truncate(analysis.metaDescription, 160);
        actions.push("Truncated meta description to 160 characters");
      }

      // ─── Auto-fix: missing canonical ───────────────────────────
      if (issueTypes.includes("missing_canonical")) {
        meta.canonical_url = pageUrl;
        actions.push("Set canonical URL to the page's own URL");
      }

      // ─── Auto-fix: missing OG title ────────────────────────────
      if (issueTypes.includes("missing_og_title")) {
        meta.og_title = meta.seo_title || pageMeta.title;
        actions.push("Set Open Graph title");
      }

      // ─── Auto-fix: missing OG image ────────────────────────────
      if (issueTypes.includes("missing_og_image")) {
        meta.og_image = pageMeta.image || analysis.ogImage || "";
        actions.push("Set Open Graph image from page content");
      }

      // ─── Auto-fix: missing OG description ──────────────────────
      if (issueTypes.includes("missing_og_title")) {
        meta.og_description = meta.seo_description || pageMeta.description;
      }

      // ─── Auto-fix: missing Twitter card ────────────────────────
      if (issueTypes.includes("missing_twitter_card")) {
        meta.twitter_card = "summary_large_image";
        actions.push("Set Twitter Card type to summary_large_image");
      }

      // ─── Auto-fix: missing structured data ─────────────────────
      if (issueTypes.includes("missing_structured_data") && pageMeta.jsonLd) {
        meta.json_ld = JSON.stringify(pageMeta.jsonLd);
        actions.push("Generated page-specific structured data (JSON-LD)");
      } else if (issueTypes.includes("missing_structured_data")) {
        meta.json_ld = JSON.stringify([{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: pageMeta.title,
          url: pageUrl,
          description: pageMeta.description,
        }]);
        actions.push("Generated WebPage structured data (JSON-LD)");
      }

      // ─── Auto-fix: noindex directive ───────────────────────────
      if (issueTypes.includes("noindex_directive")) {
        meta.robots_index = true;
        actions.push("Removed noindex directive (set to index)");
      }

      // ─── Auto-fix: nofollow directive ───────────────────────────
      if (issueTypes.includes("nofollow_directive")) {
        meta.robots_follow = true;
        actions.push("Removed nofollow directive (set to follow)");
      }

      // ─── Manual review items ───────────────────────────────────
      if (issueTypes.includes("multiple_h1")) {
        actions.push("Flagged for manual review: reduce to a single H1 heading per page.");
      }
      if (issueTypes.includes("images_missing_alt")) {
        actions.push(`Flagged for manual review: ${analysis.imagesWithoutAlt} images need descriptive alt text.`);
      }
      if (issueTypes.includes("thin_content")) {
        actions.push("Flagged for manual review: add more substantial content (300+ words) in the admin panel.");
      }
      if (issueTypes.includes("orphan_page")) {
        actions.push("Flagged for manual review: add internal links from other pages to improve discoverability.");
      }

      if (actions.length > 0) {
        fixes.push({
          page_url: pageUrl,
          page_key: pageKey,
          issue_types: issueTypes,
          actions,
          meta,
        });
      }
    }

    // Save fixes to seo_page_meta (upsert by page_key)
    const upserts = fixes.map((fix) => ({
      page_key: fix.meta.page_key as string,
      page_type: fix.meta.page_type as string,
      seo_title: fix.meta.seo_title as string | null ?? undefined,
      seo_description: fix.meta.seo_description as string | null ?? undefined,
      canonical_url: fix.meta.canonical_url as string | null ?? undefined,
      og_title: fix.meta.og_title as string | null ?? undefined,
      og_description: fix.meta.og_description as string | null ?? undefined,
      og_image: fix.meta.og_image as string | null ?? undefined,
      twitter_card: fix.meta.twitter_card as string | null ?? undefined,
      json_ld: fix.meta.json_ld ? JSON.parse(fix.meta.json_ld as string) : undefined,
      robots_index: fix.meta.robots_index ?? true,
      robots_follow: fix.meta.robots_follow ?? true,
      auto_generated: true,
      manually_edited: false,
      updated_at: new Date().toISOString(),
    }));

    let savedCount = 0;
    for (const upsert of upserts) {
      // Remove undefined keys for clean upsert
      const clean = Object.fromEntries(Object.entries(upsert).filter(([, v]) => v !== undefined));
      try {
        const resp = await fetch(`${supabaseUrl}/rest/v1/seo_page_meta?on_conflict=page_key`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify(clean),
        });
        if (resp.ok) savedCount++;
      } catch {
        // Continue even if one fails
      }
    }

    // Mark auto-fixable issues as fixed in seo_issues
    const autoFixableTypes = [
      "missing_title", "title_too_short", "title_too_long",
      "missing_meta_description", "meta_description_too_long",
      "missing_canonical", "missing_og_title", "missing_og_image",
      "missing_twitter_card", "missing_structured_data",
      "noindex_directive", "nofollow_directive",
      "duplicate_title", "duplicate_meta_description",
    ];

    const fixedIssueIds: string[] = [];
    for (const issue of issues) {
      if (autoFixableTypes.includes(issue.issue_type) && issue.id) {
        fixedIssueIds.push(issue.id);
      }
    }

    if (fixedIssueIds.length > 0) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/seo_issues?id=in.(${fixedIssueIds.join(",")})`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            status: "fixed",
            fix_notes: "Auto-fixed by SEO Bot",
            fix_date: new Date().toISOString(),
          }),
        });
      } catch {
        // Non-critical
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      fixes,
      pages_fixed: savedCount,
      issues_auto_fixed: fixedIssueIds.length,
      manual_review_needed: fixes.filter((f) => f.actions.some((a) => a.includes("manual review"))).length,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
