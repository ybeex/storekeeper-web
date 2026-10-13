"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, TrendingDown, TrendingUp, Users } from "lucide-react";
import { sk, type DashboardAnalytics } from "@/lib/endpoints";
import { Btn } from "./ui";

const RANGES = [7, 14, 30] as const;
const SERIES = [
  ["checkouts", "Checked out", "var(--accent)"],
  ["checkins", "Returned", "var(--ok)"],
  ["consumed", "Used up", "var(--accent-2)"],
  ["restocked", "Restocked", "var(--ink-muted)"],
] as const;

const pct = (cur: number, prev: number) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null);
const dayLabel = (iso: string, long = false) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, long ? { weekday: "short", day: "numeric", month: "short" } : { day: "numeric" });

function Delta({ cur, prev, goodWhen, days }: { cur: number; prev: number; goodWhen: "up" | "down"; days: number }) {
  const p = pct(cur, prev);
  if (p === null || p === 0) return <span className="muted small">{prev === 0 && cur === 0 ? `Nothing in the last ${days * 2} days` : `Same as the previous ${days} days`}</span>;
  const up = p > 0; const good = (up && goodWhen === "up") || (!up && goodWhen === "down");
  const Icon = up ? TrendingUp : TrendingDown;
  return <span className={`delta ${good ? "good" : "bad"}`}><Icon size={14} aria-hidden />{up ? "Up" : "Down"} {Math.abs(p)}% on the previous {days} days</span>;
}

