/**
 * Wire format of an announcement as exchanged with the API.
 * `createdAt` is an ISO 8601 string over the wire (JSON has no Date type).
 */
export type Announcement = {
  id: string;
  title: string;
  body: string;
  author: string;
  createdAt: string;
};
