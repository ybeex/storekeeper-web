"use client";
import { useState } from "react";
import { Tabs } from "radix-ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { rowsOf, type Row } from "@/lib/api";
import { sk, type Role } from "@/lib/endpoints";
import { Restricted, useCan } from "@/components/restricted";
import { AutoTable, Btn, Field, Modal, PageHeader, Select, Skeleton, errMsg, useToast } from "@/components/ui";

const ROLES = [{ value: "admin", label: "Administrator" }, { value: "supervisor", label: "Supervisor" }, { value: "store_staff", label: "Store staff" }, { value: "viewer", label: "Viewer" }];

export default function Team() {
  return <Restricted cap="team"><TeamInner /></Restricted>;
}

function TeamInner() {
  const admin = useCan("invite");
  const qc = useQueryClient();
  const toast = useToast();
  const users = useQuery({ queryKey: ["users"], queryFn: () => sk.users.list({ limit: 100 }) });
  const invites = useQuery({ queryKey: ["invites"], queryFn: () => sk.users.invites.list() });
  const [open, setOpen] = useState(false);
  const [confirmOff, setConfirmOff] = useState<Row | null>(null);
  const [f, setF] = useState({ email: "", fullName: "", role: "store_staff" });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["users"] }); void qc.invalidateQueries({ queryKey: ["invites"] }); };
  const err = (e: unknown) => toast(errMsg(e), "bad");
  const invite = useMutation({ mutationFn: () => sk.users.invites.create({ email: f.email, role: f.role as Role, fullName: f.fullName || undefined }), onSuccess: () => { toast("Invitation sent"); setOpen(false); setF({ email: "", fullName: "", role: "store_staff" }); refresh(); }, onError: err });
  const update = useMutation({
    mutationFn: ({ id, b }: { id: string; b: Row; what?: "role" | "active" }) => sk.users.update(id, b),
    onSuccess: (_r, v) => { toast(v.what === "active" ? (v.b.active ? "Account reactivated" : "Account deactivated. They are signed out.") : "Role updated"); setConfirmOff(null); refresh(); },
    onError: err,
  });
  // Which row is being changed right now, so only that row shows progress and locks.
  const busyRow = (id: unknown) => update.isPending && update.variables?.id === String(id);
  const busyKind = (id: unknown) => (busyRow(id) ? update.variables?.what : undefined);
  const resend = useMutation({ mutationFn: (id: string) => sk.users.invites.resend(id), onSuccess: () => toast("Invitation resent"), onError: err });
  const revoke = useMutation({ mutationFn: (id: string) => sk.users.invites.revoke(id), onSuccess: () => { toast("Invitation revoked"); refresh(); }, onError: err });
  return (
    <>
      <PageHeader title="Team" lede="Who can sign in, and what they can do." actions={admin ? <Btn className="primary" onClick={() => setOpen(true)}><UserPlus size={16} />Invite someone</Btn> : undefined} />
      <Tabs.Root defaultValue="users">
        <Tabs.List className="tab-bar glass" aria-label="Team"><Tabs.Trigger value="users" className="tab">Users</Tabs.Trigger><Tabs.Trigger value="invites" className="tab">Invitations</Tabs.Trigger></Tabs.List>
        <Tabs.Content value="users"><div className="glass table-card">{users.isPending ? <Skeleton /> : <AutoTable rows={rowsOf(users.data)} hide={["failedLoginCount", "lockedUntil"]} actions={!admin ? undefined : (r) => (<>
          <div className="narrow" aria-busy={busyKind(r.id) === "role" || undefined}><Select value={String(r.role)} onValueChange={(role) => update.mutate({ id: String(r.id), b: { role }, what: "role" })} options={ROLES} /></div>
          <Btn className={`sm${r.active ? " danger" : ""}`} busy={busyKind(r.id) === "active"} busyLabel={r.active ? "Deactivating" : "Activating"} disabled={busyRow(r.id)}
            onClick={() => (r.active ? setConfirmOff(r) : update.mutate({ id: String(r.id), b: { active: true }, what: "active" }))}>{r.active ? "Deactivate" : "Activate"}</Btn></>)} />}</div></Tabs.Content>
        <Tabs.Content value="invites"><div className="glass table-card">{invites.isPending ? <Skeleton /> : <AutoTable rows={rowsOf(invites.data)} actions={(r) => (<>
          <Btn className="icon sm" aria-label="Resend invitation" busy={resend.isPending && resend.variables === String(r.id)} busyLabel="" onClick={() => resend.mutate(String(r.id))}><RefreshCw size={15} /></Btn>
          <Btn className="icon sm danger" aria-label="Revoke invitation" busy={revoke.isPending && revoke.variables === String(r.id)} busyLabel="" onClick={() => revoke.mutate(String(r.id))}><Trash2 size={15} /></Btn></>)} />}</div></Tabs.Content>
      </Tabs.Root>
      <Modal open={open} onOpenChange={setOpen} title="Invite someone" description="They will get an email to set a password.">
        <form className="form-grid" onSubmit={(e) => { e.preventDefault(); invite.mutate(); }}>
          <Field label="Email" htmlFor="ie"><input id="ie" type="email" className="input" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Name" htmlFor="in"><input id="in" className="input" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} /></Field>
          <Field label="Role" htmlFor="ir"><Select id="ir" value={f.role} onValueChange={(role) => setF({ ...f, role })} options={ROLES} /></Field>
          <div className="modal-actions"><Btn onClick={() => setOpen(false)}>Cancel</Btn><Btn type="submit" className="primary" busy={invite.isPending} busyLabel="Sending invite"><Mail size={16} />Send invite</Btn></div>
        </form>
      </Modal>
      <Modal open={!!confirmOff} onOpenChange={(o) => !o && !update.isPending && setConfirmOff(null)} title="Deactivate this account?"
        description={confirmOff ? `${String(confirmOff.fullName ?? confirmOff.email)} will be signed out straight away and will not be able to sign in. Everything they recorded stays in the history. You can reactivate the account later.` : undefined}>
        <div className="modal-actions">
          <Btn onClick={() => setConfirmOff(null)} disabled={update.isPending}>Keep active</Btn>
          <Btn className="danger-fill" busy={update.isPending} busyLabel="Deactivating and signing them out" onClick={() => confirmOff && update.mutate({ id: String(confirmOff.id), b: { active: false }, what: "active" })}>Deactivate</Btn>
        </div>
      </Modal>
    </>
  );
}
