import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";

// Entry point: authenticated users go straight into the portal,
// everyone else is sent to login.
export default async function HomePage() {
  const user = await getSessionUser();
  redirect(user ? "/announcements" : "/login");
}
