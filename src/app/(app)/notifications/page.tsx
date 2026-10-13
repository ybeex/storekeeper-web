"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs } from "radix-ui";
import { CheckCheck, Megaphone } from "lucide-react";
import { rowsOf, type Row } from "@/lib/api";
import { sk, type Role } from "@/lib/endpoints";
import { useAuth } from "@/lib/auth";
import { Btn, Empty, Field, Modal, PageHeader, Skeleton, errMsg, fmtCell, useToast } from "@/components/ui";

const ROLES: Role[] = ["admin", "supervisor", "store_staff", "viewer"];

function Rules() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ["rules"], queryFn: sk.notifications.rules });
  const [edits, setEdits] = useState<Record<string, Row>>({});
  // The API answers { rules: [...] }: one entry per alert type, using the built-in default until an admin changes it.
  const rules = (((data as { rules?: Row[] } | undefined)?.rules ?? []) as Row[]).map((r) => ({ ...r, ...edits[String(r.type)] }));
  const dirty = Object.keys(edits).length > 0;
  const save = useMutation({
    mutationFn: () => sk.notifications.setRules(rules.map((r) => ({ type: r.type, roles: r.roles, inApp: r.inApp, email: r.email }))),
    onSuccess: async () => { toast("Rules saved"); setEdits({}); await qc.invalidateQueries({ queryKey: ["rules"] }); },
    onError: (e) => toast(errMsg(e), "bad"),
  });
  const patch = (type: string, v: Row) => setEdits((s) => ({ ...s, [type]: { ...s[type], ...v } }));
  if (isPending) return <div className="glass card"><Skeleton rows={5} /></div>;
  if (isError) return <div className="glass card empty">Could not load the rules.<Btn onClick={() => void refetch()}>Try again</Btn></div>;
  return (
    <div className="glass card">
      <p className="muted rules-intro">Each alert below is sent to the roles you switch on. <strong>In app</strong> puts it in their inbox; <strong>Email</strong> also sends it to their address. Until you change one, it uses the default shown here.</p>
      {rules.map((r) => (
        <div key={String(r.type)} className="rule">
          <div className="rule-what"><strong>{String(r.label ?? String(r.type).replace(/_/g, " "))}</strong>{r.description ? <span className="muted small">{String(r.description)}</span> : null}</div>
          <div className="chips" role="group" aria-label={`Who receives ${String(r.label ?? r.type)}`}>{ROLES.map((ro) => { const on = (r.roles as string[]).includes(ro); return <button key={ro} type="button" aria-pressed={on} className={`chip-btn${on ? " on" : ""}`} onClick={() => patch(String(r.type), { roles: on ? (r.roles as string[]).filter((x) => x !== ro) : [...(r.roles as string[]), ro] })}>{ro.replace("_", " ")}</button>; })}</div>
          <label className="check"><input type="checkbox" checked={!!r.inApp} onChange={(e) => patch(String(r.type), { inApp: e.target.checked })} />In app</label>
          <label className="check"><input type="checkbox" checked={!!r.email} onChange={(e) => patch(String(r.type), { email: e.target.checked })} />Email</label>
        </div>
      ))}
      <div className="modal-actions"><Btn className="primary" busy={save.isPending} busyLabel="Saving rules" disabled={!dirty} onClick={() => save.mutate()}>Save rules</Btn></div>
    </div>
  );
}

export default function Notifications() {
  const { me } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const [ann, setAnn] = useState(false);
  const [f, setF] = useState({ title: "", body: "", roles: ["admin", "supervisor", "store_staff"] as string[] });
  const { data, isPending } = useQuery({ queryKey: ["notifications"], queryFn: () => sk.notifications.list({ limit: 50 }) });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["notifications"] }); void qc.invalidateQueries({ queryKey: ["unread"] }); };
  const readAll = useMutation({ mutationFn: sk.notifications.readAll, onSuccess: refresh });
  const read = useMutation({ mutationFn: (id: string) => sk.notifications.read(id), onSuccess: refresh });
  const announce = useMutation({ mutationFn: () => sk.notifications.announce(f), onSuccess: () => { toast("Announcement sent"); setAnn(false); setF({ ...f, title: "", body: "" }); refresh(); }, onError: (e) => toast(errMsg(e), "bad") });
  const rows = rowsOf(data);
  const canManage = me?.role === "admin" || me?.role === "supervisor";
  return (
    <>
      <PageHeader title="Notifications" lede={me?.role === "admin" ? "Alerts routed to the right roles." : undefined} actions={<>
        {canManage && <Btn onClick={() => setAnn(true)}><Megaphone size={16} />Announce</Btn>}
        <Btn busy={readAll.isPending} busyLabel="Marking read" onClick={() => readAll.mutate()}><CheckCheck size={16} />Mark all read</Btn></>} />
      <Tabs.Root defaultValue="inbox">
        <Tabs.List className="tab-bar glass" aria-label="Notifications"><Tabs.Trigger value="inbox" className="tab">Inbox</Tabs.Trigger>{me?.role === "admin" && <Tabs.Trigger value="rules" className="tab">Rules</Tabs.Trigger>}</Tabs.List>
        <Tabs.Content value="inbox"><div className="glass table-card">
          {isPending ? <Skeleton /> : rows.length === 0 ? <Empty>You are all caught up.</Empty> : rows.map((n) => (
            <button key={String(n.id)} className={`note${n.read ? "" : " unread"}`} onClick={() => !n.read && read.mutate(String(n.id))}>
              <strong>{String(n.title)}</strong><span className="muted">{String(n.body ?? "")}</span><span className="mono">{fmtCell(n.createdAt)}</span>
            </button>))}
        </div></Tabs.Content>
        <Tabs.Content value="rules"><Rules /></Tabs.Content>
      </Tabs.Root>
      <Modal open={ann} onOpenChange={setAnn} title="Send an announcement">
        <form className="form-grid" onSubmit={(e) => { e.preventDefault(); announce.mutate(); }}>
          <Field label="Title" htmlFor="at"><input id="at" className="input" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Message" htmlFor="ab"><textarea id="ab" className="input area" required value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
          <div className="chips">{ROLES.map((ro) => { const on = f.roles.includes(ro); return <button key={ro} type="button" aria-pressed={on} className={`chip-btn${on ? " on" : ""}`} onClick={() => setF({ ...f, roles: on ? f.roles.filter((x) => x !== ro) : [...f.roles, ro] })}>{ro.replace("_", " ")}</button>; })}</div>
          <div className="modal-actions"><Btn onClick={() => setAnn(false)}>Cancel</Btn><Btn type="submit" className="primary" busy={announce.isPending} busyLabel="Sending" disabled={!f.roles.length}>Send</Btn></div>
        </form>
      </Modal>
    </>
  );
}
