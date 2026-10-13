"use client";
import { useState } from "react";
import { Tabs } from "radix-ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, X } from "lucide-react";
import { rowsOf, type Row } from "@/lib/api";
import { sk } from "@/lib/endpoints";
import { Modal, PageHeader, Select, errMsg, useToast } from "@/components/ui";
import { ResourceManager } from "@/components/resource";
import { useOptions } from "@/components/pickers";
import { useCan } from "@/components/restricted";

function Members({ team, onClose }: { team: Row; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [pid, setPid] = useState("");
  const people = useOptions("people", () => sk.people.list(), (r) => String(r.fullName));
  const detail = useQuery({ queryKey: ["team", team.id], queryFn: () => sk.teams.get(String(team.id)) });
  const members = rowsOf((detail.data as Row | undefined)?.members);
  const refresh = () => void qc.invalidateQueries({ queryKey: ["team", team.id] });
  const add = useMutation({ mutationFn: () => sk.teams.addMembers(String(team.id), [pid]), onSuccess: () => { setPid(""); refresh(); toast("Member added"); }, onError: (e) => toast(errMsg(e), "bad") });
  const rm = useMutation({ mutationFn: (id: string) => sk.teams.removeMember(String(team.id), id), onSuccess: () => { refresh(); toast("Member removed"); }, onError: (e) => toast(errMsg(e), "bad") });
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={`${team.name} members`}>
      <div className="form-grid">
        <div className="holder-picker"><Select value={pid} onValueChange={setPid} options={people} placeholder="Add a person" /><button className="btn primary" disabled={!pid || add.isPending} onClick={() => add.mutate()}><UserPlus size={16} />Add</button></div>
        {members.length === 0 && <p className="muted">No members yet.</p>}
        {members.map((m) => <div key={String(m.id ?? m.personId)} className="line"><span>{String(m.fullName ?? m.name ?? m.personId)}</span><button className="btn icon sm" aria-label="Remove member" onClick={() => rm.mutate(String(m.id ?? m.personId))}><X size={15} /></button></div>)}
      </div>
    </Modal>
  );
}

export default function Holders() {
  const w = useCan("holdersWrite");
  const [team, setTeam] = useState<Row | null>(null);
  return (
    <>
      <PageHeader title="Holders" lede="The people, teams and jobs that receive responsibility for items." />
      <Tabs.Root defaultValue="people">
        <Tabs.List className="tab-bar glass" aria-label="Holder types">{["people", "teams", "jobs"].map((t) => <Tabs.Trigger key={t} value={t} className="tab" style={{ textTransform: "capitalize" }}>{t}</Tabs.Trigger>)}</Tabs.List>
        <Tabs.Content value="people"><ResourceManager noun="person" qk="people" load={() => sk.people.list({ limit: 100 })} create={w ? sk.people.create : undefined} update={w ? sk.people.update : undefined} remove={w ? sk.people.remove : undefined} fields={[
          { name: "fullName", label: "Full name", required: true }, { name: "employeeCode", label: "Employee code" }, { name: "phone", label: "Phone" }, { name: "email", label: "Email", kind: "email" }]} /></Tabs.Content>
        <Tabs.Content value="teams"><ResourceManager noun="team" qk="teams" load={() => sk.teams.list()} create={w ? sk.teams.create : undefined} update={w ? sk.teams.update : undefined} remove={w ? sk.teams.remove : undefined}
          rowExtra={(r) => w ? <button className="btn sm" onClick={() => setTeam(r)}>Members</button> : null}
          fields={[{ name: "name", label: "Name", required: true }, { name: "kind", label: "Kind", kind: "select", options: [{ value: "team", label: "Team" }, { value: "department", label: "Department" }] }]} /></Tabs.Content>
        <Tabs.Content value="jobs"><ResourceManager noun="job" qk="jobs" load={() => sk.jobs.list()} create={w ? sk.jobs.create : undefined} update={w ? sk.jobs.update : undefined} remove={w ? sk.jobs.remove : undefined} fields={[
          { name: "name", label: "Name", required: true }, { name: "code", label: "Code" }]} /></Tabs.Content>
      </Tabs.Root>
      {team && <Members team={team} onClose={() => setTeam(null)} />}
    </>
  );
}
