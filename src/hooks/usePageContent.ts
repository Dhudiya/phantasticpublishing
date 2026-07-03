import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  PageContentMap,
  PageSlug,
  pageContentDefaults,
  mergeContent,
} from "../lib/pageContentDefaults";

interface PageContentRow {
  id: string;
  page_slug: string;
  content: Record<string, unknown>;
  updated_at: string;
}

// Fetches the DB content row for a page and merges it over the TypeScript
// defaults. Returns the merged content plus loading state and a refetch fn.
export function usePageContent<K extends PageSlug>(slug: K) {
  const defaults = pageContentDefaults[slug];
  const [content, setContent] = useState<PageContentMap[K]>(defaults);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("page_content")
      .select("*")
      .eq("page_slug", slug)
      .maybeSingle();
    const row = data as PageContentRow | null;
    if (row?.content) {
      setContent(mergeContent(defaults, row.content as Partial<PageContentMap[K]>));
    } else {
      setContent(defaults);
    }
    setLoading(false);
  }, [slug, defaults]);

  useEffect(() => {
    load();
  }, [load]);

  return { content, loading, refetch: load };
}

// Fetch all page content rows at once (used by the admin editor list).
export function useAllPageContent() {
  const [rows, setRows] = useState<PageContentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("page_content")
      .select("*")
      .order("page_slug", { ascending: true });
    setRows((data as PageContentRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { rows, loading, refetch: load };
}
