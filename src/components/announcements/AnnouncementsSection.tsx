"use client";

import { useAnnouncements } from "@/lib/hooks/useAnnouncements";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AnnouncementForm } from "./AnnouncementForm";
import { AnnouncementList } from "./AnnouncementList";

/**
 * The portal's single content section: create + view announcements.
 * Composition root for the feed — owns no UI details itself.
 */
export function AnnouncementsSection() {
  const { items, loading, error, submitting, reload, create } = useAnnouncements();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Announcements
        </h1>
        <p className="mt-1 text-sm text-slate-600">Team-wide updates, newest first.</p>
      </div>

      <Card className="p-4 sm:p-5">
        <AnnouncementForm onSubmit={create} submitting={submitting} />
      </Card>

      {error && (
        <Alert tone="error">
          <div className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button variant="secondary" size="sm" onClick={() => void reload()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      <AnnouncementList items={items} loading={loading} />
    </div>
  );
}
