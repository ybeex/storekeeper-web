"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Download, Undo2 } from "lucide-react";
import { DropdownMenu, Tabs } from "radix-ui";
import { download, rowsOf, type OutstandingRow } from "@/lib/api";
import { sk } from "@/lib/endpoints";
import { returnItem } from "@/lib/quick";
import { StateBadge } from "@/components/badge";
import { useCan } from "@/components/restricted";
import { Empty, Field, Modal, PageHeader, Skeleton, errMsg, useToast } from "@/components/ui";

const FILTERS = [
  { value: "all", label: "Everything", p: {} },
  { value: "overdue", label: "Overdue", p: { overdue: true } },
  { value: "asset", label: "Assets", p: { type: "asset" } },
  { value: "consumable", label: "Consumables", p: { type: "consumable" } },
] as const;
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "None set");

export default function OutstandingPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");
  const [partial, setPartial] = useState<OutstandingRow | null>(null);
  const [qty, setQty] = useState("1");
  const toast = useToast();
  const canMove = useCan("move");
  const qc = useQueryClient();
  const f = FILTERS.find((x) => x.value === filter)!;
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ["outstanding", filter], queryFn: () => sk.views.outstanding({ limit: 50, ...f.p }) });
  const rows = rowsOf(data) as OutstandingRow[];

  const ret = useMutation({
    mutationFn: (v: { r: OutstandingRow; quantity?: number; condition?: string }) =>
      returnItem({ itemId: v.r.itemId, name: v.r.itemName, holder: { type: v.r.holder.type, id: v.r.holder.id }, quantity: v.r.itemType === "consumable" ? (v.quantity ?? v.r.quantity) : undefined, condition: v.condition }),
    onSuccess: (res, v) => {
      toast(res.queued ? "Saved on this device. It will sync when you are back online." : `${v.r.itemName} returned`);
      setPartial(null);
      void qc.invalidateQueries();
    },
    onError: (e) => toast(errMsg(e), "bad"),
  });

  return (
    <>
      <PageHeader title="Outstanding" lede="Everything currently out of the store. Return an item in one tap." actions={<button className="btn" onClick={() => download("/reports/outstanding?format=csv", "outstanding.csv").catch((e) => toast(errMsg(e), "bad"))}><Download size={16} />Export CSV</button>} />
      <Tabs.Root value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <Tabs.List className="tab-bar glass" aria-label="Filter outstanding items">{FILTERS.map((x) => <Tabs.Trigger key={x.value} value={x.value} className="tab">{x.label}</Tabs.Trigger>)}</Tabs.List>
      </Tabs.Root>
      <div className="glass table-card" aria-live="polite">
        {isPending && <Skeleton />}
        {isError && <p className="empty">Could not load the list. <button className="link" onClick={() => void refetch()}>Try again</button></p>}
        {data && rows.length === 0 && <Empty>Nothing is out. Every item is back on the shelf.</Empty>}
        {rows.length > 0 && (
          <div className="table-scroll"><table>
            <thead><tr><th>Item</th><th>Holder</th><th>Job</th><th>Due</th><th>State</th><th aria-label="Return" /></tr></thead>
            <tbody>{rows.map((r) => {
              const asset = r.itemType === "asset";
              const busy = ret.isPending && ret.variables?.r.id === r.id;
              return (
                <tr key={r.id}>
                  <td>{r.itemName}{!asset ? <span className="mono"> x {r.quantity}</span> : r.assetTag && <span className="mono"> {r.assetTag}</span>}</td>
                  <td>{r.holder.name}</td><td>{r.job?.name ?? "None"}</td><td className="mono">{fmt(r.dueAt)}</td>
                  <td><StateBadge state={r.state} days={r.overdueDays} /></td>
                  <td className="row-actions">
                    {canMove && <div className="split-btn">
                      <button className="btn sm primary" disabled={busy} onClick={() => ret.mutate({ r })}><Undo2 size={14} />{busy ? "Returning" : "Return"}</button>
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger className="btn sm primary split-more" aria-label="More return options"><ChevronDown size={14} /></DropdownMenu.Trigger>
                        <DropdownMenu.Portal><DropdownMenu.Content className="menu glass" align="end" sideOffset={6}>
                          {asset ? (<>
                            <DropdownMenu.Item className="menu-item" onSelect={() => ret.mutate({ r, condition: "damaged" })}>Return as damaged</DropdownMenu.Item>
                            <DropdownMenu.Item className="menu-item" onSelect={() => ret.mutate({ r, condition: "needs_inspection" })}>Return, needs inspection</DropdownMenu.Item>
                          </>) : (
                            <DropdownMenu.Item className="menu-item" onSelect={() => { setPartial(r); setQty(String(r.quantity)); }}>Return part of it</DropdownMenu.Item>
                          )}
                        </DropdownMenu.Content></DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>}
                  </td>
                </tr>);
            })}</tbody>
          </table></div>
        )}
      </div>
      <Modal open={!!partial} onOpenChange={(o) => !o && setPartial(null)} title={`Return ${partial?.itemName ?? ""}`} description={partial ? `${partial.holder.name} has ${partial.quantity} out.` : undefined}>
        <form className="form-grid" onSubmit={(e) => { e.preventDefault(); if (partial) ret.mutate({ r: partial, quantity: Number(qty) }); }}>
          <Field label="Quantity returned" htmlFor="pq"><input id="pq" type="number" min={1} max={partial?.quantity} className="input" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
          <div className="modal-actions"><button type="button" className="btn" onClick={() => setPartial(null)}>Cancel</button><button className="btn primary" disabled={ret.isPending || Number(qty) < 1 || Number(qty) > (partial?.quantity ?? 0)}>Return</button></div>
        </form>
      </Modal>
    </>
  );
}
