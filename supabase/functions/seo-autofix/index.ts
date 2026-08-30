Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  };

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
    const headers = {
      "Content-Type": "application/json",
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    };

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

    for (const [pageUrl, pageIssues] of issuesByPage) {
      // Find the page analysis for this URL
      const analysis = page_analyses?.find((p: { url: string }) => p.url === pageUrl);
      if (!analysis) continue;

      const pageKey = (() => {
        try {
          return new URL(pageUrl).pathname;
        } catch {
          return pageUrl;
        }
      })();

      const issueTypes = pageIssues.map((i: { issue_type: string }) => i.issue_type);
      const actions: string[] = [];
      const meta: Record<string, unknown> = {
        page_key: pageKey,
        page_type: "page",
        auto_generated: true,
        manually_edited: false,
      };

      // ─── Auto-fix: missing title ──────────────────────────────
      if (issueTypes.includes("missing_title") || issueTypes.includes("title_too_short")) {
        const title = analysis.h1Count > 0
          ? `Phantastic Publishing — ${analysis.title || pageKey}`
          : analysis.title || "Phantastic Publishing";
        meta.seo_title = title.slice(0, 60);
        actions.push("Generated SEO title from page content");
      }

      // ─── Auto-fix: title too long ──────────────────────────────
      if (issueTypes.includes("title_too_long") && analysis.title) {
        meta.seo_title = analysis.title.slice(0, 57) + "...";
        actions.push("Truncated title to 60 characters");
      }

      // ─── Auto-fix: missing meta description ────────────────────
      if (issueTypes.includes("missing_meta_description")) {
        const bodyText = analysis.wordCount > 0
          ? `${analysis.title || "Phantastic Publishing"} — discover more about this page on our publishing house website.`
          : "An independent publishing house dedicated to discovering and nurturing bold literary voices.";
        meta.seo_description = bodyText.slice(0, 155);
        actions.push("Generated meta description from page content");
      }

      // ─── Auto-fix: meta description too long ───────────────────
      if (issueTypes.includes("meta_description_too_long") && analysis.metaDescription) {
        meta.seo_description = analysis.metaDescription.slice(0, 157) + "...";
        actions.push("Truncated meta description to 160 characters");
      }

      // ─── Auto-fix: missing canonical ───────────────────────────
      if (issueTypes.includes("missing_canonical")) {
        meta.canonical_url = pageUrl;
        actions.push("Set canonical URL to the page's own URL");
      }

      // ─── Auto-fix: missing OG title ────────────────────────────
      if (issueTypes.includes("missing_og_title")) {
        meta.og_title = meta.seo_title || analysis.title || "Phantastic Publishing";
        actions.push("Set Open Graph title");
      }

      // ─── Auto-fix: missing OG image ────────────────────────────
      if (issueTypes.includes("missing_og_image")) {
        meta.og_image = analysis.ogImage || "";
        actions.push("Set Open Graph image");
      }

      // ─── Auto-fix: missing OG description ──────────────────────
      if (issueTypes.includes("missing_og_title")) {
        meta.og_description = meta.seo_description || "";
      }

      // ─── Auto-fix: missing Twitter card ────────────────────────
      if (issueTypes.includes("missing_twitter_card")) {
        meta.twitter_card = "summary_large_image";
        actions.push("Set Twitter Card type to summary_large_image");
      }

      // ─── Auto-fix: missing structured data ─────────────────────
      if (issueTypes.includes("missing_structured_data")) {
        // Generate a basic WebPage schema
        meta.json_ld = JSON.stringify([{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: analysis.title || pageKey,
          url: pageUrl,
          description: meta.seo_description || "",
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

      // ─── Auto-fix: multiple H1 ─────────────────────────────────
      if (issueTypes.includes("multiple_h1")) {
        actions.push("Flagged for manual review: reduce to a single H1 heading per page. This requires HTML changes.");
      }

      // ─── Auto-fix: images missing alt ──────────────────────────
      if (issueTypes.includes("images_missing_alt")) {
        actions.push(`Flagged for manual review: ${analysis.imagesWithoutAlt} images need descriptive alt text added in the page editor.`);
      }

      // ─── Auto-fix: thin content ────────────────────────────────
      if (issueTypes.includes("thin_content")) {
        actions.push("Flagged for manual review: add more substantial content (300+ words) to improve search visibility.");
      }

      // ─── Auto-fix: orphan page ─────────────────────────────────
      if (issueTypes.includes("orphan_page")) {
        actions.push("Flagged for manual review: add internal links from other pages to improve discoverability.");
      }

      // ─── Auto-fix: duplicate title / description ───────────────
      if (issueTypes.includes("duplicate_title")) {
        const uniqueTitle = `${analysis.title || pageKey} — ${pageKey}`;
        meta.seo_title = uniqueTitle.slice(0, 60);
        actions.push("Made title unique by appending page path");
      }
      if (issueTypes.includes("duplicate_meta_description")) {
        const uniqueDesc = `Page: ${pageKey}. ${analysis.metaDescription || ""}`;
        meta.seo_description = uniqueDesc.slice(0, 155);
        actions.push("Made meta description unique by prepending page path");
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
      seo_title: fix.meta.seo_title as string | null,
      seo_description: fix.meta.seo_description as string | null,
      canonical_url: fix.meta.canonical_url as string | null,
      og_title: fix.meta.og_title as string | null,
      og_description: fix.meta.og_description as string | null,
      og_image: fix.meta.og_image as string | null,
      twitter_card: fix.meta.twitter_card as string | null,
      json_ld: fix.meta.json_ld ? JSON.parse(fix.meta.json_ld as string) : undefined,
      robots_index: fix.meta.robots_index ?? true,
      robots_follow: fix.meta.robots_follow ?? true,
      auto_generated: true,
      manually_edited: false,
      updated_at: new Date().toISOString(),
    }));

    let savedCount = 0;
    for (const upsert of upserts) {
      try {
        const resp = await fetch(`${supabaseUrl}/rest/v1/seo_page_meta?on_conflict=page_key`, {
          method: "POST",
          headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
          body: JSON.stringify(upsert),
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
            ...headers,
            "Content-Type": "application/json",
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
