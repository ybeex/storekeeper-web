"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { rowsOf, type Row } from "@/lib/api";
import { sk } from "@/lib/endpoints";
import { Empty, Select, Skeleton } from "./ui";

const ALL = "all";
const TONE: Record<string, string> = { available: "ok", checked_out: "warn", under_repair: "warn", lost: "bad", damaged: "bad", retired: "neu" };
const human = (s: unknown) => String(s ?? "").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

const TYPES = [{ value: ALL, label: "All types" }, { value: "asset", label: "Tracked assets" }, { value: "consumable", label: "Consumables" }];
const STATUSES = [{ value: ALL, label: "Any status" }, ...["available", "checked_out", "under_repair", "damaged", "lost", "retired"].map((v) => ({ value: v, label: human(v) }))];

function useDebounced<T>(v: T, ms = 300) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

function Availability({ r }: { r: Row }) {
  if (r.type === "asset") {
    return (
      <span className="avail">
        <span className={`badge ${TONE[String(r.assetStatus)] ?? "neu"}`}>{human(r.assetStatus)}</span>
        {r.holder?.name && <small className="muted">with {r.holder.name}{r.holder.overdue ? ", overdue" : ""}</small>}
      </span>
    );
  }
  const qty = Number(r.quantityAvailable ?? 0);
  const tone = qty <= 0 ? "bad" : r.lowStock ? "warn" : "ok";
  return (
    <span className="avail">
      <span className={`badge ${tone}`}>{qty} {r.unit ?? ""}</span>
      {r.effectiveMinThreshold != null && <small className="muted">minimum {r.effectiveMinThreshold}</small>}
    </span>
  );
}

/** Searchable, filterable list of every item, loading more as you scroll the list. */
export function ItemsTable() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [type, setType] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [shelf, setShelf] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [low, setLow] = useState(false);
  const search = useDebounced(q.trim());

  const shelves = useQuery({ queryKey: ["shelves", "filter"], queryFn: () => sk.shelves.list() });
  const categories = useQuery({ queryKey: ["categories", "filter"], queryFn: () => sk.categories.list() });
  const shelfOpts = [{ value: ALL, label: "All shelves" }, ...rowsOf(shelves.data).map((s) => ({ value: String(s.id), label: String(s.name) }))];
  const catOpts = useMemo(() => [{ value: ALL, label: "All categories" }, ...rowsOf(categories.data).filter((c) => shelf === ALL || c.shelfId === shelf).map((c) => ({ value: String(c.id), label: String(c.name) }))], [categories.data, shelf]);

  const params = { q: search || undefined, type: type === ALL ? undefined : type, status: status === ALL ? undefined : status, shelfId: shelf === ALL ? undefined : shelf, categoryId: category === ALL ? undefined : category, lowStock: low || undefined };
  const list = useInfiniteQuery({
    queryKey: ["dashboard-items", params],
    queryFn: ({ pageParam }) => sk.items.list({ ...params, limit: 25, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
  const rows = list.data?.pages.flatMap((p) => p.items) ?? [];
  const active = [search, type !== ALL, status !== ALL, shelf !== ALL, category !== ALL, low].filter(Boolean).length;
  const clear = () => { setQ(""); setType(ALL); setStatus(ALL); setShelf(ALL); setCategory(ALL); setLow(false); };

  return (
    <section className="glass card items-card" aria-label="Items">
      <div className="toolbar">
        <h2 className="section-title">Items</h2>
        <span className="muted small">{list.isPending ? "Loading" : `${rows.length}${list.hasNextPage ? "+" : ""} shown`}</span>
      </div>
      <div className="filters">
        <span className="input icon-input grow-input"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, SKU or tag" aria-label="Search items" />{q && <button className="clear-x" aria-label="Clear search" onClick={() => setQ("")}><X size={14} /></button>}</span>
        <div className="filter"><Select value={type} onValueChange={(v) => { setType(v); if (v === "consumable") setStatus(ALL); }} options={TYPES} /></div>
        <div className="filter"><Select value={status} onValueChange={setStatus} options={STATUSES} /></div>
        <div className="filter"><Select value={shelf} onValueChange={(v) => { setShelf(v); setCategory(ALL); }} options={shelfOpts} /></div>
        <div className="filter"><Select value={category} onValueChange={setCategory} options={catOpts} /></div>
        <button type="button" aria-pressed={low} className={`chip-btn${low ? " on" : ""}`} onClick={() => setLow((v) => !v)}>Low stock</button>
        {active > 0 && <button className="link" onClick={clear}>Clear filters ({active})</button>}
      </div>
      <div className="items-scroll">
        {list.isPending && <Skeleton rows={6} />}
        {list.isError && <p className="empty">Could not load items. <button className="link" onClick={() => void list.refetch()}>Try again</button></p>}
        {list.isSuccess && rows.length === 0 && <Empty>{active ? "No items match these filters." : "No items yet. Add one in the catalog or import a spreadsheet."}</Empty>}
        {rows.length > 0 && (
          <table>
            <thead><tr><th>Item</th><th>Type</th><th>Shelf and category</th><th>Availability</th><th>Condition</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={String(r.id)} className="clickable" onClick={() => router.push(`/items/${r.id}`)}>
                  <td><Link href={`/items/${r.id}`} className="item-link" onClick={(e) => e.stopPropagation()}>{String(r.name)}</Link><span className="mono"> {String(r.assetTag ?? r.sku ?? "")}</span></td>
                  <td><span className="badge neu">{r.type === "asset" ? "Asset" : "Consumable"}</span></td>
                  <td>{r.shelfName ? <>{String(r.shelfName)}<span className="muted"> / {String(r.categoryName ?? "")}</span></> : <span className="muted">{String(r.categoryName ?? "None")}</span>}</td>
                  <td><Availability r={r} /></td>
                  <td>{r.type === "asset" ? human(r.condition) : <span className="muted">Not tracked</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {list.hasNextPage && <div className="more"><button className="btn" onClick={() => void list.fetchNextPage()} disabled={list.isFetchingNextPage}>{list.isFetchingNextPage ? "Loading" : "Load more"}</button></div>}
      </div>
    </section>
  );
}
