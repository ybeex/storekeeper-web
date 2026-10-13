"use client";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CloudOff, RefreshCw } from "lucide-react";
import { flushQueue, useOnline, useQueue } from "@/lib/offline";
import { errMsg, useToast } from "./ui";

/** Shows connection and queue state, and replays the queue when the connection returns. */
export function SyncBar() {
  const queue = useQueue();
  const online = useOnline();
  const qc = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const sync = async (manual = false) => {
    if (busy || queue.length === 0) return;
    setBusy(true);
    try {
      const r = await flushQueue();
      void qc.invalidateQueries();
      if (r.applied || r.review) toast(r.review ? `Synced ${r.applied}. ${r.review} need a supervisor to review.` : `Synced ${r.applied} saved action${r.applied === 1 ? "" : "s"}`, r.review ? "bad" : "ok");
    } catch (e) {
      if (manual) toast(errMsg(e), "bad");
    }
    setBusy(false);
  };

  useEffect(() => {
    if (!online || queue.length === 0) return;
    void sync();
    const t = setInterval(() => void sync(), 30_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, queue.length]);

  if (online && queue.length === 0) return null;
  return (
    <div className={`sync-bar glass ${online ? "warn" : "bad"}`} role="status" aria-live="polite">
      {online ? <RefreshCw size={16} className={busy ? "spin" : ""} /> : <CloudOff size={16} />}
      <span>{online ? `${queue.length} saved on this device, syncing` : `Offline. ${queue.length ? `${queue.length} waiting to sync` : "New movements will be saved on this device"}`}</span>
      {online && <button className="link" onClick={() => void sync(true)} disabled={busy}>Sync now</button>}
    </div>
  );
}
