"use client";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileUp, TriangleAlert } from "lucide-react";
import { download, rowsOf } from "@/lib/api";
import { sk, type ImportState, type ImportUpload } from "@/lib/endpoints";
import { AutoTable, Btn, Field, PageHeader, ProgressBar, Select, Skeleton, errMsg, useToast } from "@/components/ui";
import { useOptions } from "@/components/pickers";
import { Restricted } from "@/components/restricted";

const MAX_MB = 100;
const FIELD_LABEL: Record<string, string> = {
  sku: "SKU", name: "Name", type: "Kind (asset or consumable)", shelf: "Shelf", category: "Category", assetTag: "Asset tag", description: "Description",
  openingQuantity: "Opening quantity", unit: "Unit", minThreshold: "Minimum level", reorderQuantity: "Reorder quantity", expectedReturnHours: "Expected return (hours)", qrCode: "QR code",
};
const REQUIRED = new Set(["sku", "name", "category"]);
const RUNNING = ["validating", "queued", "committing"];
const STEPS = ["Choose file", "Match columns", "Check rows", "Import"];

const stageOf = (up: ImportUpload | null, uploading: boolean, s?: ImportState) => {
  if (!up || uploading) return 0;
  if (!s || s.status === "uploaded" || (s.status === "failed" && s.validRows == null)) return 1;
  if (s.status === "validating" || s.status === "ready") return 2;
  return 3;
};

function Stages({ at, done }: { at: number; done: boolean }) {
  return (
    <ol className="stages" aria-label="Import steps">
      {STEPS.map((label, i) => {
        const state = done || i < at ? "done" : i === at ? "now" : "";
        return <li key={label} className={`stage ${state}`} aria-current={state === "now" ? "step" : undefined}><span className="stage-dot">{state === "done" ? <CheckCircle2 size={14} /> : i + 1}</span>{label}</li>;
      })}
    </ol>
  );
}

export default function Imports() {
  return <Restricted cap="import"><ImportsInner /></Restricted>;
}

