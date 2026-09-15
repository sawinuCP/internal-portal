"use client";

import { useCallback, useEffect, useState } from "react";
import type { Announcement } from "@/lib/types";
import type { AnnouncementInput } from "@/lib/validation/schemas";

type FeedState = {
  items: Announcement[];
  loading: boolean;
  error: string | null;
  submitting: boolean;
};

const LOAD_ERROR = "Could not load announcements.";

async function requestAnnouncements(): Promise<Announcement[]> {
  const response = await fetch("/api/announcements");
  if (!response.ok) throw new Error("Request failed");
  const data = (await response.json()) as { items: Announcement[] };
  return data.items;
}

export function useAnnouncements() {
  // loading starts true so the first paint is skeletons
  const [state, setState] = useState<FeedState>({
    items: [],
    loading: true,
    error: null,
    submitting: false,
  });

  // state updates happen in the fetch callbacks, not the effect body
  useEffect(() => {
    let cancelled = false;

    requestAnnouncements()
      .then((items) => {
        if (!cancelled) {
          setState({ items, loading: false, error: null, submitting: false });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState((prev) => ({ ...prev, loading: false, error: LOAD_ERROR }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const reload = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const items = await requestAnnouncements();
      setState({ items, loading: false, error: null, submitting: false });
    } catch {
      setState((prev) => ({ ...prev, loading: false, error: LOAD_ERROR }));
    }
  }, []);

  // resolves to null on success, or a message the form can show
  const create = useCallback(
    async (input: AnnouncementInput): Promise<string | null> => {
      setState((prev) => ({ ...prev, submitting: true, error: null }));
      try {
        const response = await fetch("/api/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as {
            error?: { message?: string };
          } | null;
          return data?.error?.message ?? "Could not post the announcement.";
        }
        const data = (await response.json()) as { item: Announcement };
        // server record confirmed — prepend it
        setState((prev) => ({ ...prev, items: [data.item, ...prev.items], submitting: false }));
        return null;
      } catch {
        setState((prev) => ({ ...prev, submitting: false }));
        return "Could not post the announcement. Check your connection and try again.";
      }
    },
    [],
  );

  return { ...state, reload, create };
}



