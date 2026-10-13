"use client";
import { useEffect, useState } from "react";
import { Tabs } from "radix-ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rowsOf, type Row } from "@/lib/api";
import { sk } from "@/lib/endpoints";
import { useAuth } from "@/lib/auth";
import { AutoTable, Btn, Field, PageHeader, Select, errMsg, useToast } from "@/components/ui";
import { ResourceManager } from "@/components/resource";
import { cacheMeta, refreshCache } from "@/lib/cache";

const OPS = ["adjustment", "loss", "damage", "retirement", "manual_correction", "checkout", "checkin"];
const MODES = [{ value: "direct", label: "Direct" }, { value: "request", label: "Request" }, { value: "approval", label: "Needs approval" }];

function Organization() {
  const qc = useQueryClient();
  const toast = useToast();
  const s = useQuery({ queryKey: ["org-settings"], queryFn: sk.organization.settings });
  const p = useQuery({ queryKey: ["policies"], queryFn: sk.organization.policies });
  const [hours, setHours] = useState("");
  const [reason, setReason] = useState(false);
  const [modes, setModes] = useState<Record<string, string>>({});
  useEffect(() => { const d = s.data as Row | undefined; if (d) { setHours(d.defaultExpectedReturnHours == null ? "" : String(d.defaultExpectedReturnHours)); setReason(!!d.requireReconciliationReason); } }, [s.data]);
  useEffect(() => { setModes(Object.fromEntries(rowsOf((p.data as Row | undefined)?.policies ?? p.data).map((r) => [String(r.operation), String(r.mode)]))); }, [p.data]);
  const err = (e: unknown) => toast(errMsg(e), "bad");
  const saveS = useMutation({ mutationFn: () => sk.organization.updateSettings({ requireReconciliationReason: reason, defaultExpectedReturnHours: hours ? Number(hours) : null }), onSuccess: () => { toast("Settings saved"); void qc.invalidateQueries({ queryKey: ["org-settings"] }); }, onError: err });
  const saveP = useMutation({ mutationFn: () => sk.organization.setPolicies(OPS.map((o) => ({ operation: o, mode: modes[o] ?? "direct" }))), onSuccess: () => toast("Policies saved"), onError: err });
  return (
    <div className="two-col">
      <section className="glass card form-grid"><h2 className="section-title">Defaults</h2>
        <Field label="Default return window (hours)" htmlFor="h"><input id="h" type="number" min={1} className="input" value={hours} onChange={(e) => setHours(e.target.value)} /></Field>
        <label className="check"><input type="checkbox" checked={reason} onChange={(e) => setReason(e.target.checked)} />Require a reason for count variances</label>
        <div className="modal-actions"><Btn className="primary" onClick={() => saveS.mutate()} busy={saveS.isPending} busyLabel="Saving">Save</Btn></div></section>
      <section className="glass card form-grid"><h2 className="section-title">Approval policies</h2>
        {OPS.map((o) => <div key={o} className="line"><span style={{ textTransform: "capitalize" }}>{o.replace("_", " ")}</span><div className="narrow"><Select value={modes[o] ?? "direct"} onValueChange={(v) => setModes((m) => ({ ...m, [o]: v }))} options={MODES} /></div></div>)}
        <div className="modal-actions"><Btn className="primary" onClick={() => saveP.mutate()} busy={saveP.isPending} busyLabel="Saving policies">Save policies</Btn></div></section>
    </div>
  );
}

function OfflineData() {
  const toast = useToast();
  const qc = useQueryClient();
  const meta = useQuery({ queryKey: ["cache-meta"], queryFn: cacheMeta, networkMode: "always" });
  const refresh = useMutation({ mutationFn: refreshCache, onSuccess: () => { toast("Offline data updated"); void qc.invalidateQueries({ queryKey: ["cache-meta"] }); }, onError: (e) => toast(errMsg(e), "bad") });
  const m = meta.data;
  return (
    <section className="glass card form-grid" style={{ marginBottom: 24 }}>
      <h2 className="section-title">Offline data</h2>
      <p className="muted">{m ? `${m.items} items and ${m.holders} people, teams and jobs are saved on this device (updated ${new Date(m.syncedAt).toLocaleString()}). Scanning and search use them when there is no signal.` : "Nothing is saved on this device yet. It downloads automatically while you are online."}</p>
      <div className="modal-actions"><Btn onClick={() => refresh.mutate()} busy={refresh.isPending} busyLabel="Updating">Update now</Btn></div>
    </section>
  );
}

