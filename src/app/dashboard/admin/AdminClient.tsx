"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardTab from "./DashboardTab";

type Tab = "dashboard" | "override" | "customers";

interface Customer {
  steamId: string;
  steamName: string | null;
  vipTier: string | null;
  vipExpiresAt: number | null;
  updatedAt: number;
  stripeCustomerId: string | null;
}

const IconCrown = ({ className = "size-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
);

const IconUsers = ({ className = "size-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconChart = ({ className = "size-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 3v18h18" />
    <path d="M7 15l4-4 4 4 5-6" />
  </svg>
);

function formatDate(ts: number | null) {
  if (!ts) return "Never";
  return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminClient({ isAdmin }: { isAdmin: boolean }) {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>(isAdmin ? "dashboard" : "override");

  // Override form state
  const [steamId, setSteamId] = useState("");
  const [tier, setTier] = useState<"monthly" | "lifetime" | "free">("monthly");
  const [expiresAt, setExpiresAt] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Customers table state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [customerFilter, setCustomerFilter] = useState("");

  const filteredCustomers = customerFilter.trim()
    ? customers.filter((c) => c.steamId.includes(customerFilter.trim()))
    : customers;

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/signin");
    }
  }, [sessionStatus, router]);

  async function fetchCustomers() {
    setCustomersLoading(true);
    setCustomersError(null);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok) {
        setCustomers(data.users);
      } else {
        setCustomersError(data.error ?? "Failed to load");
      }
    } catch {
      setCustomersError("Network error");
    } finally {
      setCustomersLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "customers" && customers.length === 0 && sessionStatus === "authenticated") {
      fetchCustomers();
    }
  }, [activeTab, sessionStatus]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const res = await fetch("/api/admin/grant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetSteamId: steamId.trim(),
        vipTier: tier,
        vipExpiresAt: tier === "monthly" ? expiresAt : null,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setStatus({ type: "success", msg: `VIP ${tier} granted to ${steamId.trim()}` });
      setSteamId("");
      setTier("monthly");
      setExpiresAt("");
    } else {
      setStatus({ type: "error", msg: data.error ?? "Failed to grant VIP" });
    }
  }

  async function handleRevoke(steamIdToRevoke: string) {
    const res = await fetch("/api/admin/grant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetSteamId: steamIdToRevoke,
        vipTier: "free",
        vipExpiresAt: null,
      }),
    });

    if (res.ok) {
      setCustomers((prev) => prev.filter((c) => c.steamId !== steamIdToRevoke));
    }
  }

  if (sessionStatus === "loading" || sessionStatus === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="size-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="font-heading text-sm font-bold tracking-wider">
            <span className="text-primary">RET</span>AKES
          </a>
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {!isAdmin && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
            You are not an admin — read-only mode. Contact a server admin to get VIP override permissions.
          </div>
        )}

        <h1 className="font-heading text-2xl font-bold mb-1">Admin Panel</h1>
        <p className="text-xs text-muted-foreground mb-8">Manage VIP subscriptions manually</p>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-border">
          {isAdmin && (
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
                activeTab === "dashboard"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconChart className="size-3.5" />
              Dashboard
            </button>
          )}
          <button
            onClick={() => setActiveTab("override")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
              activeTab === "override"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <IconCrown className="size-3.5" />
            Override
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
              activeTab === "customers"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <IconUsers className="size-3.5" />
            Active Customers
          </button>
        </div>

        {activeTab === "dashboard" && isAdmin && <DashboardTab />}

        {/* Override Tab */}
        {activeTab === "override" && (
          <div className="space-y-6">
            {!isAdmin && (
              <div className="p-4 bg-muted border border-border text-xs text-muted-foreground">
                Only admins can override VIP. Contact a server admin.
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5 p-6 bg-card border border-border">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Steam ID
                </label>
                <input
                  type="text"
                  value={steamId}
                  onChange={(e) => setSteamId(e.target.value)}
                  placeholder="e.g. 76561198012345678"
                  required
                  disabled={!isAdmin}
                  className="w-full bg-muted border border-border px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  VIP Tier
                </label>
                <div className="flex gap-3">
                  {(["monthly", "lifetime", "free"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => isAdmin && setTier(t)}
                      disabled={!isAdmin}
                      className={`flex-1 px-4 py-2 text-xs font-medium border transition-colors ${
                        tier === t
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted border-border text-foreground hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {tier === "monthly" && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Expires At
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full bg-muted border border-border px-4 py-3 text-sm font-mono text-foreground focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to default to 1 month from now
                  </p>
                </div>
              )}

              {status && (
                <div
                  className={`px-4 py-3 text-xs font-medium ${
                    status.type === "success"
                      ? "bg-primary/10 border border-primary/20 text-primary"
                      : "bg-red-500/10 border border-red-500/20 text-red-400"
                  }`}
                >
                  {status.msg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isAdmin}
                className="w-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Granting..." : "Grant VIP"}
              </button>
            </form>
          </div>
        )}

        {/* Active Customers Tab */}
        {activeTab === "customers" && (
          <div className="space-y-4">
            <input
              type="text"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              placeholder="Filter by Steam ID..."
              className="w-full bg-muted border border-border px-4 py-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />

            {customersLoading && (
              <div className="flex items-center justify-center py-12">
                <span className="size-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}

            {customersError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {customersError}
              </div>
            )}

            {!customersLoading && !customersError && customers.length === 0 && (
              <div className="p-6 bg-card border border-border text-center text-xs text-muted-foreground">
                No active VIP customers
              </div>
            )}

            {!customersLoading && customers.length > 0 && filteredCustomers.length === 0 && (
              <div className="p-6 bg-card border border-border text-center text-xs text-muted-foreground">
                No customers match &quot;{customerFilter}&quot;
              </div>
            )}

            {!customersLoading && filteredCustomers.length > 0 && (
              <div className="bg-card border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left font-medium text-muted-foreground px-4 py-3">Name</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-3">Steam ID</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-3">Tier</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-3">Expires</th>
                      <th className="text-right font-medium text-muted-foreground px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.steamId} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          {customer.steamName ?? "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {customer.steamId}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${
                            customer.vipTier === "lifetime"
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : customer.vipTier === "monthly"
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {customer.vipTier ?? "Free"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(customer.vipExpiresAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isAdmin ? (
                            <button
                              onClick={() => handleRevoke(customer.steamId)}
                              className="text-xs text-red-400 hover:text-red-300 transition-colors"
                            >
                              Revoke
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {customerFilter.trim()
                  ? `${filteredCustomers.length} of ${customers.length} customer${customers.length !== 1 ? "s" : ""}`
                  : `${customers.length} active customer${customers.length !== 1 ? "s" : ""}`}
              </p>
              <button
                onClick={fetchCustomers}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}