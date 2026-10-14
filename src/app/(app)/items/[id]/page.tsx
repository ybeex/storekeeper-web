"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Archive, RotateCcw } from "lucide-react";
import { blobUrl, rowsOf, type Row } from "@/lib/api";
import { sk, type Condition } from "@/lib/endpoints";
import { useAuth } from "@/lib/auth";
import { PhotoField } from "@/components/photo";
import { useCan } from "@/components/restricted";
import { AutoTable, Field, Modal, Select, Skeleton, errMsg, fmtCell, useToast } from "@/components/ui";

const SHOW = ["sku", "assetTag", "type", "shelfName", "categoryName", "assetStatus", "condition", "quantityAvailable", "unit", "minThreshold", "reorderQuantity", "expectedReturnHours", "description"];

export default function ItemPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const toast = useToast();
  const item = useQuery({ queryKey: ["item", id], queryFn: () => sk.items.get(id) });
  const timeline = useQuery({ queryKey: ["item", id, "timeline"], queryFn: () => sk.items.timeline(id, { limit: 30 }) });
  const qr = useQuery({ queryKey: ["item", id, "qr"], queryFn: () => blobUrl(sk.items.qrPath(id)), staleTime: Infinity });
  const { me } = useAuth();
  const canPhoto = me?.role === "admin" || me?.role === "supervisor";
  const canMove = useCan("move");
  const canArchive = useCan("catalogWrite");
  const setPhoto = useMutation({ mutationFn: (fileId: string) => sk.items.update(id, { photoFileId: fileId }), onSuccess: () => { toast("Photo updated"); void qc.invalidateQueries({ queryKey: ["item", id] }); }, onError: (e) => toast(errMsg(e), "bad") });
  const [dlg, setDlg] = useState<null | "condition" | "status">(null);
  const [val, setVal] = useState("");
  const [note, setNote] = useState("");
  const done = (m: string) => { toast(m); setDlg(null); setVal(""); setNote(""); void qc.invalidateQueries({ queryKey: ["item", id] }); };
  const act = useMutation({
    mutationFn: async () => {
      if (dlg === "condition") await sk.transactions.condition(id, { condition: val as Condition, note: note || undefined });
      else await sk.transactions.status(id, { to: val as "available", note: note || undefined });
    },
    onSuccess: () => done("Updated"), onError: (e) => toast(errMsg(e), "bad"),
  });
  const archive = useMutation({
    mutationFn: async () => {
      if (item.data?.archivedAt) await sk.items.restore(id);
      else await sk.items.archive(id);
    },
    onSuccess: () => done(item.data?.archivedAt ? "Item restored" : "Item archived"), onError: (e) => toast(errMsg(e), "bad"),
  });
  if (item.isPending) return <Skeleton rows={6} />;
  if (item.isError || !item.data) return <p className="empty">Could not load this item.</p>;
  const it = item.data as Row;
  const isAsset = it.type === "asset";
  return (
    <>
      <Link href="/catalog" className="back"><ArrowLeft size={16} />Catalog</Link>
      <div className="page-head">
        <div><h1 className="page-title">{it.name}</h1>{it.archivedAt && <span className="badge neu">Archived</span>}</div>
        <div className="page-actions">
          {isAsset && canMove && <button className="btn" onClick={() => setDlg("condition")}>Set condition</button>}
          {isAsset && canMove && <button className="btn" onClick={() => setDlg("status")}>Change status</button>}
          {canArchive && <button className="btn" onClick={() => archive.mutate()}>{it.archivedAt ? <><RotateCcw size={16} />Restore</> : <><Archive size={16} />Archive</>}</button>}
        </div>
      </div>
      <div className="two-col">
        <section className="glass card">
          {it.photoUrl ? <img src={it.photoUrl} alt={String(it.name)} className="item-photo" /> : null}
          {canPhoto && <div className="photo-slot"><PhotoField key={String(it.photoUrl)} kind="item_photo" label={it.photoUrl ? "Replace photo" : "Add a photo"} hint="Helps people spot the right item" onChange={(fid) => fid && setPhoto.mutate(fid)} /></div>}
          <h2 className="section-title">Details</h2>
          {SHOW.filter((k) => it[k] != null && it[k] !== "").map((k) => <div key={k} className="kv"><span>{k.replace(/([A-Z])/g, " $1").toLowerCase()}</span><strong>{fmtCell(it[k])}</strong></div>)}
          {it.holder && <div className="kv"><span>holder</span><strong>{fmtCell(it.holder)}</strong></div>}
        </section>
        <section className="glass card qr-card">
          <h2 className="section-title">Tag</h2>
          {qr.data ? <img src={qr.data} alt={`QR tag for ${it.name}`} className="qr" /> : <Skeleton rows={2} />}
          <a className="btn" href={qr.data} download={`${it.sku ?? "item"}-qr.svg`}>Download tag</a>
        </section>
      </div>
      <h2 className="section-title">Timeline</h2>
      <div className="glass table-card">{timeline.isPending ? <Skeleton /> : <AutoTable rows={rowsOf(timeline.data)} hide={["itemId", "itemName", "note"]} max={7} />}</div>

      <Modal open={dlg !== null} onOpenChange={(o) => !o && setDlg(null)} title={dlg === "condition" ? "Set condition" : "Change status"}>
        <form className="form-grid" onSubmit={(e) => { e.preventDefault(); act.mutate(); }}>
          <Field label={dlg === "condition" ? "Condition" : "New status"} htmlFor="v"><Select id="v" value={val} onValueChange={setVal} options={dlg === "condition"
            ? [{ value: "good", label: "Good" }, { value: "damaged", label: "Damaged" }, { value: "needs_inspection", label: "Needs inspection" }, { value: "replaced", label: "Replaced" }]
            : [{ value: "available", label: "Available" }, { value: "under_repair", label: "Under repair" }, { value: "retired", label: "Retired" }]} /></Field>
          <Field label="Note" htmlFor="n"><textarea id="n" className="input area" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <div className="modal-actions"><button type="button" className="btn" onClick={() => setDlg(null)}>Cancel</button><button className="btn primary" disabled={!val || act.isPending}>Save</button></div>
        </form>
      </Modal>
    </>
  );
}
