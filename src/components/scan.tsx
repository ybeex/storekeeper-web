"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Keyboard, ScanLine } from "lucide-react";
import { ApiError, type Row } from "@/lib/api";
import { sk, type Holder } from "@/lib/endpoints";
import { runMovement } from "@/lib/quick";
import { cachedLookup, isNetworkError } from "@/lib/cache";
import { Field, Modal, Select, errMsg, useToast } from "./ui";
import { HolderPicker } from "./pickers";
import { useCan } from "./restricted";

type Detector = { detect(src: CanvasImageSource): Promise<{ rawValue: string }[]> };
declare global { interface Window { BarcodeDetector?: new (o?: { formats?: string[] }) => Detector } }

export const openScanner = () => window.dispatchEvent(new Event("sk-open-scan"));

/** Camera view with live detection. Falls back to typing a code, which also takes a Bluetooth or USB scanner. */
function ScanDialog({ open, onClose, onCode }: { open: boolean; onClose: () => void; onCode: (c: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"starting" | "live" | "unsupported" | "denied">("starting");
  const [manual, setManual] = useState("");

  useEffect(() => {
    if (!open) return;
    setState("starting");
    if (!window.BarcodeDetector || !navigator.mediaDevices?.getUserMedia) { setState("unsupported"); return; }
    let stream: MediaStream | null = null, timer = 0, stopped = false;
    const det = new window.BarcodeDetector({ formats: ["qr_code", "code_128", "code_39", "ean_13", "ean_8", "upc_a", "data_matrix"] });
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then(async (s) => {
        if (stopped) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        const v = video.current!;
        v.srcObject = s;
        await v.play();
        setState("live");
        timer = window.setInterval(async () => {
          try {
            const hit = (await det.detect(v))[0];
            if (hit?.rawValue) { navigator.vibrate?.(60); onCode(hit.rawValue); }
          } catch { /* a frame that cannot be read is fine */ }
        }, 220);
      })
      .catch(() => setState("denied"));
    return () => { stopped = true; clearInterval(timer); stream?.getTracks().forEach((t) => t.stop()); };
  }, [open, onCode]);

  return (
    <Modal open={open} onOpenChange={(o) => !o && onClose()} title="Scan an item" description="Point the camera at the QR tag.">
      <div className="scan-view">
        <video ref={video} playsInline muted />
        <span className="scan-frame" aria-hidden="true"><i /><i /><i /><i /><b /></span>
        {state !== "live" && <p className="scan-note">{state === "starting" ? "Starting the camera" : state === "denied" ? "Camera access was blocked. Allow it in your browser, or type the code below." : "This browser cannot scan with the camera. Type or scan the code below."}</p>}
      </div>
      <form className="form-grid" onSubmit={(e) => { e.preventDefault(); if (manual.trim()) onCode(manual.trim()); }}>
        <Field label="Or enter a tag, SKU or code" htmlFor="manual"><span className="input icon-input"><Keyboard size={16} /><input id="manual" value={manual} onChange={(e) => setManual(e.target.value)} autoComplete="off" placeholder="DRL-0042" /></span></Field>
        <div className="modal-actions"><button className="btn primary" disabled={!manual.trim()}>Look up</button></div>
      </form>
    </Modal>
  );
}

/** What a scanned item can do right now. */
function ItemSheet({ item, onClose }: { item: Row; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const canMove = useCan("move");
  const isAsset = item.type === "asset";
  const out = isAsset && item.assetStatus === "checked_out";
  const outstanding = (item.outstanding ?? []) as Row[];
  const options = !canMove ? [] : isAsset ? (out ? [["return", "Return"]] : item.assetStatus === "available" ? [["checkout", "Check out"]] : [])
    : [["checkout", "Issue"], ["consume", "Consume"], ["restock", "Restock"], ...(outstanding.length ? [["return", "Return"]] : [])];
  const [action, setAction] = useState(options[0]?.[0] ?? "");
  const [holder, setHolder] = useState<Holder | null>(null);
  const [from, setFrom] = useState(outstanding[0] ? `${outstanding[0].holderType}:${outstanding[0].holderId}` : "");
  const [qty, setQty] = useState("1");
  const [cond, setCond] = useState("");
  const [busy, setBusy] = useState(false);
  const id = String(item.id), name = String(item.name);

  async function go() {
    setBusy(true);
    try {
      const n = isAsset ? undefined : Number(qty);
      let r;
      if (action === "checkout") r = await runMovement("checkout", name, { itemId: id, holder, quantity: n });
      else if (action === "consume") r = await runMovement("consume", name, { itemId: id, quantity: n });
      else if (action === "restock") r = await runMovement("restock", name, { itemId: id, quantity: n });
      else {
        const h: Holder = isAsset ? { type: item.holder.type, id: item.holder.id } : { type: from.split(":")[0] as Holder["type"], id: from.split(":")[1] ?? "" };
        r = await runMovement("checkin", name, { itemId: id, holder: h, quantity: n, condition: cond || undefined });
      }
      toast(r.queued ? "Saved on this device. It will sync when you are back online." : "Recorded");
      void qc.invalidateQueries();
      onClose();
    } catch (e) { toast(errMsg(e), "bad"); }
    setBusy(false);
  }
  const needsHolder = action === "checkout";
  const ready = !!action && (!needsHolder || holder) && (isAsset || Number(qty) >= 1);

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={name} description={[item.assetTag, item.sku, item.shelfName].filter(Boolean).join("  /  ")}>
      {item._cachedAt && <p className="notice glass small">Saved copy from {new Date(item._cachedAt as number).toLocaleString()}. Its status may have changed; the server checks it when this syncs.</p>}
      {item.photoUrl && !item._cachedAt && <img src={String(item.photoUrl)} alt={name} className="sheet-photo" />}
      <div className="sheet-state">
        {isAsset ? <>
          <span className={`badge ${out ? "warn" : item.assetStatus === "available" ? "ok" : "neu"}`}>{String(item.assetStatus ?? "").replace(/_/g, " ")}</span>
          {out && <span>Held by <strong>{item.holder?.name}</strong>{item.holder?.overdue && <span className="badge bad">Overdue {item.holder.overdueDays} days</span>}</span>}
          <span className="muted">Condition: {String(item.condition ?? "unknown").replace(/_/g, " ")}</span>
        </> : <>
          <span className={`badge ${item.lowStock ? "warn" : "ok"}`}>{item.quantityAvailable} {item.unit ?? ""} available</span>
          {item.effectiveMinThreshold != null && <span className="muted">Minimum {item.effectiveMinThreshold}</span>}
        </>}
      </div>
      {options.length === 0 ? <p className="muted">{canMove ? `This asset is ${String(item.assetStatus).replace(/_/g, " ")} and cannot be issued right now.` : "Your role can look items up but not record movements."}</p> : (
        <div className="form-grid">
          {options.length > 1 && <Field label="Action" htmlFor="sa"><Select id="sa" value={action} onValueChange={setAction} options={options.map(([v, l]) => ({ value: v, label: l }))} /></Field>}
          {needsHolder && <Field label="Issue to"><HolderPicker value={holder} onChange={setHolder} /></Field>}
          {action === "return" && !isAsset && <Field label="Returned by" htmlFor="rb"><Select id="rb" value={from} onValueChange={setFrom} options={outstanding.map((o) => ({ value: `${o.holderType}:${o.holderId}`, label: `${o.holderName} (${o.quantity} out)` }))} /></Field>}
          {!isAsset && <Field label="Quantity" htmlFor="sq"><input id="sq" type="number" min={1} className="input" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>}
          {action === "return" && isAsset && <Field label="Condition" htmlFor="sc"><Select id="sc" value={cond} onValueChange={setCond} placeholder="Keep last known" options={[{ value: "good", label: "Good" }, { value: "damaged", label: "Damaged" }, { value: "needs_inspection", label: "Needs inspection" }]} /></Field>}
        </div>
      )}
      <div className="modal-actions">
        <Link href={`/items/${id}`} className="btn" onClick={onClose}>Open item<ArrowUpRight size={16} /></Link>
        {options.length > 0 && <button className="btn primary lg shine" disabled={!ready || busy} onClick={() => void go()}>{busy ? "Saving" : "Confirm"}</button>}
      </div>
    </Modal>
  );
}

/** Mounted once in the app shell: scanner, lookup, result sheet, and hardware-scanner capture. */
export function ScanHost() {
  const toast = useToast();
  const [scanning, setScanning] = useState(false);
  const [item, setItem] = useState<Row | null>(null);

  const lookup = useCallback(async (code: string) => {
    setScanning(false);
    try { setItem(await sk.items.lookup({ code })); }
    catch (e) {
      if (isNetworkError(e)) {
        try {
          const hit = await cachedLookup(code);
          if (hit) return setItem(hit);
          return toast(`You are offline and "${code}" is not in the saved data on this device.`, "bad");
        } catch (err) { return toast(errMsg(err), "bad"); }
      }
      toast(e instanceof ApiError && e.status === 404 ? `Nothing matches "${code}".` : errMsg(e), "bad");
    }
  }, [toast]);

  useEffect(() => {
    const open = () => setScanning(true);
    window.addEventListener("sk-open-scan", open);
    // Keyboard-style scanners type the code very fast and finish with Enter.
    let buf = "", last = 0;
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const now = performance.now();
      if (now - last > 80) buf = "";
      last = now;
      if (e.key === "Enter") { if (buf.length >= 3) { void lookup(buf); } buf = ""; }
      else if (e.key.length === 1) buf += e.key;
    };
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("sk-open-scan", open); window.removeEventListener("keydown", key); };
  }, [lookup]);

  return (<>
    <ScanDialog open={scanning} onClose={() => setScanning(false)} onCode={(c) => void lookup(c)} />
    {item && <ItemSheet item={item} onClose={() => setItem(null)} />}
  </>);
}

export function ScanButton({ fab = false }: { fab?: boolean }) {
  return <button className={fab ? "scan-fab shine" : "btn primary shine"} onClick={openScanner} aria-label="Scan an item"><ScanLine size={fab ? 26 : 18} />{!fab && "Scan"}</button>;
}
