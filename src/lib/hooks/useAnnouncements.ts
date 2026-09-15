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

/** Single place that knows the announcements endpoint's shape. */
async function requestAnnouncements(): Promise<Announcement[]> {
  const response = await fetch("/api/announcements");
  if (!response.ok) throw new Error("Request failed");
  const data = (await response.json()) as { items: Announcement[] };
  return data.items;
}

/**
 * Owns all feed state for the announcements section: loading, error, and the
 * list itself, plus the create action. Components stay presentational; this
 * hook is the single place that talks to the announcements API.
 */
export function useAnnouncements() {
  // `loading` starts true, so the first paint shows skeletons while the
  // initial fetch below is in flight.
  const [state, setState] = useState<FeedState>({
    items: [],
    loading: true,
    error: null,
    submitting: false,
  });

  // Initial load: state updates happen inside the fetch's async callbacks
  // (never synchronously in the effect body), and an in-flight request is
  // ignored after unmount.
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
          setState((previous) => ({ ...previous, loading: false, error: LOAD_ERROR }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /** Manual refetch (the retry button): shows skeletons again, then fetches. */
  const reload = useCallback(async () => {
    setState((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const items = await requestAnnouncements();
      setState({ items, loading: false, error: null, submitting: false });
    } catch {
      setState((previous) => ({ ...previous, loading: false, error: LOAD_ERROR }));
    }
  }, []);

  /**
   * Creates an announcement. Returns null on success, or a user-facing error
   * message on failure (the API's field-level 422 details are mirrored by the
   * form's own shared-schema validation).
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

  return { ...state, reload, create };
}


