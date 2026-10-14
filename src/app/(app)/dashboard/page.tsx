"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ClipboardCheck, PackageMinus, RefreshCcw, ShieldAlert, UserCheck } from "lucide-react";
import { sk } from "@/lib/endpoints";
import type { Row } from "@/lib/api";
import { CountUp, Reveal, Tilt } from "@/components/motion";
import { PageHeader, Skeleton, fmtCell } from "@/components/ui";
import { ItemsTable } from "@/components/items-table";
import { DashboardAnalyticsSection } from "@/components/dashboard-analytics";
import { useCan } from "@/components/restricted";

export default function Dashboard() {
  const allowed = useCan("dashboard"); // store staff have no dashboard; the app shell sends them to their own work
  const { data, isPending, isError } = useQuery({ queryKey: ["dashboard"], queryFn: sk.views.dashboard, refetchInterval: 30_000, enabled: allowed });
  if (!allowed) return null;
  if (isPending) return <><PageHeader title="Dashboard" /><Skeleton rows={6} /></>;
  if (isError || !data) return <><PageHeader title="Dashboard" /><p className="empty">Could not load the dashboard.</p></>;
  const d = data as Row;
  const assets = (d.assets ?? {}) as Record<string, number>;
  const activity = (d.recentActivity ?? []) as Row[];
  const tiles: [string, number, string, typeof UserCheck, "ok" | "warn" | "bad"][] = [
    ["Outstanding lines", d.outstandingLines ?? 0, "/outstanding", UserCheck, "ok"],
    ["Overdue", d.overdue ?? 0, "/outstanding", AlertTriangle, d.overdue ? "bad" : "ok"],
    ["Low stock", d.lowStock ?? 0, "/low-stock", PackageMinus, d.lowStock ? "warn" : "ok"],
    ["Pending approvals", d.pendingApprovals ?? 0, "/approvals", ShieldAlert, d.pendingApprovals ? "warn" : "ok"],
    ["Open counts", d.openReconciliations ?? 0, "/reconciliation", ClipboardCheck, "ok"],
    ["Sync conflicts", d.openSyncConflicts ?? 0, "/activity", RefreshCcw, d.openSyncConflicts ? "bad" : "ok"],
  ];
  return (
    <>
      <PageHeader title="Dashboard" lede="What needs your attention right now." />
      <div className="tile-grid">
        {tiles.map(([t, n, href, Icon, tone], i) => (
          <Reveal key={t} delay={i * 60}><Tilt max={5}><Link href={href} className={`tile glass ${tone}`}><span className="tile-icon"><Icon size={18} /></span><strong className="tile-n"><CountUp to={Number(n)} /></strong><span className="muted">{t}</span></Link></Tilt></Reveal>
        ))}
      </div>
      <DashboardAnalyticsSection />
      <Reveal><ItemsTable /></Reveal>
      <div className="two-col eq">
        <Reveal><section className="glass card"><h2 className="section-title">Assets by status</h2>
          <div className="eq-scroll">
            {Object.keys(assets).length === 0 ? <p className="muted">No tracked assets yet.</p> : Object.entries(assets).map(([k, v]) => <div key={k} className="kv"><span>{k.replace(/_/g, " ")}</span><strong>{v}</strong></div>)}
            <div className="kv"><span>Consumable lines</span><strong>{d.consumableLines ?? 0}</strong></div>
            <div className="kv"><span>Out of stock</span><strong>{d.outOfStock ?? 0}</strong></div>
            <div className="kv"><span>Holders with items</span><strong>{d.holdersWithItems ?? 0}</strong></div>
          </div>
        </section></Reveal>
        <Reveal delay={90}><section className="glass card feed-card"><div className="toolbar"><h2 className="section-title">Recent activity</h2><Link href="/activity" className="link small">See all</Link></div>
          <div className="feed" tabIndex={0} aria-label="Recent activity, scrollable">
            {activity.length === 0 && <p className="muted">No movements yet. Issue your first item.</p>}
            {activity.map((a) => (
              <div key={String(a.id)} className="kv"><span>{a.itemName} {a.quantity ? <span className="mono">x {a.quantity}</span> : null}</span><span className="feed-meta">{fmtCell(a.type)} {fmtCell(a.occurredAt)}</span></div>
            ))}
          </div>
        </section></Reveal>
      </div>
    </>
  );
}
