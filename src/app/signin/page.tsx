"use client";

import { useState } from "react";

const IconArrowLeft = ({ className = "size-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

export default function SignIn() {
  const [loading, setLoading] = useState(false);

  const handleSteamSignIn = async () => {
    setLoading(true);
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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 259" width="24" height="24" className="size-6">
              <path d="M127.779 0C57.852 0 .802 55.143.002 124.515l68.83 28.439c5.837-3.987 12.876-6.32 20.47-6.32.678 0 1.35.022 2.016.06l30.642-44.382v-.624c0-23.056 18.766-41.822 41.822-41.822S205.6 78.632 205.6 101.688c0 23.057-18.766 41.823-41.822 41.823h-.97l-43.652 31.16c.026.55.04 1.103.04 1.66 0 17.283-14.064 31.348-31.348 31.348-15.07 0-27.645-10.66-30.624-24.834L4.66 158.848C19.646 214.406 69.461 255.98 128.97 255.98c71.434 0 129.327-57.893 129.327-129.327 0-71.434-57.893-129.327-129.327-129.327l-.191-.001v.675z" fill="currentColor"/>
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
