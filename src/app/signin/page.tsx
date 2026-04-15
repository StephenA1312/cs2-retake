"use client";

import { useState, useEffect } from "react";

const IconBrandDiscord = ({ className = "size-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

const IconArrowLeft = ({ className = "size-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

export default function SignIn() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for redirect cookie after Steam auth completes
    const match = document.cookie.match(/auth-redirect=([^;]+)/);
    if (match) {
      const redirect = decodeURIComponent(match[1]);
      // Delete the cookie
      document.cookie = "auth-redirect=;path=/;max-age=0";
      // Redirect to intended page
      window.location.href = redirect;
    }
  }, []);

  const handleSteamSignIn = async () => {
    setLoading(true);
    const redirect = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirect") || "/" : "/";
    // Store redirect in cookie so we can use it after Steam auth completes
    document.cookie = `auth-redirect=${encodeURIComponent(redirect)};path=/;max-age=300`;
    window.location.href = `/api/auth/steam`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <a href="/" className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <IconArrowLeft className="size-4" />
        Back to home
      </a>

      <div className="w-full max-w-sm text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight mb-2">
          <span className="text-primary">RET</span>AKES
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Sign in with Steam to get started
        </p>

        <button
          onClick={handleSteamSignIn}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-3 bg-[#1B2838] hover:bg-[#1B2838]/80 text-white px-6 py-3 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="size-6">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v4h-2zm0 6h2v4h-2z" fill="currentColor" />
            </svg>
          )}
          {loading ? "Redirecting..." : "Sign in with Steam"}
        </button>

        <p className="mt-6 text-xs text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
