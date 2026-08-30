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
    const body = await req.json();

    // Extract the visitor's real IP from multiple possible headers.
    // Supabase proxies through a CDN; the real client IP may be in
    // different headers depending on the layer.
    const forward = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const cfConnecting = req.headers.get("cf-connecting-ip");
    const flyClient = req.headers.get("fly-client-ip");

    let clientIp = "";
    if (forward) {
      // x-forwarded-for is a comma-separated chain; first entry is the client
      clientIp = forward.split(",")[0].trim();
    } else if (cfConnecting) {
      clientIp = cfConnecting.trim();
    } else if (flyClient) {
      clientIp = flyClient.trim();
    } else if (realIp) {
      clientIp = realIp.trim();
    }

    // Filter out loopback and private/internal IPs
    const isInvalidIp = (ip: string): boolean => {
      if (!ip) return true;
      if (ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1") return true;
      if (ip.startsWith("10.") || ip.startsWith("172.16.") || ip.startsWith("192.168.")) return true;
      if (ip.startsWith("169.254.")) return true; // link-local
      return false;
    };

    // Geo-lookup using ipapi.co (free, HTTPS, no API key required)
    let country: string | null = null;
    let region: string | null = null;
    let city: string | null = null;

    if (clientIp && !isInvalidIp(clientIp)) {
      // Try ipapi.co first
      try {
        const geoResp = await fetch(`https://ipapi.co/${clientIp}/json/`, {
          headers: { "Accept": "application/json" },
          signal: AbortSignal.timeout(5000),
        });
        if (geoResp.ok) {
          const geo = await geoResp.json();
          if (geo.country_name) {
            country = geo.country_name;
            region = geo.region || null;
            city = geo.city || null;
          }
        }
      } catch {
        // First provider failed, try fallback
      }

      // Fallback: geojs.io
      if (!country) {
        try {
          const geoResp2 = await fetch(`https://get.geojs.io/v1/ip/geo/${clientIp}.json`, {
            signal: AbortSignal.timeout(5000),
          });
          if (geoResp2.ok) {
            const geo2 = await geoResp2.json();
            country = geo2.country || null;
            region = geo2.region || null;
            city = geo2.city || null;
          }
        } catch {
          // Both geo providers failed — continue without geo data
        }
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

    // Insert using the Supabase JS client with the service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { error: insertError } = await supabase
      .from("analytics_events")
      .insert(event);

    if (insertError) {
      return new Response(JSON.stringify({ error: "Insert failed", detail: insertError.message }), {
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
