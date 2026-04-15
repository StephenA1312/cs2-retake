import { auth } from "@/lib/auth";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    return <AdminClient isAdmin={false} />;
  }

  const steamId = (session.user as any)?.id ?? "";
  const ADMIN_STEAM_IDS = (process.env.ADMIN_STEAM_IDS ?? "").split(",").filter(Boolean);
  const isAdmin = ADMIN_STEAM_IDS.includes(steamId);

  return <AdminClient isAdmin={isAdmin} />;
}