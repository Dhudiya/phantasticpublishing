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

  // Build the public origin from the incoming request
  const reqUrl = new URL(req.url);
  const origin = `${reqUrl.protocol}//${reqUrl.host}`;

  const today = new Date().toISOString().split("T")[0];

  const urls: { loc: string; lastmod?: string; priority: string }[] = [
    { loc: `${origin}/`, priority: "1.0" },
    { loc: `${origin}/books`, priority: "0.9" },
    { loc: `${origin}/authors`, priority: "0.9" },
    { loc: `${origin}/services`, priority: "0.7" },
    { loc: `${origin}/about`, priority: "0.6" },
    { loc: `${origin}/contact`, priority: "0.5" },
  ];

  try {
    const { data: books } = await supabase.from("books").select("slug,updated_at").order("sort_order");
    (books ?? []).forEach((b: { slug: string; updated_at?: string }) => {
      urls.push({ loc: `${origin}/books/${b.slug}`, lastmod: b.updated_at?.split("T")[0], priority: "0.8" });
    });

    const { data: authors } = await supabase.from("authors").select("slug,updated_at").order("sort_order");
    (authors ?? []).forEach((a: { slug: string; updated_at?: string }) => {
      urls.push({ loc: `${origin}/authors/${a.slug}`, lastmod: a.updated_at?.split("T")[0], priority: "0.7" });
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
