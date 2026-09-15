import type { Announcement } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils/time";
import { Card } from "@/components/ui/Card";

function SkeletonItem() {
  return (
    <Card className="animate-pulse space-y-2.5 p-4">
      <div className="h-4 w-1/3 rounded bg-slate-200" />
      <div className="h-3 w-2/3 rounded bg-slate-100" />
    </Card>
  );
}

export function AnnouncementList({
  items,
  loading,
}: {
  items: Announcement[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-3" aria-hidden="true" aria-busy="true">
        <SkeletonItem />
        <SkeletonItem />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-medium text-slate-900">No announcements yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Post the first one to keep the team in the loop.
        </p>
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <Card className="p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
              <time dateTime={item.createdAt} className="text-xs text-slate-500">
                {formatRelativeTime(item.createdAt)}
              </time>
            </div>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-slate-700">
              {item.body}
            </p>
            <p className="mt-2.5 text-xs text-slate-500">Posted by {item.author}</p>
          </Card>
        </li>
      ))}
    </ul>
  );
}
