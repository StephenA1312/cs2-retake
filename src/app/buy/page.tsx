"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const IconArrowLeft = ({ className = "size-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
  </svg>
);

const IconCrown = ({ className = "size-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
);

const IconCheck = ({ className = "size-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12l5 5l10 -10" />
  </svg>
);

const PERKS: Record<string, string[]> = {
  monthly: ["Priority queue access", "+30% XP boost", "Full !ws skin access", "VIP chat tag"],
  lifetime: ["Everything in Monthly", "Permanent access", "Lifetime priority queue", "Exclusive lifetime tag"],
};

function Spinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="size-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="mt-4 text-sm text-muted-foreground">Loading checkout...</p>
    </div>
  );
}

function CheckoutForm({ tier }: { tier: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?success=true&tier=${tier}`,
      },
    });

    if (error) {
      setMessage(error.message ?? "Payment failed");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <IconCrown className="size-5 text-primary" />
        <div>
          <p className="font-heading text-sm font-bold">VIP {tier === "monthly" ? "Monthly" : "Lifetime"}</p>
          <p className="text-xs text-muted-foreground">{tier === "monthly" ? "$3/month" : "$15 one-time"}</p>
        </div>
      </div>

      <ul className="flex flex-col gap-2 border-t border-border pt-4">
        {PERKS[tier]?.map((perk) => (
          <li key={perk} className="flex items-center gap-2 text-xs text-muted-foreground">
            <IconCheck className="size-3 text-primary shrink-0" />
            {perk}
          </li>
        ))}
      </ul>

      <div className="border-t border-border pt-4">
        <PaymentElement />
      </div>

      {message && <p className="text-xs text-red-500">{message}</p>}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-primary text-primary-foreground px-4 py-3 text-sm font-medium hover:bg-primary/80 transition-colors disabled:opacity-50"
      >
        {loading ? "Processing..." : `Pay ${tier === "monthly" ? "$3/month" : "$15"}`}
      </button>
    </form>
  );
}

export default function BuyPage() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tier = searchParams.get("tier") ?? "monthly";

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/signin?redirect=/buy?tier=${tier}`);
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.alreadySubscribed) { router.replace("/dashboard"); return; }
        if (data.clientSecret) setClientSecret(data.clientSecret);
        else setError(data.error ?? "Failed to initialize payment");
      })
      .catch(() => setError("Failed to connect to payment server"));
  }, [status, tier, router]);

  if (status === "loading" || (!clientSecret && !error)) return <Spinner />;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 gap-4">
        <p className="font-heading text-xs text-muted-foreground uppercase tracking-wider">Payment Error</p>
        <p className="text-sm text-red-400 text-center max-w-xs">{error}</p>
        <a href="/" className="text-xs text-primary hover:underline">Back to home</a>
      </div>
    );
  }

  const options = {
    clientSecret: clientSecret!,
    appearance: {
      theme: "night" as const,
      variables: {
        colorPrimary: "#ff6b35",
        colorBackground: "#12121a",
        colorText: "#e5e5e5",
        colorTextSecondary: "#8888aa",
        colorDanger: "#ff4444",
        fontFamily: "IBM Plex Mono, monospace",
        borderRadius: "0px",
      },
    },
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <a href="/" className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <IconArrowLeft className="size-4" />
        Back to home
      </a>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="font-heading text-xs text-muted-foreground uppercase tracking-wider mb-2">Secure Checkout</p>
          <h1 className="font-heading text-2xl font-bold">
            <span className="text-primary">RET</span>AKES VIP
          </h1>
        </div>

        <div className="bg-card border border-border p-6">
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm tier={tier} />
          </Elements>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Payments processed securely by Stripe
        </p>
      </div>
    </div>
  );
}
