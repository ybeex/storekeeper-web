"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs } from "radix-ui";
import { Download } from "lucide-react";
import { download, rowsOf, type Row } from "@/lib/api";
import { sk } from "@/lib/endpoints";
import { useCan } from "@/components/restricted";
import { useAuth } from "@/lib/auth";
import { AutoTable, Btn, Empty, PageHeader, Skeleton, errMsg, useToast } from "@/components/ui";

function Feed({ qk, load, hide, actions }: { qk: string; load: () => Promise<unknown>; hide?: string[]; actions?: (r: Row) => React.ReactNode }) {
  const { data, isPending } = useQuery({ queryKey: [qk], queryFn: load });
  const rows = rowsOf(data);
  return <div className="glass table-card">{isPending ? <Skeleton /> : rows.length === 0 ? <Empty>Nothing recorded.</Empty> : <AutoTable rows={rows} hide={hide} actions={actions} />}</div>;
}

export default function Activity() {
  const canAudit = useCan("audit");
  const canExport = useCan("exportAudit");
  const { me } = useAuth();
  const mine = me?.role === "store_staff"; // staff see only the activity they performed; the server enforces it
  const qc = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const resolve = useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: "keep_server" | "apply_client" }) => sk.sync.resolve(id, { resolution, note: "Resolved from the web app" }),
    onSuccess: () => { toast("Conflict resolved"); void qc.invalidateQueries(); }, onError: (e) => toast(errMsg(e), "bad"),
  });
  return (
    <>
      <PageHeader title={mine ? "My activity" : "Activity"} lede={mine ? "What you have recorded." : "Who did what, and what needs a decision."} actions={canExport ? <button className="btn" disabled={busy} onClick={() => { setBusy(true); download(`${sk.audit.exportPath}`, "audit-log.csv").catch((e) => toast(errMsg(e), "bad")).finally(() => setBusy(false)); }}><Download size={16} />Export audit log</button> : undefined} />
      <Tabs.Root defaultValue="activity">
        <Tabs.List className="tab-bar glass" aria-label="Activity"><Tabs.Trigger value="activity" className="tab">Activity</Tabs.Trigger>{canAudit && <><Tabs.Trigger value="audit" className="tab">Audit log</Tabs.Trigger><Tabs.Trigger value="conflicts" className="tab">Sync conflicts</Tabs.Trigger></>}</Tabs.List>
        <Tabs.Content value="activity"><Feed qk="activity" load={() => sk.activity.list({ limit: 50 })} /></Tabs.Content>
        {canAudit && <Tabs.Content value="audit"><Feed qk="audit" load={() => sk.audit.list({ limit: 50 })} /></Tabs.Content>}
        {canAudit && <Tabs.Content value="conflicts"><Feed qk="conflicts" load={() => sk.sync.conflicts({ status: "open" })} actions={(r) => (<>
          <Btn className="sm" busy={resolve.isPending && resolve.variables?.id === String(r.id) && resolve.variables.resolution === "keep_server"} busyLabel="Keeping server" disabled={resolve.isPending} onClick={() => resolve.mutate({ id: String(r.id), resolution: "keep_server" })}>Keep server</Btn>
          <Btn className="sm primary" busy={resolve.isPending && resolve.variables?.id === String(r.id) && resolve.variables.resolution === "apply_client"} busyLabel="Applying" disabled={resolve.isPending} onClick={() => resolve.mutate({ id: String(r.id), resolution: "apply_client" })}>Apply device</Btn></>)} /></Tabs.Content>}
      </Tabs.Root>
    </>
  );
}
