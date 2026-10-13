"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs } from "radix-ui";
import { Plus, Undo2, X } from "lucide-react";
import { rowsOf, type Row } from "@/lib/api";
import { sk, type Holder } from "@/lib/endpoints";
import { AutoTable, Btn, Field, Modal, PageHeader, Select, Skeleton, errMsg, useToast } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { HolderPicker, ItemPicker } from "@/components/pickers";
import { PhotoField } from "@/components/photo";
import { useCan } from "@/components/restricted";
import { enqueue, newAction, submitOrQueue } from "@/lib/offline";

type Kind = "checkout" | "checkin" | "consume" | "restock" | "adjust" | "incident";
const TABS: [string, string][] = [["checkout", "Check out"], ["batch", "Batch"], ["checkin", "Check in"], ["consume", "Consume"], ["restock", "Restock"], ["adjust", "Adjust"], ["incident", "Loss or damage"], ["ledger", "Ledger"]];

function MovementForm({ kind }: { kind: Kind }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [item, setItem] = useState<Row | null>(null);
  const [holder, setHolder] = useState<Holder | null>(null);
  const [f, setF] = useState<Record<string, string>>({});
  const set = (k: string) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const consumable = item?.type === "consumable";
  const needsHolder = kind === "checkout";
  const showHolder = kind === "checkout" || kind === "checkin" || kind === "incident";
  const qty = f.quantity ? Number(f.quantity) : undefined;

  const run = useMutation({
    mutationFn: () => {
      const base = { itemId: String(item!.id), note: f.note || undefined, snapshotFileId: f.photo || undefined };
      const h = holder ?? undefined;
      if (kind === "checkout" || kind === "checkin" || kind === "consume" || kind === "restock") {
        const q = consumable || kind === "consume" || kind === "restock" ? qty : undefined;
        const fields: Row = kind === "checkout" ? { itemId: base.itemId, holder: h, quantity: q, purpose: f.purpose }
          : kind === "checkin" ? { itemId: base.itemId, holder: h, quantity: q, condition: f.condition }
          : kind === "consume" ? { itemId: base.itemId, quantity: q, purpose: f.purpose }
          : { itemId: base.itemId, quantity: q };
        const action = newAction(kind, `${kind} ${String(item!.name)}`, fields, f.note);
        const online: Row = { ...action };
        delete online.type; delete online.clientActionId; delete online.occurredAt; delete online.label;
        if (kind === "checkout" && f.due) online.expectedReturnAt = new Date(f.due).toISOString();
        if (f.photo) online.snapshotFileId = f.photo; // not part of the offline queue: the sync endpoint takes no photos
        return submitOrQueue(action, (key) => sk.transactions[kind](online, key));
      }
      switch (kind) {
        case "adjust": return sk.transactions.adjust({ ...base, delta: Number(f.delta), reason: f.reason });
        case "incident": return (f.incident === "damage" ? sk.transactions.damage : sk.transactions.loss)({ ...base, holder: h, quantity: consumable ? qty : undefined, reason: f.reason });
      }
    },
    onSuccess: (res) => {
      const r = res as Row | undefined;
      const pending = r?.status === "pending" || r?.approvalRequestId;
      toast(r?.queued ? "Saved on this device. It will sync when you are back online." : pending ? "Sent for approval" : "Recorded");
      setItem(null); setHolder(null); setF({});
      void qc.invalidateQueries();
    },
    onError: (e) => toast(errMsg(e), "bad"),
  });
  const ready = item && (!needsHolder || holder) && (kind !== "adjust" || (f.delta && f.reason)) && (kind !== "incident" || (f.incident && (f.reason?.length ?? 0) >= 3)) && (!(["consume", "restock"] as Kind[]).includes(kind) || qty);

  return (
    <form className="glass card form-grid two" onSubmit={(e) => { e.preventDefault(); if (ready) run.mutate(); }}>
      <div className="span-2"><Field label="Item"><ItemPicker value={item} onPick={setItem} type={kind === "consume" || kind === "restock" ? "consumable" : undefined} /></Field></div>
      {showHolder && <div className="span-2"><Field label={kind === "checkout" ? "Issue to" : "Returned by"}><HolderPicker value={holder} onChange={setHolder} /></Field></div>}
      {(consumable || kind === "consume" || kind === "restock") && kind !== "adjust" && <Field label="Quantity" htmlFor="q"><input id="q" type="number" min={1} className="input" value={f.quantity ?? ""} onChange={(e) => set("quantity")(e.target.value)} /></Field>}
      {kind === "checkout" && <Field label="Expected back" htmlFor="due"><input id="due" type="datetime-local" className="input" value={f.due ?? ""} onChange={(e) => set("due")(e.target.value)} /></Field>}
      {(kind === "checkout" || kind === "consume") && <Field label="Purpose or job" htmlFor="p"><input id="p" className="input" value={f.purpose ?? ""} onChange={(e) => set("purpose")(e.target.value)} placeholder="Concrete works, Project Alpha" /></Field>}
      {kind === "checkin" && item?.type !== "consumable" && <Field label="Condition" htmlFor="c"><Select id="c" value={f.condition} onValueChange={set("condition")} options={[{ value: "good", label: "Good" }, { value: "damaged", label: "Damaged" }, { value: "needs_inspection", label: "Needs inspection" }, { value: "replaced", label: "Replaced" }]} placeholder="Keep last known" /></Field>}
      {kind === "adjust" && <>
        <Field label="Change in quantity" htmlFor="d" hint="Negative removes stock"><input id="d" type="number" className="input" value={f.delta ?? ""} onChange={(e) => set("delta")(e.target.value)} /></Field>
        <Field label="Reason" htmlFor="r"><Select id="r" value={f.reason} onValueChange={set("reason")} options={[{ value: "count_correction", label: "Physical count correction" }, { value: "opening_balance", label: "Opening balance correction" }, { value: "unrecorded_movement", label: "Unrecorded movement" }, { value: "damage", label: "Damage" }, { value: "loss", label: "Loss" }, { value: "other", label: "Other (add a note)" }]} /></Field>
      </>}
      {kind === "incident" && <>
        <Field label="Event" htmlFor="ev"><Select id="ev" value={f.incident} onValueChange={set("incident")} options={[{ value: "loss", label: "Lost" }, { value: "damage", label: "Damaged" }]} /></Field>
        <Field label="What happened" htmlFor="why"><input id="why" className="input" value={f.reason ?? ""} onChange={(e) => set("reason")(e.target.value)} placeholder="Lost on level 3" /></Field>
      </>}
      {(kind === "checkout" || kind === "checkin" || kind === "adjust" || kind === "incident") && (
        <div className="span-2"><Field label="Photo evidence"><PhotoField key={String(item?.id ?? "none") + String(run.isSuccess)} kind="transaction_snapshot" onChange={(id) => set("photo")(id ?? "")} hint="Useful for damage, loss and expensive tools" /></Field></div>
      )}
      <div className="span-2"><Field label="Note" htmlFor="note"><textarea id="note" className="input area" value={f.note ?? ""} onChange={(e) => set("note")(e.target.value)} /></Field></div>
      <div className="modal-actions span-2"><Btn type="submit" className="primary lg shine" busy={run.isPending} busyLabel="Saving" disabled={!ready}>Confirm</Btn></div>
    </form>
  );
}

