"use client";

import { useEffect, useState } from "react";
import { StatCard, Card } from "@/components/tremor/Card";
import { BarChart } from "@/components/tremor/BarChart";

type Overview = { activeMonthly: number; activeLifetime: number; expiringSoon: number; newThisWeek: number };
type SeriesPoint = { date: string; granted: number; revoked: number; renewed: number; expired: number };
type Revenue = { mrrCents: number; lifetimeRevenueCents: number; last30dCents: number; activeSubs: number; currency: string };
type ExpiringUser = { steamId: string; steamName: string | null; vipExpiresAt: number | null; stripeSubscriptionId: string | null };

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

function formatDate(ts: number | null) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatShortDate(d: string) {
  const [, m, day] = d.split("-");
  return `${m}/${day}`;
}

export default function DashboardTab() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [series, setSeries] = useState<SeriesPoint[] | null>(null);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [expiring, setExpiring] = useState<ExpiringUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    setError(null);
    const results = await Promise.allSettled([
      fetch("/api/admin/stats/overview").then((r) => r.json()),
      fetch("/api/admin/stats/timeseries?days=30").then((r) => r.json()),
      fetch("/api/admin/stats/revenue").then((r) => r.json()),
      fetch("/api/admin/stats/expiring?days=14").then((r) => r.json()),
    ]);
    if (results[0].status === "fulfilled" && !results[0].value.error) setOverview(results[0].value);
    if (results[1].status === "fulfilled" && !results[1].value.error) setSeries(results[1].value.series);
    if (results[2].status === "fulfilled" && !results[2].value.error) setRevenue(results[2].value);
    else if (results[2].status === "fulfilled" && results[2].value.error) setError("Stripe data unavailable");
    if (results[3].status === "fulfilled" && !results[3].value.error) setExpiring(results[3].value.users);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const chartData = (series ?? []).map((p) => ({ ...p, date: formatShortDate(p.date) }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Active Monthly"
          value={overview?.activeMonthly ?? 0}
          hint={overview ? `${overview.newThisWeek} new this week` : undefined}
          loading={!overview}
        />
        <StatCard
          label="Active Lifetime"
          value={overview?.activeLifetime ?? 0}
          hint="permanent VIPs"
          loading={!overview}
        />
        <StatCard
          label="MRR"
          value={revenue ? formatMoney(revenue.mrrCents, revenue.currency) : "—"}
          hint={revenue ? `${revenue.activeSubs} active subs` : "loading stripe"}
          loading={!revenue && !error}
        />
        <StatCard
          label="Expiring 14d"
          value={overview?.expiringSoon ?? 0}
          hint="monthly VIPs at risk"
          loading={!overview}
        />
      </div>

      {revenue && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Last 30d Revenue" value={formatMoney(revenue.last30dCents, revenue.currency)} />
          <StatCard label="Lifetime Revenue" value={formatMoney(revenue.lifetimeRevenueCents, revenue.currency)} />
        </div>
      )}

      <Card>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Signups vs Churn</div>
            <div className="text-xs text-muted-foreground mt-0.5">Last 30 days</div>
          </div>
          <div className="flex gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="size-2 bg-[#22c55e]" />Granted</span>
            <span className="flex items-center gap-1.5"><span className="size-2 bg-[#ef4444]" />Revoked</span>
            <span className="flex items-center gap-1.5"><span className="size-2 bg-[#3b82f6]" />Renewed</span>
          </div>
        </div>
        {series ? (
          <BarChart
            data={chartData}
            categories={["granted", "revoked", "renewed"]}
            index="date"
            colors={["#22c55e", "#ef4444", "#3b82f6"]}
            height={240}
          />
        ) : (
          <div className="h-[240px] bg-muted/20 animate-pulse" />
        )}
      </Card>

      <Card>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Daily New Signups</div>
            <div className="text-xs text-muted-foreground mt-0.5">Granted events per day</div>
          </div>
        </div>
        {series ? (
          <BarChart data={chartData} categories={["granted"]} index="date" colors={["#22c55e"]} />
        ) : (
          <div className="h-[220px] bg-muted/20 animate-pulse" />
        )}
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Expiring Soon</div>
          <div className="text-xs text-muted-foreground mt-0.5">Monthly VIPs within 14 days</div>
        </div>
        {!expiring ? (
          <div className="p-6 text-center text-xs text-muted-foreground">Loading…</div>
        ) : expiring.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">No renewals due in the next 14 days</div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Name</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Steam ID</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Expires</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Sub</th>
              </tr>
            </thead>
            <tbody>
              {expiring.map((u) => (
                <tr key={u.steamId} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{u.steamName ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{u.steamId}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(u.vipExpiresAt)}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground truncate max-w-[140px]">{u.stripeSubscriptionId ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {error && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">{error}</div>
      )}

      <div className="flex justify-end">
        <button onClick={loadAll} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Refresh
        </button>
      </div>
    </div>
  );
}
