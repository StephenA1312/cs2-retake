"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, Suspense } from "react";

function AuthCompleteInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current || !token) return;
    attempted.current = true;

    signIn("steam", { token, callbackUrl: "/dashboard" });
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="font-heading text-xs text-red-400">Missing token</p>
        <a href="/signin" className="text-xs text-primary hover:underline">Back to sign in</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <span className="size-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="font-heading text-xs text-muted-foreground tracking-wider">
        SIGNING IN...
      </p>
    </div>
  );
}

export default function AuthCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
          <span className="size-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="font-heading text-xs text-muted-foreground tracking-wider">
            SIGNING IN...
          </p>
        </div>
      }
    >
      <AuthCompleteInner />
    </Suspense>
  );
}
