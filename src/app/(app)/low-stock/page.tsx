"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PackagePlus } from "lucide-react";
import { rowsOf, type Row } from "@/lib/api";
import { sk } from "@/lib/endpoints";
import { useCan } from "@/components/restricted";
import { Empty, Field, Modal, PageHeader, Skeleton, errMsg, useToast } from "@/components/ui";

export default function LowStock() {
  const qc = useQueryClient();
  const canMove = useCan("move");
  const toast = useToast();
  const { data, isPending } = useQuery({ queryKey: ["low-stock"], queryFn: () => sk.views.lowStock() });
  const [target, setTarget] = useState<Row | null>(null);
  const [qty, setQty] = useState("");
  const restock = useMutation({
    mutationFn: () => sk.transactions.restock({ itemId: target!.itemId, quantity: Number(qty) }),
    onSuccess: () => { toast("Restocked"); setTarget(null); void qc.invalidateQueries(); },
    onError: (e) => toast(errMsg(e), "bad"),
  });
  const rows = rowsOf(data);
  return (
    <>
      <PageHeader title="Low stock" lede="Consumables at or below their minimum." />
      <div className="glass table-card">
        {isPending && <Skeleton />}
        {data && rows.length === 0 && <Empty>Every consumable is above its minimum.</Empty>}
        {rows.length > 0 && <div className="table-scroll"><table>
          <thead><tr><th>Item</th><th>Available</th><th>Minimum</th><th>Reorder</th><th /></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.itemId}>
              <td>{r.name} <span className="mono">{r.sku}</span></td>
              <td><span className={`badge ${r.outOfStock ? "bad" : "warn"}`}>{r.quantityAvailable} {r.unit ?? ""}</span></td>
              <td>{r.minThreshold}</td><td>{r.reorderQuantity ?? "None set"}</td>
              <td className="row-actions">{canMove && <button className="btn sm" onClick={() => { setTarget(r); setQty(String(r.reorderQuantity ?? "")); }}><PackagePlus size={15} />Restock</button>}</td>
            </tr>))}</tbody>
        </table></div>}
      </div>
      <Modal open={!!target} onOpenChange={(o) => !o && setTarget(null)} title={`Restock ${target?.name ?? ""}`}>
        <form className="form-grid" onSubmit={(e) => { e.preventDefault(); restock.mutate(); }}>
          <Field label="Quantity received" htmlFor="rq"><input id="rq" className="input" type="number" min={1} required value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
          <div className="modal-actions"><button type="button" className="btn" onClick={() => setTarget(null)}>Cancel</button><button className="btn primary" disabled={restock.isPending}>Restock</button></div>
        </form>
      </Modal>
    </>
  );
}
