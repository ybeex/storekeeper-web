// Same-origin proxy (src/app/api/v1/[...path]/route.ts). The session token is an httpOnly cookie the browser sends
// automatically and page scripts can never read.
const BASE = "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public requestId?: string,
  ) {
    super(message);
  }
}

/** Per-tab memory of "this tab was signed in", so a later 401 can say "your session expired" instead of failing silently. */
const SIGNED_IN = "sk-signed-in";
export const sessionFlag = {
  has: () => typeof window !== "undefined" && window.sessionStorage.getItem(SIGNED_IN) === "1",
  set: () => window.sessionStorage.setItem(SIGNED_IN, "1"),
  clear: () => window.sessionStorage.removeItem(SIGNED_IN),
};
/** Readable, secret-free cookie the proxy sets next to the real session cookie; lets the app skip "who am I" for anonymous visitors. */
export const hasSessionHint = () => typeof document !== "undefined" && document.cookie.split("; ").some((c) => c.startsWith("sk_auth="));
/** True when the request never reached the API: the browser is offline, or the proxy could not reach it. */
export const isOffline = (e: unknown) => e instanceof TypeError || (e instanceof ApiError && e.code === "UPSTREAM_UNAVAILABLE");

/** Mutating requests need a unique key so a double tap or retry never creates two movements. */
export const newIdempotencyKey = () => crypto.randomUUID();

export async function api<T>(
  path: string,
  init: Omit<RequestInit, "body"> & { body?: unknown; idempotencyKey?: string } = {},
): Promise<T> {
  const { body, headers, idempotencyKey: _k, ...rest } = init;
  const method = (rest.method ?? "GET").toUpperCase();
  // Every mutation carries a fresh key so retries and double taps are safe (login excluded).
  const idempotencyKey = init.idempotencyKey ?? (method !== "GET" && !path.startsWith("/auth/") && !path.startsWith("/public/") ? newIdempotencyKey() : undefined);
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(`${BASE}/v1${path}`, {
    ...rest,
    headers: {
      ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  });
  if (res.status === 401 && !path.startsWith("/auth/login") && sessionFlag.has()) {
    sessionFlag.clear();
    sessionStorage.setItem("sk-expired", "1");
    window.dispatchEvent(new Event("sk-session-expired"));
  }
  if (res.status === 204) return undefined as T;
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const e = (data as { error?: { code?: string; message?: string; requestId?: string } } | null)?.error;
    throw new ApiError(res.status, e?.code ?? "UNKNOWN", e?.message ?? "Request failed", e?.requestId);
  }
  return data as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;
export type Page<T = Row> = { items: T[]; nextCursor?: string | null };
export const rowsOf = (x: unknown): Row[] => (Array.isArray(x) ? x : ((x as Row | null)?.items ?? (x as Row | null)?.data ?? []));

/**
 * POSTs a form with a real upload-progress callback (fetch cannot report upload progress). Used for big files, where a
 * bare spinner for a minute is indistinguishable from a hang.
 */
export function uploadWithProgress<T>(path: string, form: FormData, onProgress: (fraction: number) => void): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}/v1${path}`);
    xhr.setRequestHeader("Idempotency-Key", newIdempotencyKey());
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    xhr.onerror = () => reject(new ApiError(0, "UPSTREAM_UNAVAILABLE", "The upload was interrupted. Check your connection and try again."));
    xhr.ontimeout = xhr.onerror;
    xhr.onload = () => {
      let data: unknown = null;
      try { data = JSON.parse(xhr.responseText); } catch { /* not JSON */ }
      if (xhr.status === 401 && sessionFlag.has()) { sessionFlag.clear(); sessionStorage.setItem("sk-expired", "1"); window.dispatchEvent(new Event("sk-session-expired")); }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(data as T);
      const e = (data as { error?: { code?: string; message?: string; requestId?: string } } | null)?.error;
      reject(new ApiError(xhr.status, e?.code ?? "UNKNOWN", e?.message ?? "Upload failed", e?.requestId));
    };
    xhr.send(form);
  });
}

export async function download(path: string, filename: string) {
  const res = await fetch(`${BASE}/v1${path}`);
  if (!res.ok) throw new ApiError(res.status, "DOWNLOAD_FAILED", "Download failed");
  const url = URL.createObjectURL(await res.blob());
  Object.assign(document.createElement("a"), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}

export async function blobUrl(path: string): Promise<string> {
  const res = await fetch(`${BASE}/v1${path}`);
  if (!res.ok) throw new ApiError(res.status, "FETCH_FAILED", "Could not load the file");
  return URL.createObjectURL(await res.blob());
}

export type OutstandingState = "overdue" | "on_time" | "partial_return";
export type OutstandingRow = {
  id: string;
  itemId: string;
  itemName: string;
  sku: string | null;
  assetTag: string | null;
  itemType: "asset" | "consumable";
  quantity: number;
  issuedQuantity: number;
  holder: { type: "person" | "team" | "job"; id: string; name: string };
  job: { id: string; name: string | null } | null;
  checkedOutAt: string;
  dueAt: string | null;
  overdue: boolean;
  overdueDays: number;
  state: OutstandingState;
};
export type OutstandingPage = { items: OutstandingRow[]; nextCursor: string | null };
export type Me = { id: string; email: string; fullName: string | null; role: string; orgName?: string; orgSlug?: string };
