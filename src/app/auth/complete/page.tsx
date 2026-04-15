import { verifySteamToken } from "@/lib/steam-token";
import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuthCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) redirect("/signin?error=MissingToken");

  const steamId = await verifySteamToken(token);
  if (!steamId) redirect("/signin?error=ExpiredToken");

  async function completeSignIn(formData: FormData) {
    "use server";
    const t = formData.get("token") as string;
    if (!t) redirect("/signin?error=MissingToken");
    const id = await verifySteamToken(t);
    if (!id) redirect("/signin?error=ExpiredToken");
    await signIn("steam", { token: t, redirectTo: "/dashboard" });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <form action={completeSignIn} id="auth-form">
        <input type="hidden" name="token" value={token} />
      </form>
      <span className="size-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="font-heading text-xs text-muted-foreground tracking-wider">
        SIGNING IN...
      </p>
      {/* Auto-submit; fallback link if JS disabled */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.getElementById('auth-form').requestSubmit();`,
        }}
      />
      <noscript>
        <button form="auth-form" type="submit" className="text-xs text-primary underline">
          Continue
        </button>
      </noscript>
    </div>
  );
}
