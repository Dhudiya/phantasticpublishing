import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const reqUrl = new URL(req.url);
  const origin = `${reqUrl.protocol}//${reqUrl.host}`;

  const urls: { loc: string; lastmod?: string; priority: string }[] = [
    { loc: `${origin}/`, priority: "1.0" },
    { loc: `${origin}/books`, priority: "0.9" },
    { loc: `${origin}/authors`, priority: "0.9" },
    { loc: `${origin}/services`, priority: "0.7" },
    { loc: `${origin}/about`, priority: "0.6" },
    { loc: `${origin}/contact`, priority: "0.5" },
  ];

  try {
    // Load seo_page_meta to check for noindex pages
    const [booksResp, authorsResp, metaResp] = await Promise.all([
      supabase.from("books").select("slug,updated_at").order("sort_order"),
      supabase.from("authors").select("slug,updated_at").order("sort_order"),
      supabase.from("seo_page_meta").select("page_key,robots_index"),
    ]);

    // Build a set of noindex page keys to exclude
    const noindexPaths = new Set<string>();
    (metaResp.data ?? []).forEach((row: { page_key: string; robots_index: boolean | null }) => {
      if (row.robots_index === false) noindexPaths.add(row.page_key);
    });

    // Add book URLs (skip noindex or missing slug)
    (booksResp.data ?? []).forEach((b: { slug: string; updated_at?: string }) => {
      const path = `/books/${b.slug}`;
      if (noindexPaths.has(path)) return;
      urls.push({
        loc: `${origin}${path}`,
        lastmod: b.updated_at?.split("T")[0],
        priority: "0.8",
      });
    });

    // Add author URLs (skip noindex or missing slug)
    (authorsResp.data ?? []).forEach((a: { slug: string; updated_at?: string }) => {
      const path = `/authors/${a.slug}`;
      if (noindexPaths.has(path)) return;
      urls.push({
        loc: `${origin}${path}`,
        lastmod: a.updated_at?.split("T")[0],
        priority: "0.7",
      });
    });
  } catch {
    // If DB fails, still return static pages
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