function Account() {
  const { me } = useAuth();
  const toast = useToast();
  const sessions = useQuery({ queryKey: ["sessions"], queryFn: sk.auth.sessions });
  const qc = useQueryClient();
  const [name, setName] = useState(me?.fullName ?? "");
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const err = (e: unknown) => toast(errMsg(e), "bad");
  const prof = useMutation({ mutationFn: () => sk.auth.updateProfile({ fullName: name }), onSuccess: () => toast("Profile updated"), onError: err });
  const change = useMutation({ mutationFn: () => sk.auth.changePassword(pw), onSuccess: () => { toast("Password changed"); setPw({ currentPassword: "", newPassword: "" }); }, onError: err });
  const revoke = useMutation({ mutationFn: (id: string) => sk.auth.revokeSession(id), onSuccess: () => { toast("Session ended"); void qc.invalidateQueries({ queryKey: ["sessions"] }); }, onError: err });
  return (
    <>
      <div className="two-col">
        <form className="glass card form-grid" onSubmit={(e) => { e.preventDefault(); prof.mutate(); }}><h2 className="section-title">Profile</h2>
          <Field label="Full name" htmlFor="pn"><input id="pn" className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Email"><input className="input" value={me?.email ?? ""} disabled /></Field>
          <div className="modal-actions"><Btn type="submit" className="primary" busy={prof.isPending} busyLabel="Saving">Save</Btn></div></form>
        <form className="glass card form-grid" onSubmit={(e) => { e.preventDefault(); change.mutate(); }}><h2 className="section-title">Password</h2>
          <Field label="Current password" htmlFor="cp"><input id="cp" type="password" autoComplete="current-password" className="input" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
          <Field label="New password" htmlFor="np" hint="At least 12 characters"><input id="np" type="password" autoComplete="new-password" className="input" minLength={12} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
          <div className="modal-actions"><Btn type="submit" className="primary" busy={change.isPending} busyLabel="Changing password" disabled={pw.newPassword.length < 12}>Change password</Btn></div></form>
      </div>
      <OfflineData />
      <h2 className="section-title">Active sessions</h2>
      <div className="glass table-card"><AutoTable rows={rowsOf(sessions.data)} actions={(r) => <Btn className="sm" busy={revoke.isPending && revoke.variables === String(r.id)} busyLabel="Ending" onClick={() => revoke.mutate(String(r.id))}>End session</Btn>} /></div>
    </>
  );
}

export default function Settings() {
  const { me } = useAuth();
  const admin = me?.role === "admin";
  return (
    <>
      <PageHeader title="Settings" lede="Your account and, for administrators, the whole store." />
      <Tabs.Root defaultValue="account">
        <Tabs.List className="tab-bar glass" aria-label="Settings"><Tabs.Trigger value="account" className="tab">Account</Tabs.Trigger>{admin && <><Tabs.Trigger value="org" className="tab">Organization</Tabs.Trigger><Tabs.Trigger value="locations" className="tab">Locations</Tabs.Trigger></>}</Tabs.List>
        <Tabs.Content value="account"><Account /></Tabs.Content>
        {admin && <Tabs.Content value="org"><Organization /></Tabs.Content>}
        {admin && <Tabs.Content value="locations"><ResourceManager noun="location" qk="locations" load={() => sk.locations.list()} create={sk.locations.create} update={sk.locations.update} remove={sk.locations.remove} fields={[
          { name: "name", label: "Name", required: true }, { name: "code", label: "Code" }, { name: "kind", label: "Kind", kind: "select", options: [{ value: "store", label: "Store" }, { value: "site", label: "Site" }, { value: "warehouse", label: "Warehouse" }, { value: "area", label: "Area" }] }, { name: "address", label: "Address", kind: "textarea" }]} /></Tabs.Content>}
      </Tabs.Root>
    </>
  );
}