/** Stacked daily bars: what moved each day, split by kind. Pure SVG, no chart library. */
function DailyChart({ daily }: { daily: DashboardAnalytics["daily"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = 220, L = 34, B = 26, T = 12, R = 8;
  const max = Math.max(4, ...daily.map((d) => SERIES.reduce((n, [k]) => n + d[k], 0)));
  const top = Math.ceil(max / 4) * 4;
  const bw = (W - L - R) / daily.length;
  const idx = hover ?? daily.length - 1; const sel = daily[idx];
  const step = daily.length > 20 ? 5 : daily.length > 10 ? 2 : 1;
  return (
    <figure className="chart">
      <div className="chart-readout" aria-live="polite">
        <strong>{sel ? dayLabel(sel.date, true) : ""}</strong>
        {SERIES.map(([k, label, color]) => <span key={k} className="legend-item"><i style={{ background: color }} />{label} <b>{sel?.[k] ?? 0}</b></span>)}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Movements per day over the last ${daily.length} days`} onPointerLeave={() => setHover(null)}>
        {[0, 1, 2, 3, 4].map((g) => {
          const y = T + ((H - T - B) * (4 - g)) / 4;
          return <g key={g}><line x1={L} x2={W - R} y1={y} y2={y} stroke="var(--line)" strokeWidth={1} /><text x={L - 6} y={y + 4} textAnchor="end" fontSize="11" fill="var(--ink-muted)">{Math.round((top * g) / 4)}</text></g>;
        })}
        {daily.map((d, i) => {
          let y = H - B; const x = L + i * bw + bw * 0.16; const w = bw * 0.68;
          return (
            <g key={d.date} onPointerEnter={() => setHover(i)} className={i === idx ? "bar-on" : undefined}>
              <rect x={L + i * bw} y={T} width={bw} height={H - T - B} fill="transparent" />
              {SERIES.map(([k, , color]) => {
                const h = ((H - T - B) * d[k]) / top; y -= h;
                return h > 0 ? <rect key={k} x={x} y={y} width={w} height={h} rx={2} fill={color} /> : null;
              })}
              {i % step === 0 || i === daily.length - 1 ? <text x={x + w / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--ink-muted)">{dayLabel(d.date)}</text> : null}
            </g>
          );
        })}
      </svg>
      <table className="sr-only"><caption>Movements per day</caption><thead><tr><th>Day</th>{SERIES.map(([, l]) => <th key={l}>{l}</th>)}</tr></thead><tbody>{daily.map((d) => <tr key={d.date}><td>{d.date}</td>{SERIES.map(([k]) => <td key={k}>{d[k]}</td>)}</tr>)}</tbody></table>
    </figure>
  );
}

function StockHealth({ h }: { h: DashboardAnalytics["stockHealth"] }) {
  const total = h.ok + h.near + h.low + h.out;
  const parts: [string, number, string][] = [["Healthy", h.ok, "var(--ok)"], ["Getting low", h.near, "var(--accent-2)"], ["Low", h.low, "var(--accent-3)"], ["Out", h.out, "var(--ink)"]];
  if (total === 0) return <p className="muted">No stock items yet.</p>;
  return (
    <div className="health">
      <div className="health-bar" role="img" aria-label={parts.map(([l, n]) => `${n} ${l.toLowerCase()}`).join(", ")}>
        {parts.map(([l, n, c]) => n > 0 ? <span key={l} style={{ flexGrow: n, background: c }} title={`${l}: ${n}`} /> : null)}
      </div>
      <ul className="legend-col">{parts.map(([l, n, c]) => <li key={l}><i style={{ background: c }} />{l}<b>{n}</b></li>)}</ul>
    </div>
  );
}

export function DashboardAnalyticsSection() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(14);
  const q = useQuery({ queryKey: ["dashboard-analytics", days], queryFn: () => sk.views.dashboardAnalytics(days), refetchInterval: 60_000, placeholderData: (p) => p });
  const a = q.data;
  const maxTop = Math.max(1, ...(a?.topConsumed.map((t) => t.units) ?? [1]));
  return (
    <section className="an" aria-label="Analytics">
      <div className="toolbar">
        <h2 className="section-title">Analytics</h2>
        <div className="seg-pick" role="group" aria-label="Time range">{RANGES.map((r) => <button key={r} type="button" aria-pressed={days === r} onClick={() => setDays(r)}>{r} days</button>)}</div>
      </div>
      {q.isPending && <div className="glass card an-skel" aria-busy="true"><div className="skeleton" style={{ height: 220 }} /></div>}
      {q.isError && !a && <div className="glass card empty">Could not load analytics.<Btn onClick={() => void q.refetch()}>Try again</Btn></div>}
      {a && (
        <>
          <div className="kpis">
            <div className="glass kpi"><span className="muted small">Movements</span><strong>{a.summary.total.toLocaleString()}</strong><Delta cur={a.summary.total} prev={a.summary.previousTotal} goodWhen="up" days={days} /></div>
            <div className="glass kpi"><span className="muted small">Checkouts with a named holder</span><strong>{a.summary.accountableRate === null ? "None yet" : `${a.summary.accountableRate}%`}</strong><span className="muted small"><ShieldCheck size={14} aria-hidden /> The accountability target is 95%</span></div>
            <div className="glass kpi"><span className="muted small">People recording</span><strong>{a.summary.activeUsers}</strong><span className="muted small"><Users size={14} aria-hidden /> {a.summary.offlineShare ? `${a.summary.offlineShare}% saved offline first` : "Active in this period"}</span></div>
            <div className="glass kpi"><span className="muted small">Lost or damaged</span><strong>{a.incidents.current}</strong><Delta cur={a.incidents.current} prev={a.incidents.previous} goodWhen="down" days={days} /></div>
          </div>
          <div className="an-top">
            <div className="glass card"><h3 className="sub-title">Movements per day</h3>{a.summary.total === 0 ? <p className="muted">Nothing has moved in this period yet.</p> : <DailyChart daily={a.daily} />}</div>
            <div className="glass card"><h3 className="sub-title">Stock health</h3><StockHealth h={a.stockHealth} /><Link href="/low-stock" className="link small">See low stock</Link></div>
          </div>
          <div className="an-bottom">
            <div className="glass card">
              <h3 className="sub-title">Most used stock</h3>
              {a.topConsumed.length === 0 ? <p className="muted">No stock has been used in this period.</p> : (
                <ul className="hbars">{a.topConsumed.map((t) => (
                  <li key={t.item_id}><div className="hbar-row"><Link href={`/items/${t.item_id}`} className="item-link">{t.name}</Link><b>{t.units.toLocaleString()} {t.unit ?? ""}</b></div><div className="hbar"><span style={{ width: `${(100 * t.units) / maxTop}%` }} /></div></li>
                ))}</ul>
              )}
            </div>
            <div className="glass card">
              <h3 className="sub-title">Holding the most right now</h3>
              {a.topHolders.length === 0 ? <p className="muted">Nothing is checked out.</p> : (
                <ul className="holder-rank">{a.topHolders.map((h, i) => (
                  <li key={`${h.holder}-${i}`}><span>{h.holder ?? "Unnamed holder"}</span><span className="rank-end">{h.overdue > 0 && <span className="badge bad">{h.overdue} overdue</span>}<b>{h.lines} {h.lines === 1 ? "line" : "lines"}</b></span></li>
                ))}</ul>
              )}
              <Link href="/outstanding" className="link small">See everything outstanding</Link>
            </div>
            <div className="glass card">
              <h3 className="sub-title">Lost and damaged</h3>
              <div className="stat-row"><div className="stat"><strong>{a.incidents.lost}</strong><span>Lost</span></div><div className="stat"><strong>{a.incidents.damaged}</strong><span>Damaged</span></div></div>
              <p className="muted small">Each one is its own record with a holder and a reason, so it is never hidden inside a stock adjustment.</p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
