"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs } from "radix-ui";
import { Check, Ban, X } from "lucide-react";
import { rowsOf, type Row } from "@/lib/api";
import { sk } from "@/lib/endpoints";
import { useCan } from "@/components/restricted";
import { AutoTable, Btn, Empty, PageHeader, Skeleton, errMsg, useToast } from "@/components/ui";

export default function Approvals() {
  const qc = useQueryClient();
  const canApprove = useCan("approve");
  const toast = useToast();
  const [status, setStatus] = useState("pending");
  const { data, isPending } = useQuery({ queryKey: ["approvals", status], queryFn: () => sk.approvals.list({ status, limit: 50 }) });
  const act = useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: "approve" | "reject" | "cancel" }) => sk.approvals[kind](id),
    onSuccess: (_r, v) => { toast(v.kind === "approve" ? "Approved" : v.kind === "reject" ? "Rejected" : "Cancelled"); void qc.invalidateQueries(); },
    onError: (e) => toast(errMsg(e), "bad"),
  });
  const rows = rowsOf(data);
  return (
    <>
      <PageHeader title="Approvals" lede="High-risk operations wait here for a supervisor." />
      <Tabs.Root value={status} onValueChange={setStatus}>
        <Tabs.List className="tab-bar glass" aria-label="Approval status">{["pending", "approved", "rejected", "cancelled"].map((s) => <Tabs.Trigger key={s} value={s} className="tab" style={{ textTransform: "capitalize" }}>{s}</Tabs.Trigger>)}</Tabs.List>
      </Tabs.Root>
      <div className="glass table-card">
        {isPending ? <Skeleton /> : rows.length === 0 ? <Empty>No {status} requests.</Empty> : (
          <AutoTable rows={rows} hide={["idempotencyKey", "requestedBy", "reviewedBy", "resultingTransactionId"]} actions={status === "pending" && canApprove ? (r: Row) => (<>
            <Btn className="sm primary" busy={act.isPending && act.variables?.id === String(r.id) && act.variables.kind === "approve"} busyLabel="Approving" disabled={act.isPending} onClick={() => act.mutate({ id: String(r.id), kind: "approve" })}><Check size={15} />Approve</Btn>
            <Btn className="sm" busy={act.isPending && act.variables?.id === String(r.id) && act.variables.kind === "reject"} busyLabel="Rejecting" disabled={act.isPending} onClick={() => act.mutate({ id: String(r.id), kind: "reject" })}><X size={15} />Reject</Btn>
            <Btn className="icon sm" aria-label="Cancel request" busy={act.isPending && act.variables?.id === String(r.id) && act.variables.kind === "cancel"} busyLabel="" disabled={act.isPending} onClick={() => act.mutate({ id: String(r.id), kind: "cancel" })}><Ban size={15} /></Btn></>) : undefined} />
        )}
      </div>
    </>
  );
}
