"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { rowsOf, type Row } from "@/lib/api";
import { sk, type Holder } from "@/lib/endpoints";
import { cachedHolders, cachedItems, isNetworkError } from "@/lib/cache";
import { Select } from "./ui";

/** Search-as-you-type item picker. */
export function ItemPicker({ value, onPick, type }: { value?: Row | null; onPick: (item: Row) => void; type?: "asset" | "consumable" }) {
  const [q, setQ] = useState("");
  const { data } = useQuery({ queryKey: ["item-pick", q, type], queryFn: async () => { try { return await sk.items.list({ q, limit: 8, type }); } catch (e) { if (isNetworkError(e)) return { items: await cachedItems(q, type) }; throw e; } }, enabled: q.length > 0, networkMode: "always" });
  const rows = rowsOf(data);
  return (
    <div className="picker">
      <span className="input icon-input"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={value ? String(value.name) : "Search by name, SKU or tag"} aria-label="Search items" /></span>
      {value && <div className="picked"><strong>{String(value.name)}</strong><span className="mono">{String(value.sku ?? "")}</span></div>}
      {q && rows.length > 0 && (
        <ul className="pick-list glass">
          {rows.map((r) => (
            <li key={String(r.id)}><button type="button" onClick={() => { onPick(r); setQ(""); }}><span>{String(r.name)}</span><span className="mono">{String(r.assetTag ?? r.sku ?? "")}</span></button></li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Person / team / job selector. */
export function HolderPicker({ value, onChange }: { value: Holder | null; onChange: (h: Holder | null) => void }) {
  const [type, setType] = useState<Holder["type"]>(value?.type ?? "person");
  const { data } = useQuery({ queryKey: ["holders", type], queryFn: async () => { try { return await sk.activity.holders({ type, limit: 30 }); } catch (e) { if (isNetworkError(e)) return { items: await cachedHolders(type) }; throw e; } }, networkMode: "always" });
  const opts = rowsOf(data).map((r) => ({ value: String(r.id), label: String(r.name ?? r.fullName ?? r.id) }));
  return (
    <div className="holder-picker">
      <Select value={type} onValueChange={(v) => { setType(v as Holder["type"]); onChange(null); }} options={[{ value: "person", label: "Person" }, { value: "team", label: "Team" }, { value: "job", label: "Job or site" }]} />
      <Select value={value?.id} onValueChange={(id) => onChange({ type, id })} options={opts} placeholder={`Choose ${type === "job" ? "job" : type}`} />
    </div>
  );
}

export function useOptions(qk: string, load: () => Promise<unknown>, labelOf: (r: Row) => string) {
  const { data } = useQuery({ queryKey: [qk, "options"], queryFn: load });
  return rowsOf(data).map((r) => ({ value: String(r.id), label: labelOf(r) }));
}
