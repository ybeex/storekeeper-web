"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs } from "radix-ui";
import { Play } from "lucide-react";
import { rowsOf, type Row } from "@/lib/api";
import { sk } from "@/lib/endpoints";
import { AutoTable, Btn, Field, Modal, PageHeader, Select, Skeleton, errMsg, useToast } from "@/components/ui";
import { ItemPicker, useOptions } from "@/components/pickers";
import { ResourceManager } from "@/components/resource";

function Session({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const { data } = useQuery({ queryKey: ["recon", id], queryFn: () => sk.reconciliation.get(id) });
  const s = (data ?? {}) as Row;
  const [item, setItem] = useState<Row | null>(null);
  const [phys, setPhys] = useState("");
  const [reason, setReason] = useState("");
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["recon"] }); void qc.invalidateQueries({ queryKey: ["reconciliation"] }); };
  const count = useMutation({
    mutationFn: () => sk.reconciliation.count(id, { itemId: String(item!.id), physicalQuantity: Number(phys), reason: reason || undefined }),
    onSuccess: () => { toast("Count recorded"); setItem(null); setPhys(""); setReason(""); refresh(); }, onError: (e) => toast(errMsg(e), "bad"),
  });
  const close = useMutation({ mutationFn: () => sk.reconciliation.close(id), onSuccess: () => { toast("Count closed"); refresh(); onClose(); }, onError: (e) => toast(errMsg(e), "bad") });
  const lines = rowsOf(s.counts ?? s.lines);
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title="Count session" description={`Status: ${s.status ?? "loading"}`} wide>
      {s.status === "open" && (
        <form className="form-grid two" onSubmit={(e) => { e.preventDefault(); count.mutate(); }}>
          <div className="span-2"><Field label="Item"><ItemPicker value={item} onPick={setItem} /></Field></div>
          <Field label="Physical quantity" htmlFor="pq"><input id="pq" type="number" min={0} className="input" value={phys} onChange={(e) => setPhys(e.target.value)} /></Field>
          <Field label="Reason for any variance" htmlFor="pr"><input id="pr" className="input" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
          <div className="modal-actions span-2"><Btn onClick={() => close.mutate()} busy={close.isPending} busyLabel="Closing the count" disabled={count.isPending}>Close count</Btn><Btn type="submit" className="primary" busy={count.isPending} busyLabel="Recording" disabled={!item || phys === "" || close.isPending}>Record count</Btn></div>
        </form>
      )}
      <div className="glass table-card">{lines.length ? <AutoTable rows={lines} hide={["sessionId"]} /> : <p className="empty">No counts recorded yet.</p>}</div>
    </Modal>
  );
}

export default function Reconciliation() {
  const qc = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState<string | null>(null);
  const [start, setStart] = useState(false);
  const [scope, setScope] = useState("location");
  const [scopeId, setScopeId] = useState("");
  const locs = useOptions("locations", () => sk.locations.list(), (r) => String(r.name));
  const shelves = useOptions("shelves", () => sk.shelves.list(), (r) => String(r.name));
  const cats = useOptions("categories", () => sk.categories.list(), (r) => String(r.name));
  const list = useQuery({ queryKey: ["reconciliation"], queryFn: () => sk.reconciliation.list({ limit: 30 }) });
  const opts = scope === "location" ? locs : scope === "shelf" ? shelves : cats;
  const go = useMutation({
    mutationFn: () => sk.reconciliation.start({ scope, ...(scope === "location" ? { locationId: scopeId } : { scopeId }) }),
    onSuccess: (r) => { toast("Count started"); setStart(false); void qc.invalidateQueries({ queryKey: ["reconciliation"] }); setOpen(String((r as Row).id ?? "")); },
    onError: (e) => toast(errMsg(e), "bad"),
  });
  return (
    <>
      <PageHeader title="Reconciliation" lede="Compare the system with the shelf and explain every difference." actions={<button className="btn primary" onClick={() => setStart(true)}><Play size={16} />Start a count</button>} />
      <Tabs.Root defaultValue="sessions">
        <Tabs.List className="tab-bar glass" aria-label="Reconciliation"><Tabs.Trigger value="sessions" className="tab">Counts</Tabs.Trigger><Tabs.Trigger value="schedules" className="tab">Schedules</Tabs.Trigger></Tabs.List>
        <Tabs.Content value="sessions"><div className="glass table-card">{list.isPending ? <Skeleton /> : <AutoTable rows={rowsOf(list.data)} onRow={(r) => setOpen(String(r.id))} />}</div></Tabs.Content>
        <Tabs.Content value="schedules"><ResourceManager noun="schedule" qk="schedules" load={() => sk.reconciliation.schedules()} create={sk.reconciliation.createSchedule} update={sk.reconciliation.updateSchedule} fields={[
          { name: "scope", label: "Scope", kind: "select", createOnly: true, options: [{ value: "location", label: "Location" }, { value: "shelf", label: "Shelf" }, { value: "category", label: "Category" }, { value: "item", label: "Item" }] },
          { name: "locationId", label: "Location", kind: "select", createOnly: true, optionsFrom: { qk: "locations", load: () => sk.locations.list(), label: (r: Row) => String(r.name) } },
          { name: "intervalDays", label: "Every (days)", kind: "number", required: true }, { name: "firstDueAt", label: "First due (ISO date-time)", createOnly: true, placeholder: "2026-11-01T08:00:00Z" }]} /></Tabs.Content>
      </Tabs.Root>
      <Modal open={start} onOpenChange={setStart} title="Start a count">
        <form className="form-grid" onSubmit={(e) => { e.preventDefault(); go.mutate(); }}>
          <Field label="Scope" htmlFor="sc"><Select id="sc" value={scope} onValueChange={(v) => { setScope(v); setScopeId(""); }} options={[{ value: "location", label: "Whole location" }, { value: "shelf", label: "A shelf" }, { value: "category", label: "A category" }]} /></Field>
          <Field label="Which one" htmlFor="sid"><Select id="sid" value={scopeId} onValueChange={setScopeId} options={opts} placeholder="Choose" /></Field>
          <div className="modal-actions"><Btn onClick={() => setStart(false)} disabled={go.isPending}>Cancel</Btn><Btn type="submit" className="primary" busy={go.isPending} busyLabel="Starting" disabled={!scopeId}>Start</Btn></div>
        </form>
      </Modal>
      {open && <Session id={open} onClose={() => setOpen(null)} />}
    </>
  );
}