function ImportsInner() {
  const qc = useQueryClient();
  const toast = useToast();
  const pick = useRef<HTMLInputElement>(null);
  const [up, setUp] = useState<ImportUpload | null>(null);
  const [fileName, setFileName] = useState("");
  const [sent, setSent] = useState<number | null>(null); // 0..1 while bytes go up, then null
  const [reading, setReading] = useState(false);         // bytes are up, the server is still reading the file
  const [map, setMap] = useState<Record<string, string>>({});
  const [defaultType, setDefaultType] = useState("asset");
  const [shelf, setShelf] = useState("");
  const [createMissing, setCreateMissing] = useState(true);
  const [over, setOver] = useState(false);
  const shelves = useOptions("shelves", () => sk.shelves.list(), (r) => String(r.name));
  const history = useQuery({ queryKey: ["imports"], queryFn: sk.imports.list });

  const job = useQuery({
    queryKey: ["import", up?.id], enabled: !!up, queryFn: () => sk.imports.get(up!.id),
    refetchInterval: (q) => (q.state.data && RUNNING.includes(q.state.data.status) ? 1000 : false),
  });
  const s = job.data;
  const uploading = sent !== null || reading;
  const at = stageOf(up, uploading, s);
  const finished = s?.status === "completed";

  const reset = () => { setUp(null); setMap({}); setSent(null); setReading(false); setFileName(""); void qc.invalidateQueries({ queryKey: ["imports"] }); };

  const upload = useMutation({
    mutationFn: (file: File) => { setFileName(file.name); setSent(0); setReading(false); return sk.imports.upload(file, (f) => { setSent(f); if (f >= 1) setReading(true); }); },
    onSuccess: (r) => {
      setSent(null); setReading(false); setUp(r);
      setMap(Object.fromEntries(r.mappableFields.map((f) => [f, r.headers.find((h) => h.toLowerCase().replace(/[^a-z]/g, "") === f.toLowerCase().replace(/[^a-z]/g, "")) ?? ""]).filter(([, h]) => h)));
    },
    onError: (e) => { setSent(null); setReading(false); toast(errMsg(e), "bad"); },
  });
  const start = (file?: File) => {
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) return toast("Choose a .csv file. In Excel, use Save As and pick CSV.", "bad");
    if (file.size > MAX_MB * 1024 * 1024) return toast(`That file is over ${MAX_MB} MB. Split it into smaller files.`, "bad");
    upload.mutate(file);
  };

  const validate = useMutation({
    mutationFn: () => sk.imports.validate(up!.id, { mapping: Object.fromEntries(Object.entries(map).filter(([, v]) => v)), defaultType: defaultType as "asset", defaultShelfId: shelf || undefined, createMissing }),
    onSuccess: (r) => qc.setQueryData(["import", up!.id], r), // flips the page to "checking" at once; polling takes it from there
    onError: (e) => toast(errMsg(e), "bad"),
  });
  const commit = useMutation({
    mutationFn: () => sk.imports.commit(up!.id),
    onSuccess: () => { qc.setQueryData(["import", up!.id], (old: ImportState | undefined) => (old ? { ...old, status: "queued", processedRows: 0, percent: 0 } : old)); void job.refetch(); },
    onError: (e) => toast(errMsg(e), "bad"),
  });
  const discard = useMutation({
    mutationFn: () => sk.imports.discard(up!.id),
    onSuccess: reset, onError: (e) => toast(errMsg(e), "bad"),
  });

  const headerOpts = up ? [{ value: "none", label: "Skip this field" }, ...up.headers.map((h) => ({ value: h, label: h }))] : [];
  const checking = s?.status === "validating"; const importing = !!s && ["queued", "committing"].includes(s.status);
  const missingRequired = [...REQUIRED].filter((f) => !map[f]);

  // When the running import finishes, refresh everything that shows items.
  const announced = useRef<string | null>(null);
  useEffect(() => {
    if (finished && s && announced.current !== s.id) { announced.current = s.id; toast("Import finished"); void qc.invalidateQueries(); }
  }, [finished, s, toast, qc]);

  return (
    <>
      <PageHeader title="Import" lede="Bring your spreadsheet in. Big files are fine: they upload in one go and import in the background." />
      <Stages at={at} done={finished} />

      {!up && !uploading && (
        <label className={`dropzone glass${over ? " over" : ""}`} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); start(e.dataTransfer.files?.[0]); }}>
          <FileUp size={28} /><strong>Choose a CSV file, or drop it here</strong><span className="muted">Up to {MAX_MB} MB and 200,000 rows. The first row must be the column names.</span>
          <input ref={pick} type="file" accept=".csv,text/csv" hidden onChange={(e) => { start(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      )}

      {uploading && (
        <div className="glass run-card" role="status" aria-live="polite">
          <div className="run-line"><span>{reading ? "Reading your file" : `Uploading ${fileName}`}</span><span>{reading ? "" : `${Math.round((sent ?? 0) * 100)}%`}</span></div>
          <ProgressBar value={reading ? undefined : (sent ?? 0) * 100} label="Upload progress" />
          <span className="muted small">{reading ? "The upload is done. The server is reading the rows. This takes a moment for large files." : "Keep this page open until the upload finishes."}</span>
        </div>
      )}

      {up && !uploading && job.isPending && <Skeleton rows={4} />}

      {up && s && checking && (
        <div className="glass run-card" role="status" aria-live="polite">
          <div className="run-line"><span>Checking your rows</span><span>{s.processedRows.toLocaleString()} of {(s.totalRows ?? up.totalRows).toLocaleString()}</span></div>
          <ProgressBar value={s.percent} label="Checking rows" />
          <span className="muted small">Looking for missing fields, bad quantities and repeated SKUs. Nothing is imported yet.</span>
        </div>
      )}

      {up && s && importing && (
        <div className="glass run-card" role="status" aria-live="polite">
          <div className="run-line"><span>{s.status === "queued" ? "Waiting for a worker to start" : "Importing items"}</span><span>{s.processedRows.toLocaleString()} of {(s.totalRows ?? up.totalRows).toLocaleString()}</span></div>
          <ProgressBar value={s.status === "queued" ? undefined : s.percent} label="Import progress" />
          <div className="stat-row"><div className="stat"><strong>{(s.importedRows ?? 0).toLocaleString()}</strong><span>Imported</span></div><div className="stat"><strong>{(s.skippedRows ?? 0).toLocaleString()}</strong><span>Already existed</span></div><div className="stat"><strong>{(s.failedRows ?? 0).toLocaleString()}</strong><span>Failed</span></div></div>
          <span className="muted small">You can leave this page. The import keeps going, and you can come back to see it in the history below.</span>
        </div>
      )}

      {up && s && finished && (
        <div className="glass run-card" role="status">
          <div className="run-line"><span>Import finished</span></div>
          <div className="stat-row"><div className="stat"><strong>{(s.importedRows ?? 0).toLocaleString()}</strong><span>Imported</span></div><div className="stat"><strong>{(s.skippedRows ?? 0).toLocaleString()}</strong><span>Skipped, already existed</span></div><div className="stat"><strong>{(s.failedRows ?? 0).toLocaleString()}</strong><span>Could not import</span></div></div>
          {s.errors.length > 0 && <ErrorTable s={s} id={up.id} />}
          <div className="modal-actions"><Btn className="primary" onClick={reset}>Import another file</Btn></div>
        </div>
      )}

      {up && s && !checking && !importing && !finished && (
        <div className="glass card form-grid">
          <p className="muted"><strong>{up.totalRows.toLocaleString()}</strong> rows in {fileName || "your file"}. Match each field to a column.</p>
          {s.status === "failed" && <p className="notice glass small" role="alert"><TriangleAlert size={16} /> {s.failureReason ?? "This import could not finish."}</p>}
          <div className="form-grid two">
            {up.mappableFields.map((f) => <Field key={f} label={`${FIELD_LABEL[f] ?? f}${REQUIRED.has(f) ? " (required)" : ""}`} htmlFor={`m-${f}`}><Select id={`m-${f}`} value={map[f] ?? "none"} onValueChange={(v) => setMap((m) => ({ ...m, [f]: v === "none" ? "" : v }))} options={headerOpts} /></Field>)}
            <Field label="Default kind" htmlFor="dt" hint="Used when the file has no kind column"><Select id="dt" value={defaultType} onValueChange={setDefaultType} options={[{ value: "asset", label: "Tracked asset" }, { value: "consumable", label: "Consumable" }]} /></Field>
            <Field label="Default shelf" htmlFor="ds" hint="For rows without a shelf column"><Select id="ds" value={shelf} onValueChange={setShelf} options={shelves} placeholder="Choose a shelf" /></Field>
          </div>
          <label className="check"><input type="checkbox" checked={createMissing} onChange={(e) => setCreateMissing(e.target.checked)} />Create shelves and categories that do not exist yet</label>
          <h3 className="section-title">Preview of the first rows</h3>
          <AutoTable rows={up.preview} max={6} />

          {s.status === "ready" && (
            <div className="notice glass" role="status">
              <strong>Check finished</strong>
              <div className="stat-row">
                <div className="stat"><strong>{(s.totalRows ?? up.totalRows).toLocaleString()}</strong><span>Rows in file</span></div>
                <div className="stat"><strong>{(s.validRows ?? 0).toLocaleString()}</strong><span>Ready to import</span></div>
                <div className="stat"><strong>{(s.invalidRows ?? 0).toLocaleString()}</strong><span>Need fixing</span></div>
              </div>
              {(s.invalidRows ?? 0) > 0 && <p className="muted small">Rows that need fixing are left out. Everything else imports. Fix them in your spreadsheet and import them in a second file.</p>}
              {s.errors.length > 0 && <ErrorTable s={s} id={up.id} />}
            </div>
          )}
          {missingRequired.length > 0 && <p className="muted small">Still to match: {missingRequired.map((f) => FIELD_LABEL[f]).join(", ")}.</p>}
          <div className="modal-actions">
            <Btn onClick={() => discard.mutate()} busy={discard.isPending} busyLabel="Discarding" disabled={validate.isPending || commit.isPending}>Start over</Btn>
            <Btn onClick={() => validate.mutate()} busy={validate.isPending} busyLabel="Starting the check" disabled={missingRequired.length > 0 || commit.isPending}>{s.status === "ready" ? "Check again" : "Check rows"}</Btn>
            <Btn className="primary" onClick={() => commit.mutate()} busy={commit.isPending} busyLabel="Starting the import" disabled={s.status !== "ready" || (s.validRows ?? 0) === 0 || validate.isPending}>{s.status === "ready" ? `Import ${(s.validRows ?? 0).toLocaleString()} rows` : "Import"}</Btn>
          </div>
        </div>
      )}

      <h2 className="section-title">History</h2>
      <div className="glass table-card">{history.isPending ? <Skeleton rows={3} /> : <AutoTable rows={rowsOf(history.data)} hide={["id", "headers", "rows", "mapping"]} />}</div>
    </>
  );
}

function ErrorTable({ s, id }: { s: ImportState; id: string }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const total = s.status === "completed" ? (s.failedRows ?? 0) + (s.skippedRows ?? 0) : (s.invalidRows ?? s.errors.length);
  return (
    <div className="err-report">
      <div className="toolbar">
        <strong>{s.status === "completed" ? "Rows that were not imported" : "Rows that need fixing"}</strong>
        <Btn className="sm" busy={busy} busyLabel="Preparing" onClick={() => { setBusy(true); download(`/imports/${id}/errors.csv`, "import-errors.csv").catch((e) => toast(errMsg(e), "bad")).finally(() => setBusy(false)); }}>Download full list</Btn>
      </div>
      <div className="items-scroll err-scroll">
        <table>
          <thead><tr><th>Row</th><th>Field</th><th>Problem</th></tr></thead>
          <tbody>{s.errors.map((e, i) => <tr key={i}><td>{e.row}</td><td>{e.field}</td><td>{e.message}</td></tr>)}</tbody>
        </table>
      </div>
      {total > s.errors.length && <p className="muted small">Showing the first {s.errors.length} of {total.toLocaleString()}. The download has the full list.</p>}
    </div>
  );
}
