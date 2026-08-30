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
    const body = await req.json();

    // Get the visitor's IP from request headers
    const forward = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const clientIp = forward ? forward.split(",")[0].trim() : realIp || "";

    // Geo-lookup using ip-api.com (free, no API key, 45 req/min limit)
    let country: string | null = null;
    let region: string | null = null;
    let city: string | null = null;

    if (clientIp && clientIp !== "127.0.0.1" && clientIp !== "::1") {
      try {
        const geoResp = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,country,regionName,city`, {
          signal: AbortSignal.timeout(3000),
        });
        if (geoResp.ok) {
          const geo = await geoResp.json();
          if (geo.status === "success") {
            country = geo.country || null;
            region = geo.regionName || null;
            city = geo.city || null;
          }
        }
      } catch {
        // Geo lookup failed — continue without geo data
      }
    }

    // Build the event payload with enriched geo data
    const event = {
      event_type: body.event_type || "page_view",
      path: body.path || "/",
      referrer: body.referrer || null,
      session_id: body.session_id || null,
      user_agent: body.user_agent || null,
      visitor_id: body.visitor_id || null,
      device_type: body.device_type || null,
      browser: body.browser || null,
      os: body.os || null,
      country,
      region,
      city,
      page_title: body.page_title || null,
      session_start: body.session_start || null,
      metadata: body.metadata || {},
    };

    // Insert via service role key (bypasses RLS for the insert)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const insertResp = await fetch(`${supabaseUrl}/rest/v1/analytics_events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(event),
    });

    if (!insertResp.ok) {
      const errText = await insertResp.text();
      return new Response(JSON.stringify({ error: "Insert failed", detail: errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
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
