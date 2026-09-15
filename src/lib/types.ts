// announcement as it comes over the api — createdAt is an ISO string
export type Announcement = {
  id: string;
  title: string;
  body: string;
  author: string;
  createdAt: string;
};
