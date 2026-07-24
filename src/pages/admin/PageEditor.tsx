import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import {
  Card, PageHeader, Button, Input, Textarea, Select, Modal, Badge, Spinner,
} from "../../admin/ui";
import {
  PAGE_SLUGS, PAGE_LABELS, PageSlug,
  pageContentDefaults, PageContentMap,
  HomeContent,
  AboutContent,
  BooksContent,
  AuthorsContent,
  ServicesContent,
  ContactContent,
} from "../../lib/pageContentDefaults";
import { Plus, Pencil, Trash2, FileText, ArrowLeft, Save } from "lucide-react";

interface PageContentRow {
  id: string;
  page_slug: string;
  content: Record<string, unknown>;
  updated_at: string;
}

export default function PageEditor() {
  const [rows, setRows] = useState<PageContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlug, setEditingSlug] = useState<PageSlug | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("page_content")
      .select("*")
      .order("page_slug", { ascending: true });
    setRows((data as PageContentRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function resetToDefaults(slug: PageSlug) {
    if (!confirm(`Reset "${PAGE_LABELS[slug]}" page content to defaults? Any custom edits will be lost.`)) return;
    const defaults = pageContentDefaults[slug];
    await supabase.from("page_content")
      .upsert({ page_slug: slug, content: defaults as unknown as Record<string, unknown> }, { onConflict: "page_slug" });
    load();
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Site Pages"
        description="Edit the content, headings, images, and CTAs of every public page."
      />

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <p className="text-sm text-neutral-500">{PAGE_SLUGS.length} editable pages</p>
        </div>
        <div className="divide-y divide-neutral-100">
          {PAGE_SLUGS.map((slug) => {
            const row = rows.find((r) => r.page_slug === slug);
            const hasCustom = !!row;
            return (
              <div key={slug} className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900">{PAGE_LABELS[slug]}</p>
                  <p className="text-xs text-neutral-500 truncate">/{slug === "home" ? "" : slug}</p>
                </div>
                <Badge color={hasCustom ? "green" : "neutral"}>
                  {hasCustom ? "Customized" : "Default"}
                </Badge>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingSlug(slug)}
                    className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Edit content"
                  >
                    <Pencil size={15} />
                  </button>
                  {hasCustom && (
                    <button
                      onClick={() => resetToDefaults(slug)}
                      className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Reset to defaults"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {editingSlug && (
        <PageContentEditor
          slug={editingSlug}
          existing={rows.find((r) => r.page_slug === editingSlug) ?? null}
          onClose={() => setEditingSlug(null)}
          onSaved={() => { setEditingSlug(null); load(); }}
        />
      )}
    </div>
  );
}

// ─── Page content editor ─────────────────────────────────────────
function PageContentEditor({
  slug, existing, onClose, onSaved,
}: {
  slug: PageSlug;
  existing: PageContentRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [content, setContent] = useState<PageContentMap[PageSlug]>(
    pageContentDefaults[slug]
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing?.content) {
      // Merge DB content over defaults
      const merged = { ...pageContentDefaults[slug], ...(existing.content as object) };
      setContent(merged as PageContentMap[PageSlug]);
    } else {
      setContent(pageContentDefaults[slug]);
    }
  }, [slug, existing]);

  async function save() {
    setSaving(true);
    await supabase.from("page_content")
      .upsert({ page_slug: slug, content: content as unknown as Record<string, unknown> }, { onConflict: "page_slug" });
    setSaving(false);
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title={`Edit "${PAGE_LABELS[slug]}" Page`} size="lg">
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-xs text-neutral-500 bg-neutral-50 px-3 py-2 rounded-lg">
          <ArrowLeft size={12} />
          <span>Editing live site content. Save to publish.</span>
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-1 -mr-1 space-y-5">
          {slug === "home" && <HomeEditor content={content as HomeContent} onChange={(c) => setContent(c as PageContentMap[PageSlug])} />}
          {slug === "about" && <AboutEditor content={content as AboutContent} onChange={(c) => setContent(c as PageContentMap[PageSlug])} />}
          {slug === "books" && <BooksEditor content={content as BooksContent} onChange={(c) => setContent(c as PageContentMap[PageSlug])} />}
          {slug === "authors" && <AuthorsEditor content={content as AuthorsContent} onChange={(c) => setContent(c as PageContentMap[PageSlug])} />}
          {slug === "services" && <ServicesEditor content={content as ServicesContent} onChange={(c) => setContent(c as PageContentMap[PageSlug])} />}
          {slug === "contact" && <ContactEditor content={content as ContactContent} onChange={(c) => setContent(c as PageContentMap[PageSlug])} />}
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-neutral-100">
          <Button variant="ghost" onClick={() => setContent(pageContentDefaults[slug])}>
            Reset to defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              <Save size={14} /> {saving ? "Saving…" : "Save & Publish"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Section helper ──────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-neutral-200 rounded-xl p-4 space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{title}</h4>
      {children}
    </div>
  );
}

function ImageInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Input label={label} value={value} onChange={onChange} placeholder="https://..." />
      {value && (
        <div className="mt-2 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50 h-24">
          <img src={value} alt="" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}

// ─── Home editor ─────────────────────────────────────────────────
function HomeEditor({ content, onChange }: { content: HomeContent; onChange: (c: HomeContent) => void }) {
  const set = (patch: Partial<HomeContent>) => onChange({ ...content, ...patch });
  return (
    <>
      <Section title="Hero Section">
        <Input label="Eyebrow" value={content.hero.eyebrow} onChange={(v) => set({ hero: { ...content.hero, eyebrow: v } })} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Title line 1" value={content.hero.title_line_1} onChange={(v) => set({ hero: { ...content.hero, title_line_1: v } })} />
          <Input label="Title line 2" value={content.hero.title_line_2} onChange={(v) => set({ hero: { ...content.hero, title_line_2: v } })} />
        </div>
        <Textarea label="Subtitle" value={content.hero.subtitle} onChange={(v) => set({ hero: { ...content.hero, subtitle: v } })} rows={3} />
        <ImageInput label="Background image URL" value={content.hero.background_image} onChange={(v) => set({ hero: { ...content.hero, background_image: v } })} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Primary button text" value={content.hero.cta_primary_text} onChange={(v) => set({ hero: { ...content.hero, cta_primary_text: v } })} />
          <Input label="Primary button link" value={content.hero.cta_primary_link} onChange={(v) => set({ hero: { ...content.hero, cta_primary_link: v } })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Secondary button text" value={content.hero.cta_secondary_text} onChange={(v) => set({ hero: { ...content.hero, cta_secondary_text: v } })} />
          <Input label="Secondary button link" value={content.hero.cta_secondary_link} onChange={(v) => set({ hero: { ...content.hero, cta_secondary_link: v } })} />
        </div>
      </Section>

      <Section title="Featured Books Section">
        <Input label="Eyebrow" value={content.featured_books.eyebrow} onChange={(v) => set({ featured_books: { ...content.featured_books, eyebrow: v } })} />
        <Input label="Heading" value={content.featured_books.heading} onChange={(v) => set({ featured_books: { ...content.featured_books, heading: v } })} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="View all text" value={content.featured_books.view_all_text} onChange={(v) => set({ featured_books: { ...content.featured_books, view_all_text: v } })} />
          <Input label="View all link" value={content.featured_books.view_all_link} onChange={(v) => set({ featured_books: { ...content.featured_books, view_all_link: v } })} />
        </div>
      </Section>

      <Section title="About Intro Section">
        <Input label="Eyebrow" value={content.about_intro.eyebrow} onChange={(v) => set({ about_intro: { ...content.about_intro, eyebrow: v } })} />
        <Input label="Heading" value={content.about_intro.heading} onChange={(v) => set({ about_intro: { ...content.about_intro, heading: v } })} />
        <StringListEditor
          label="Paragraphs"
          items={content.about_intro.paragraphs}
          onChange={(paragraphs) => set({ about_intro: { ...content.about_intro, paragraphs } })}
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Link text" value={content.about_intro.link_text} onChange={(v) => set({ about_intro: { ...content.about_intro, link_text: v } })} />
          <Input label="Link URL" value={content.about_intro.link_url} onChange={(v) => set({ about_intro: { ...content.about_intro, link_url: v } })} />
        </div>
        <ImageInput label="Image URL" value={content.about_intro.image} onChange={(v) => set({ about_intro: { ...content.about_intro, image: v } })} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Stat value" value={content.about_intro.stat_value} onChange={(v) => set({ about_intro: { ...content.about_intro, stat_value: v } })} />
          <Input label="Stat label" value={content.about_intro.stat_label} onChange={(v) => set({ about_intro: { ...content.about_intro, stat_label: v } })} />
        </div>
      </Section>

      <Section title="Services Overview Section">
        <Input label="Eyebrow" value={content.services_overview.eyebrow} onChange={(v) => set({ services_overview: { ...content.services_overview, eyebrow: v } })} />
        <Input label="Heading" value={content.services_overview.heading} onChange={(v) => set({ services_overview: { ...content.services_overview, heading: v } })} />
        <Textarea label="Subtitle" value={content.services_overview.subtitle} onChange={(v) => set({ services_overview: { ...content.services_overview, subtitle: v } })} rows={2} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="View all text" value={content.services_overview.view_all_text} onChange={(v) => set({ services_overview: { ...content.services_overview, view_all_text: v } })} />
          <Input label="View all link" value={content.services_overview.view_all_link} onChange={(v) => set({ services_overview: { ...content.services_overview, view_all_link: v } })} />
        </div>
      </Section>

      <Section title="Featured Authors Section">
        <Input label="Eyebrow" value={content.featured_authors.eyebrow} onChange={(v) => set({ featured_authors: { ...content.featured_authors, eyebrow: v } })} />
        <Input label="Heading" value={content.featured_authors.heading} onChange={(v) => set({ featured_authors: { ...content.featured_authors, heading: v } })} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="View all text" value={content.featured_authors.view_all_text} onChange={(v) => set({ featured_authors: { ...content.featured_authors, view_all_text: v } })} />
          <Input label="View all link" value={content.featured_authors.view_all_link} onChange={(v) => set({ featured_authors: { ...content.featured_authors, view_all_link: v } })} />
        </div>
      </Section>

      <Section title="Testimonials Section">
        <Input label="Eyebrow" value={content.testimonials.eyebrow} onChange={(v) => set({ testimonials: { ...content.testimonials, eyebrow: v } })} />
        <Input label="Heading" value={content.testimonials.heading} onChange={(v) => set({ testimonials: { ...content.testimonials, heading: v } })} />
      </Section>

      <Section title="CTA Section">
        <Input label="Heading" value={content.cta.heading} onChange={(v) => set({ cta: { ...content.cta, heading: v } })} />
        <Textarea label="Body" value={content.cta.body} onChange={(v) => set({ cta: { ...content.cta, body: v } })} rows={3} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Button text" value={content.cta.button_text} onChange={(v) => set({ cta: { ...content.cta, button_text: v } })} />
          <Input label="Button link" value={content.cta.button_link} onChange={(v) => set({ cta: { ...content.cta, button_link: v } })} />
        </div>
      </Section>
    </>
  );
}

// ─── About editor ────────────────────────────────────────────────
function AboutEditor({ content, onChange }: { content: AboutContent; onChange: (c: AboutContent) => void }) {
  const set = (patch: Partial<AboutContent>) => onChange({ ...content, ...patch });
  return (
    <>
      <Section title="Hero Section">
        <Input label="Eyebrow" value={content.hero.eyebrow} onChange={(v) => set({ hero: { ...content.hero, eyebrow: v } })} />
        <Input label="Title" value={content.hero.title} onChange={(v) => set({ hero: { ...content.hero, title: v } })} />
        <Textarea label="Subtitle" value={content.hero.subtitle} onChange={(v) => set({ hero: { ...content.hero, subtitle: v } })} rows={2} />
        <ImageInput label="Background image URL" value={content.hero.background_image} onChange={(v) => set({ hero: { ...content.hero, background_image: v } })} />
      </Section>

      <Section title="Company Story">
        <Input label="Heading" value={content.story.heading} onChange={(v) => set({ story: { ...content.story, heading: v } })} />
        <StringListEditor
          label="Paragraphs"
          items={content.story.paragraphs}
          onChange={(paragraphs) => set({ story: { ...content.story, paragraphs } })}
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <ImageInput label="Image 1 URL" value={content.story.image_1} onChange={(v) => set({ story: { ...content.story, image_1: v } })} />
          <ImageInput label="Image 2 URL" value={content.story.image_2} onChange={(v) => set({ story: { ...content.story, image_2: v } })} />
        </div>
      </Section>

      <Section title="Mission & Vision">
        <div className="space-y-3">
          <div className="bg-neutral-50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-neutral-600">Mission</p>
            <Input label="Eyebrow" value={content.mission_vision.mission.eyebrow} onChange={(v) => set({ mission_vision: { ...content.mission_vision, mission: { ...content.mission_vision.mission, eyebrow: v } } })} />
            <Input label="Heading" value={content.mission_vision.mission.heading} onChange={(v) => set({ mission_vision: { ...content.mission_vision, mission: { ...content.mission_vision.mission, heading: v } } })} />
            <Textarea label="Body" value={content.mission_vision.mission.body} onChange={(v) => set({ mission_vision: { ...content.mission_vision, mission: { ...content.mission_vision.mission, body: v } } })} rows={2} />
          </div>
          <div className="bg-neutral-50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-neutral-600">Vision</p>
            <Input label="Eyebrow" value={content.mission_vision.vision.eyebrow} onChange={(v) => set({ mission_vision: { ...content.mission_vision, vision: { ...content.mission_vision.vision, eyebrow: v } } })} />
            <Input label="Heading" value={content.mission_vision.vision.heading} onChange={(v) => set({ mission_vision: { ...content.mission_vision, vision: { ...content.mission_vision.vision, heading: v } } })} />
            <Textarea label="Body" value={content.mission_vision.vision.body} onChange={(v) => set({ mission_vision: { ...content.mission_vision, vision: { ...content.mission_vision.vision, body: v } } })} rows={2} />
          </div>
        </div>
      </Section>

      <Section title="Why Choose Us">
        <Input label="Eyebrow" value={content.why_choose.eyebrow} onChange={(v) => set({ why_choose: { ...content.why_choose, eyebrow: v } })} />
        <Input label="Heading" value={content.why_choose.heading} onChange={(v) => set({ why_choose: { ...content.why_choose, heading: v } })} />
        <IconItemListEditor
          items={content.why_choose.items}
          onChange={(items) => set({ why_choose: { ...content.why_choose, items } })}
        />
      </Section>

      <Section title="Team Section">
        <Input label="Eyebrow" value={content.team.eyebrow} onChange={(v) => set({ team: { ...content.team, eyebrow: v } })} />
        <Input label="Heading" value={content.team.heading} onChange={(v) => set({ team: { ...content.team, heading: v } })} />
      </Section>

      <Section title="CTA Section">
        <Input label="Heading" value={content.cta.heading} onChange={(v) => set({ cta: { ...content.cta, heading: v } })} />
        <Textarea label="Body" value={content.cta.body} onChange={(v) => set({ cta: { ...content.cta, body: v } })} rows={2} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Button text" value={content.cta.button_text} onChange={(v) => set({ cta: { ...content.cta, button_text: v } })} />
          <Input label="Button link" value={content.cta.button_link} onChange={(v) => set({ cta: { ...content.cta, button_link: v } })} />
        </div>
      </Section>
    </>
  );
}

// ─── Books editor ────────────────────────────────────────────────
function BooksEditor({ content, onChange }: { content: BooksContent; onChange: (c: BooksContent) => void }) {
  const set = (patch: Partial<BooksContent>) => onChange({ ...content, ...patch });
  return (
    <Section title="Hero Section">
      <Input label="Eyebrow" value={content.hero.eyebrow} onChange={(v) => set({ hero: { ...content.hero, eyebrow: v } })} />
      <Input label="Title" value={content.hero.title} onChange={(v) => set({ hero: { ...content.hero, title: v } })} />
      <Textarea label="Subtitle" value={content.hero.subtitle} onChange={(v) => set({ hero: { ...content.hero, subtitle: v } })} rows={2} />
      <ImageInput label="Background image URL" value={content.hero.background_image} onChange={(v) => set({ hero: { ...content.hero, background_image: v } })} />
    </Section>
  );
}

// ─── Authors editor ─────────────────────────────────────────────
function AuthorsEditor({ content, onChange }: { content: AuthorsContent; onChange: (c: AuthorsContent) => void }) {
  const set = (patch: Partial<AuthorsContent>) => onChange({ ...content, ...patch });
  return (
    <Section title="Hero Section">
      <Input label="Eyebrow" value={content.hero.eyebrow} onChange={(v) => set({ hero: { ...content.hero, eyebrow: v } })} />
      <Input label="Title" value={content.hero.title} onChange={(v) => set({ hero: { ...content.hero, title: v } })} />
      <Textarea label="Subtitle" value={content.hero.subtitle} onChange={(v) => set({ hero: { ...content.hero, subtitle: v } })} rows={2} />
      <ImageInput label="Background image URL" value={content.hero.background_image} onChange={(v) => set({ hero: { ...content.hero, background_image: v } })} />
    </Section>
  );
}

// ─── Services editor ─────────────────────────────────────────────
function ServicesEditor({ content, onChange }: { content: ServicesContent; onChange: (c: ServicesContent) => void }) {
  const set = (patch: Partial<ServicesContent>) => onChange({ ...content, ...patch });
  return (
    <>
      <Section title="Hero Section">
        <Input label="Eyebrow" value={content.hero.eyebrow} onChange={(v) => set({ hero: { ...content.hero, eyebrow: v } })} />
        <Input label="Title" value={content.hero.title} onChange={(v) => set({ hero: { ...content.hero, title: v } })} />
        <Textarea label="Subtitle" value={content.hero.subtitle} onChange={(v) => set({ hero: { ...content.hero, subtitle: v } })} rows={3} />
        <ImageInput label="Background image URL" value={content.hero.background_image} onChange={(v) => set({ hero: { ...content.hero, background_image: v } })} />
      </Section>
      <Section title="CTA Section">
        <Input label="Heading" value={content.cta.heading} onChange={(v) => set({ cta: { ...content.cta, heading: v } })} />
        <Textarea label="Body" value={content.cta.body} onChange={(v) => set({ cta: { ...content.cta, body: v } })} rows={2} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Button text" value={content.cta.button_text} onChange={(v) => set({ cta: { ...content.cta, button_text: v } })} />
          <Input label="Button link" value={content.cta.button_link} onChange={(v) => set({ cta: { ...content.cta, button_link: v } })} />
        </div>
      </Section>
    </>
  );
}

// ─── Contact editor ──────────────────────────────────────────────
function ContactEditor({ content, onChange }: { content: ContactContent; onChange: (c: ContactContent) => void }) {
  const set = (patch: Partial<ContactContent>) => onChange({ ...content, ...patch });
  return (
    <>
      <Section title="Hero Section">
        <Input label="Eyebrow" value={content.hero.eyebrow} onChange={(v) => set({ hero: { ...content.hero, eyebrow: v } })} />
        <Input label="Title" value={content.hero.title} onChange={(v) => set({ hero: { ...content.hero, title: v } })} />
        <Textarea label="Subtitle" value={content.hero.subtitle} onChange={(v) => set({ hero: { ...content.hero, subtitle: v } })} rows={3} />
        <ImageInput label="Background image URL" value={content.hero.background_image} onChange={(v) => set({ hero: { ...content.hero, background_image: v } })} />
      </Section>

      <Section title="Contact Cards">
        <div className="space-y-3">
          <div className="bg-neutral-50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-neutral-600">General Enquiries</p>
            <Input label="Heading" value={content.cards.general.heading} onChange={(v) => set({ cards: { ...content.cards, general: { ...content.cards.general, heading: v } } })} />
            <Textarea label="Body" value={content.cards.general.body} onChange={(v) => set({ cards: { ...content.cards, general: { ...content.cards.general, body: v } } })} rows={2} />
            <Input label="Email" value={content.cards.general.email} onChange={(v) => set({ cards: { ...content.cards, general: { ...content.cards.general, email: v } } })} />
          </div>
          <div className="bg-neutral-50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-neutral-600">Careers</p>
            <Input label="Heading" value={content.cards.careers.heading} onChange={(v) => set({ cards: { ...content.cards, careers: { ...content.cards.careers, heading: v } } })} />
            <Textarea label="Body" value={content.cards.careers.body} onChange={(v) => set({ cards: { ...content.cards, careers: { ...content.cards.careers, body: v } } })} rows={2} />
            <Input label="Email" value={content.cards.careers.email} onChange={(v) => set({ cards: { ...content.cards, careers: { ...content.cards.careers, email: v } } })} />
          </div>
          <div className="bg-neutral-50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-neutral-600">Submissions</p>
            <Input label="Heading" value={content.cards.submissions.heading} onChange={(v) => set({ cards: { ...content.cards, submissions: { ...content.cards.submissions, heading: v } } })} />
            <Textarea label="Body" value={content.cards.submissions.body} onChange={(v) => set({ cards: { ...content.cards, submissions: { ...content.cards.submissions, body: v } } })} rows={2} />
            <Input label="Email" value={content.cards.submissions.email} onChange={(v) => set({ cards: { ...content.cards, submissions: { ...content.cards.submissions, email: v } } })} />
          </div>
          <div className="bg-neutral-50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-neutral-600">Business & Publishing</p>
            <Input label="Heading" value={content.cards.business.heading} onChange={(v) => set({ cards: { ...content.cards, business: { ...content.cards.business, heading: v } } })} />
            <Textarea label="Body" value={content.cards.business.body} onChange={(v) => set({ cards: { ...content.cards, business: { ...content.cards.business, body: v } } })} rows={2} />
          </div>
        </div>
      </Section>

      <Section title="Departments (Business card)">
        <DepartmentEditor
          items={content.departments}
          onChange={(departments) => set({ departments })}
        />
      </Section>

      <Section title="Closing Line">
        <Textarea label="Closing text" value={content.closing} onChange={(v) => set({ closing: v })} rows={2} />
      </Section>
    </>
  );
}

// ─── Reusable list editors ───────────────────────────────────────
function StringListEditor({ label, items, onChange }: { label: string; items: string[]; onChange: (items: string[]) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-600 mb-1.5">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <textarea
              value={item}
              onChange={(e) => onChange(items.map((it, idx) => idx === i ? e.target.value : it))}
              rows={2}
              className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors resize-y"
            />
            <button
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={() => onChange([...items, ""])}>
          <Plus size={14} /> Add paragraph
        </Button>
      </div>
    </div>
  );
}

const ICON_OPTIONS = [
  { value: "BookOpen", label: "Book Open" },
  { value: "Heart", label: "Heart" },
  { value: "Shield", label: "Shield" },
  { value: "Users", label: "Users" },
  { value: "Scale", label: "Scale" },
  { value: "PenTool", label: "Pen Tool" },
  { value: "Mail", label: "Mail" },
  { value: "Briefcase", label: "Briefcase" },
  { value: "Send", label: "Send" },
  { value: "Star", label: "Star" },
  { value: "Award", label: "Award" },
  { value: "Palette", label: "Palette" },
  { value: "Printer", label: "Printer" },
  { value: "Globe", label: "Globe" },
  { value: "TrendingUp", label: "Trending Up" },
];

function IconItemListEditor({
  items, onChange,
}: {
  items: { icon: string; title: string; desc: string }[];
  onChange: (items: { icon: string; title: string; desc: string }[]) => void;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="bg-neutral-50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-neutral-500">Item {i + 1}</span>
            <button
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <Select
            label="Icon"
            value={item.icon}
            onChange={(v) => onChange(items.map((it, idx) => idx === i ? { ...it, icon: v } : it))}
            options={ICON_OPTIONS}
          />
          <Input label="Title" value={item.title} onChange={(v) => onChange(items.map((it, idx) => idx === i ? { ...it, title: v } : it))} />
          <Textarea label="Description" value={item.desc} onChange={(v) => onChange(items.map((it, idx) => idx === i ? { ...it, desc: v } : it))} rows={2} />
        </div>
      ))}
      <Button variant="secondary" size="sm" onClick={() => onChange([...items, { icon: "BookOpen", title: "", desc: "" }])}>
        <Plus size={14} /> Add item
      </Button>
    </div>
  );
}

function DepartmentEditor({
  items, onChange,
}: {
  items: { icon: string; label: string; email: string }[];
  onChange: (items: { icon: string; label: string; email: string }[]) => void;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="bg-neutral-50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-neutral-500">Department {i + 1}</span>
            <button
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <Select
            label="Icon"
            value={item.icon}
            onChange={(v) => onChange(items.map((it, idx) => idx === i ? { ...it, icon: v } : it))}
            options={ICON_OPTIONS}
          />
          <Input label="Label" value={item.label} onChange={(v) => onChange(items.map((it, idx) => idx === i ? { ...it, label: v } : it))} />
          <Input label="Email" value={item.email} onChange={(v) => onChange(items.map((it, idx) => idx === i ? { ...it, email: v } : it))} />
        </div>
      ))}
      <Button variant="secondary" size="sm" onClick={() => onChange([...items, { icon: "Mail", label: "", email: "" }])}>
        <Plus size={14} /> Add department
      </Button>
    </div>
  );
}