function Batch() {
  const qc = useQueryClient();
  const toast = useToast();
  const [holder, setHolder] = useState<Holder | null>(null);
  const [lines, setLines] = useState<{ item: Row; qty: string }[]>([]);
  const [adding, setAdding] = useState<Row | null>(null);
  const run = useMutation({
    mutationFn: async () => {
      if (!navigator.onLine) {
        lines.forEach((l) => enqueue(newAction("checkout", `checkout ${String(l.item.name)}`, { itemId: l.item.id, holder, quantity: l.item.type === "consumable" ? Number(l.qty || 1) : undefined })));
        return { queued: true };
      }
      return sk.transactions.batchCheckout({ holder, lines: lines.map((l) => ({ itemId: l.item.id, quantity: l.item.type === "consumable" ? Number(l.qty || 1) : undefined })) });
    },
    onSuccess: (r) => { toast((r as Row).queued ? `Saved ${lines.length} items on this device. They will sync when you are back online.` : `Checked out ${lines.length} items`); setLines([]); setHolder(null); void qc.invalidateQueries(); },
    onError: (e) => toast(errMsg(e), "bad"),
  });
  return (
    <div className="glass card form-grid">
      <Field label="Issue to"><HolderPicker value={holder} onChange={setHolder} /></Field>
      <Field label="Add items"><ItemPicker value={adding} onPick={(r) => { setLines((l) => l.some((x) => x.item.id === r.id) ? l : [...l, { item: r, qty: "1" }]); setAdding(null); }} /></Field>
      {lines.map((l, i) => (
        <div key={String(l.item.id)} className="line"><span>{String(l.item.name)}</span>
          {l.item.type === "consumable" ? <input className="input qty" type="number" min={1} aria-label="Quantity" value={l.qty} onChange={(e) => setLines((s) => s.map((x, j) => j === i ? { ...x, qty: e.target.value } : x))} /> : <span className="mono">asset</span>}
          <button type="button" className="btn icon sm" aria-label="Remove line" onClick={() => setLines((s) => s.filter((_, j) => j !== i))}><X size={15} /></button></div>
      ))}
      <div className="modal-actions"><Btn className="primary lg shine" busy={run.isPending} busyLabel="Checking out" disabled={!holder || lines.length === 0} onClick={() => run.mutate()}><Plus size={16} />Check out {lines.length || ""} items</Btn></div>
    </div>
  );
}

