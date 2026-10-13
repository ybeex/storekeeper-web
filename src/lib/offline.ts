"use client";
import { useMemo, useSyncExternalStore } from "react";
import { isOffline, type Row } from "./api";
import { sk } from "./endpoints";

/**
 * Offline queue (PRD section 21). Routine movements made without a connection are stored on this device
 * and replayed through POST /sync/batch. The server stays authoritative: anything it cannot apply becomes a
 * conflict record for a supervisor, never a silent overwrite.
 *
 * Each action's client id doubles as its idempotency identity (`sync:<device>:<id>`), online and offline,
 * so a request whose response was lost can fall back to the queue without ever recording the movement twice.
 */
export type ActionType = "checkout" | "checkin" | "consume" | "restock";
export type QueuedAction = Row & { type: ActionType; clientActionId: string; occurredAt: string; label: string };

const QUEUE = "sk-queue";
const DEVICE = "sk-device";
const EVENT = "sk-queue-change";

export function deviceId(): string {
  let id = localStorage.getItem(DEVICE);
  if (!id) { id = `web-${crypto.randomUUID()}`; localStorage.setItem(DEVICE, id); }
  return id;
}
const raw = () => (typeof window === "undefined" ? "[]" : (localStorage.getItem(QUEUE) ?? "[]"));
const write = (q: QueuedAction[]) => { localStorage.setItem(QUEUE, JSON.stringify(q)); window.dispatchEvent(new Event(EVENT)); };
export const readQueue = (): QueuedAction[] => { try { return JSON.parse(raw()) as QueuedAction[]; } catch { return []; } };
export const enqueue = (a: QueuedAction) => write([...readQueue(), a]);

const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb); window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener("storage", cb); };
};
export function useQueue(): QueuedAction[] {
  const snap = useSyncExternalStore(subscribe, raw, () => "[]");
  return useMemo(() => { try { return JSON.parse(snap) as QueuedAction[]; } catch { return []; } }, [snap]);
}
export function useOnline(): boolean {
  return useSyncExternalStore(
    (cb) => { window.addEventListener("online", cb); window.addEventListener("offline", cb); return () => { window.removeEventListener("online", cb); window.removeEventListener("offline", cb); }; },
    () => navigator.onLine,
    () => true,
  );
}

export const newAction = (type: ActionType, label: string, fields: Row, note?: string): QueuedAction => {
  const base = { type, label, clientActionId: crypto.randomUUID(), occurredAt: new Date().toISOString(), ...(note ? { note } : {}) };
  return { ...base, ...Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined && v !== null && v !== "")) } as QueuedAction;
};

/** Send now with the action's stable key; if the network fails, keep it in the queue instead. */
export async function submitOrQueue(action: QueuedAction, send: (idempotencyKey: string) => Promise<unknown>): Promise<{ queued: boolean; result?: unknown }> {
  const key = `sync:${deviceId()}:${action.clientActionId}`;
  if (!navigator.onLine) { enqueue(action); return { queued: true }; }
  try {
    return { queued: false, result: await send(key) };
  } catch (e) {
    if (isOffline(e)) { enqueue(action); return { queued: true }; } // no network, or the proxy could not reach the API
    throw e;
  }
}

let flushing: Promise<{ applied: number; review: number }> | null = null;
/** Replays the queue. Applied and replayed actions leave it; conflicts and failures are now server-side records for review. */
export function flushQueue(): Promise<{ applied: number; review: number }> {
  if (flushing) return flushing;
  flushing = (async () => {
    let applied = 0, review = 0;
    for (;;) {
      const q = readQueue();
      if (q.length === 0 || !navigator.onLine) break;
      const chunk = q.slice(0, 200);
      const { results } = (await sk.sync.batch({
        deviceId: deviceId(),
        actions: chunk.map(({ label: _l, ...a }) => a),
      })) as { results: { clientActionId: string; status: string }[] };
      const done = new Set(results.map((r) => r.clientActionId));
      for (const r of results) (r.status === "applied" || r.status === "replayed" ? applied++ : review++);
      write(readQueue().filter((a) => !done.has(a.clientActionId)));
    }
    return { applied, review };
  })().finally(() => { flushing = null; });
  return flushing;
}
