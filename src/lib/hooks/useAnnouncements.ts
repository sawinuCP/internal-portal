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

/**
 * Owns all feed state for the announcements section: loading, error, and the
 * list itself, plus the create action. Components stay presentational; this
 * hook is the single place that talks to the announcements API.
 */
export function useAnnouncements() {
  const [state, setState] = useState<FeedState>({
    items: [],
    loading: true,
    error: null,
    submitting: false,
  });

  const load = useCallback(async () => {
    setState((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const response = await fetch("/api/announcements");
      if (!response.ok) throw new Error("Request failed");
      const data = (await response.json()) as { items: Announcement[] };
      setState({ items: data.items, loading: false, error: null, submitting: false });
    } catch {
      setState((previous) => ({
        ...previous,
        loading: false,
        error: "Could not load announcements.",
      }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * Creates an announcement. Returns null on success, or a user-facing error
   * message on failure (field-level messages come back inside that message's
   * 422 response and are handled by the form's own validation).
   */
  const create = useCallback(
    async (input: AnnouncementInput): Promise<string | null> => {
      setState((previous) => ({ ...previous, submitting: true, error: null }));
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
        // Reconcile with the confirmed server record at the top of the feed.
        setState((previous) => ({
          ...previous,
          items: [data.item, ...previous.items],
          submitting: false,
        }));
        return null;
      } catch {
        setState((previous) => ({ ...previous, submitting: false }));
        return "Could not post the announcement. Check your connection and try again.";
      }
    },
    [],
  );

  return { ...state, reload: load, create };
}
