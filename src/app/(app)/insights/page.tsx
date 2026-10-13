"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { download, rowsOf } from "@/lib/api";
import { sk } from "@/lib/endpoints";
import { Restricted } from "@/components/restricted";
import { AutoTable, Empty, PageHeader, Select, Skeleton, errMsg, saveText, toCsv, useToast } from "@/components/ui";

const REPORTS = {
  inventory: ["Inventory", () => sk.reports.inventory(), "/reports/inventory"],
  outstanding: ["Outstanding assets", () => sk.reports.outstanding(), "/reports/outstanding"],
  transactions: ["Transactions", () => sk.reports.transactions(), "/reports/transactions"],
  discrepancies: ["Discrepancies", () => sk.reports.discrepancies(), "/reports/discrepancies"],
  lossDamage: ["Loss and damage", () => sk.analytics.lossDamage(), ""],
  consumption: ["Consumption", () => sk.analytics.consumption(), ""],
  assetUtilization: ["Asset utilization", () => sk.analytics.assetUtilization(), ""],
  reorder: ["Reorder recommendations", () => sk.analytics.reorder(), ""],
  accountability: ["Accountability", () => sk.analytics.accountability(), ""],
} as const;
type Key = keyof typeof REPORTS;

export default function Insights() {
  return <Restricted cap="insights"><InsightsInner /></Restricted>;
}

function InsightsInner() {
  const [key, setKey] = useState<Key>("inventory");
  const toast = useToast();
  const [name, load, path] = REPORTS[key];
  const { data, isPending, isError } = useQuery({ queryKey: ["insight", key], queryFn: load });
  const rows = rowsOf(data);
  const exportCsv = () => (path ? download(`${path}?format=csv`, `${key}.csv`) : Promise.resolve(saveText(`${key}.csv`, toCsv(rows)))).catch((e) => toast(errMsg(e), "bad"));
  return (
    <>
      <PageHeader title="Insights" lede="Reports and analytics, exportable to CSV." actions={<button className="btn" onClick={exportCsv} disabled={!rows.length}><Download size={16} />Export CSV</button>} />
      <div className="toolbar"><div className="narrow wide-select"><Select value={key} onValueChange={(v) => setKey(v as Key)} options={(Object.keys(REPORTS) as Key[]).map((k) => ({ value: k, label: REPORTS[k][0] }))} /></div></div>
      <h2 className="section-title">{name}</h2>
      <div className="glass table-card">{isPending ? <Skeleton /> : isError ? <p className="empty">Could not load this report.</p> : rows.length === 0 ? <Empty>No data for this report yet.</Empty> : <AutoTable rows={rows} max={10} />}</div>
    </>
  );
}