const nameOf = (v: unknown) => (v && typeof v === "object" ? String((v as Row).name ?? "") : "");
/** One readable row per ledger entry: names, never database ids. */
const friendly = (t: Row): Row => ({
  id: t.id,
  when: t.occurredAt,
  type: String(t.type ?? "").replace(/_/g, " "),
  item: nameOf(t.item),
  quantity: t.quantity ?? "",
  holder: nameOf(t.holder),
  recordedBy: nameOf(t.actor),
  reason: t.reason ?? t.purpose ?? t.note ?? "",
  condition: t.condition ? String(t.condition).replace(/_/g, " ") : "",
});

function Ledger() {
  const canCorrect = useCan("correct");
  const qc = useQueryClient();
  const toast = useToast();
  const [type, setType] = useState("all");
  const [target, setTarget] = useState<Row | null>(null);
  const [note, setNote] = useState("");
  const { data, isPending } = useQuery({ queryKey: ["transactions", type], queryFn: () => sk.transactions.list({ limit: 50, type: type === "all" ? undefined : type }) });
  const fix = useMutation({
    mutationFn: () => sk.transactions.correct(String(target!.id), note),
    onSuccess: () => { toast("Correction recorded"); setTarget(null); setNote(""); void qc.invalidateQueries(); },
    onError: (e) => toast(errMsg(e), "bad"),
  });
  return (
    <div>
      <div className="toolbar"><div className="narrow"><Select value={type} onValueChange={setType} options={[{ value: "all", label: "All types" }, ...["checkout", "checkin", "consume", "restock", "adjustment", "loss", "damage", "transfer"].map((t) => ({ value: t, label: t }))]} /></div></div>
      <div className="glass table-card">{isPending ? <Skeleton /> : <AutoTable rows={rowsOf(data).map(friendly)} hide={["id"]} actions={!canCorrect ? undefined : (r) => <button className="btn icon sm" aria-label="Record a correction" onClick={() => setTarget(r)}><Undo2 size={15} /></button>} />}</div>
      <Modal open={!!target} onOpenChange={(o) => !o && setTarget(null)} title="Record a correction" description="History is never edited. This adds a correction on top of the original entry.">
        <form className="form-grid" onSubmit={(e) => { e.preventDefault(); fix.mutate(); }}>
          <Field label="What was wrong" htmlFor="cn"><textarea id="cn" className="input area" required minLength={3} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <div className="modal-actions"><Btn onClick={() => setTarget(null)} disabled={fix.isPending}>Cancel</Btn><Btn type="submit" className="primary" busy={fix.isPending} busyLabel="Adding correction" disabled={note.length < 3}>Add correction</Btn></div>
        </form>
      </Modal>
    </div>
  );
}

export default function Transactions() {
  const canMove = useCan("move");
  const { me } = useAuth();
  return (
    <>
      <PageHeader title="Transactions" lede={me?.role === "store_staff" ? "The movements you have recorded." : "Every movement, recorded once and never rewritten."} />
      <Tabs.Root defaultValue={canMove ? "checkout" : "ledger"}>
        <Tabs.List className="tab-bar glass" aria-label="Transaction types">{TABS.filter(([v]) => canMove || v === "ledger").map(([v, l]) => <Tabs.Trigger key={v} value={v} className="tab">{l}</Tabs.Trigger>)}</Tabs.List>
        {canMove && (["checkout", "checkin", "consume", "restock", "adjust", "incident"] as Kind[]).map((k) => <Tabs.Content key={k} value={k}><MovementForm kind={k} /></Tabs.Content>)}
        {canMove && <Tabs.Content value="batch"><Batch /></Tabs.Content>}
        <Tabs.Content value="ledger"><Ledger /></Tabs.Content>
      </Tabs.Root>
    </>
  );
}
