ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS footer_nav_links  JSONB NOT NULL DEFAULT '[
    {"label": "Home",     "url": "/"},
    {"label": "Books",    "url": "/books"},
    {"label": "Authors",  "url": "/authors"},
    {"label": "Services", "url": "/services"},
    {"label": "About",    "url": "/about"},
    {"label": "Contact",  "url": "/contact"}
  ]'::jsonb,
  ADD COLUMN IF NOT EXISTS footer_legal_links JSONB NOT NULL DEFAULT '[
    {"label": "Terms of Use",                    "url": "/contact"},
    {"label": "Privacy Policy",                  "url": "/contact"},
    {"label": "Addendum to the Global Privacy Policy", "url": "/contact"},
    {"label": "Interest Based Ads",              "url": "/contact"}
  ]'::jsonb;
