"use client";
import { isOffline, type Page, type Row } from "./api";
import { sk } from "./endpoints";

/**
 * Offline reference data (PRD section 21: "caching recently used inventory and holder information").
 * A copy of items and holders is kept in IndexedDB so scanning, search and the pickers keep working without a signal.
 * It is replaced on every refresh and wiped on sign-out. The server remains authoritative: the copy can be stale,
 * and anything recorded offline is validated again when it syncs.
 */
const DB = "sk-cache";
const STORES = ["items", "holders", "meta"] as const;
type Store = (typeof STORES)[number];

const open = () => new Promise<IDBDatabase>((resolve, reject) => {
  const r = indexedDB.open(DB, 1);
  r.onupgradeneeded = () => {
    const db = r.result;
    db.createObjectStore("items", { keyPath: "id" });
    db.createObjectStore("holders", { keyPath: "key" });
    db.createObjectStore("meta", { keyPath: "k" });
  };
  r.onsuccess = () => resolve(r.result);
  r.onerror = () => reject(r.error);
});

const done = (tx: IDBTransaction) => new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });

async function replaceAll(parts: Partial<Record<Store, Row[]>>) {
  const db = await open();
  const tx = db.transaction(Object.keys(parts), "readwrite");
  for (const [name, rows] of Object.entries(parts)) {
    const s = tx.objectStore(name);
    s.clear();
    for (const r of rows ?? []) s.put(r);
  }
  await done(tx);
  db.close();
}
async function all(name: Store): Promise<Row[]> {
  const db = await open();
  const rows = await new Promise<Row[]>((res, rej) => { const r = db.transaction(name).objectStore(name).getAll(); r.onsuccess = () => res(r.result as Row[]); r.onerror = () => rej(r.error); });
  db.close();
  return rows;
}

export const isNetworkError = (e: unknown) => isOffline(e) || (typeof navigator !== "undefined" && !navigator.onLine);

async function paged(load: (cursor?: string) => Promise<Page | Row[]>, cap = 20000): Promise<Row[]> {
  const out: Row[] = [];
  let cursor: string | undefined;
  do {
    const page = await load(cursor);
    if (Array.isArray(page)) return page;
    out.push(...page.items);
    cursor = page.nextCursor ?? undefined;
  } while (cursor && out.length < cap);
  return out;
}

let running: Promise<void> | null = null;
export function refreshCache(): Promise<void> {
  if (running) return running;
  running = (async () => {
    const [items, people, teams, jobs] = await Promise.all([
      paged((cursor) => sk.items.list({ limit: 100, cursor })),
      paged((cursor) => sk.people.list({ limit: 100, cursor }) as Promise<Page>),
      paged((cursor) => sk.teams.list({ limit: 100, cursor }) as Promise<Page>),
      paged((cursor) => sk.jobs.list({ limit: 100, cursor }) as Promise<Page>),
    ]);
    const holders = [
      ...people.filter((p) => p.active !== false && !p.archivedAt).map((p) => ({ key: `person:${p.id}`, type: "person", id: p.id, name: p.fullName ?? p.name })),
      ...teams.filter((t) => !t.archivedAt).map((t) => ({ key: `team:${t.id}`, type: "team", id: t.id, name: t.name })),
      ...jobs.filter((j) => !j.archivedAt).map((j) => ({ key: `job:${j.id}`, type: "job", id: j.id, name: j.name })),
    ];
    await replaceAll({ items, holders, meta: [{ k: "sync", syncedAt: Date.now(), items: items.length, holders: holders.length }] });
  })().finally(() => { running = null; });
  return running;
}

export async function cacheMeta(): Promise<{ syncedAt: number; items: number; holders: number } | null> {
  try { return ((await all("meta")).find((m) => m.k === "sync") as never) ?? null; } catch { return null; }
}
export async function clearCache() {
  try { await replaceAll({ items: [], holders: [], meta: [] }); } catch { /* nothing cached */ }
}

const norm = (v: unknown) => String(v ?? "").toLowerCase();
export async function cachedLookup(code: string): Promise<Row | null> {
  const c = norm(code.trim());
  const hits = (await all("items")).filter((i) => !i.archivedAt && [i.qrCode, i.assetTag, i.sku].some((v) => v && norm(v) === c));
  if (hits.length > 1) throw new Error("This code matches more than one item; search by name instead");
  return hits[0] ? { ...hits[0], _cachedAt: (await cacheMeta())?.syncedAt ?? Date.now() } : null;
}
export async function cachedItems(q: string, type?: string, limit = 8): Promise<Row[]> {
  const n = norm(q);
  return (await all("items")).filter((i) => !i.archivedAt && (!type || i.type === type) && [i.name, i.sku, i.assetTag].some((v) => norm(v).includes(n))).slice(0, limit);
}
export async function cachedHolders(type: string, limit = 30): Promise<Row[]> {
  return (await all("holders")).filter((h) => h.type === type).sort((a, b) => String(a.name).localeCompare(String(b.name))).slice(0, limit);
}
