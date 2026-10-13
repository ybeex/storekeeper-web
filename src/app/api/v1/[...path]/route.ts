import { NextRequest, NextResponse } from "next/server";

/**
 * Backend-for-frontend proxy. The browser only ever talks to this origin (`/api/v1/*`); this handler calls the StoreKeeper API
 * from the server. The API session token lives in an httpOnly cookie that page scripts cannot read, and is attached here.
 *
 *   API_URL        where the API is reachable from this server (default http://localhost:3000). Server-side only.
 *   COOKIE_SECURE  "true" | "false". Defaults to true in production builds.
 *
 * Run this behind a proxy or load balancer that sets X-Forwarded-For and strips any client-supplied value, because the
 * API's per-IP rate limits key on it.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API = (process.env.API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const SESSION = "sk_session"; // httpOnly: the real token
const HINT = "sk_auth"; // readable flag so the app knows whether to ask "who am I" at all; carries no secret
const SECURE = process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : process.env.NODE_ENV === "production";
const FORWARD = ["content-type", "accept", "idempotency-key", "user-agent", "x-forwarded-for"];
const RETURN = ["content-type", "content-disposition", "x-request-id", "retry-after"];

const fail = (status: number, code: string, message: string) => NextResponse.json({ error: { code, message } }, { status, headers: { "cache-control": "no-store" } });

type Ctx = { params: Promise<{ path: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  if (path.some((s) => s === "." || s === ".." || s.includes("\\"))) return fail(400, "BAD_PATH", "Invalid path");

  // A cookie-authenticated proxy must refuse cross-site writes.
  if (req.method !== "GET" && req.method !== "HEAD") {
    const origin = req.headers.get("origin");
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    let crossOrigin = req.headers.get("sec-fetch-site") === "cross-site";
    if (origin && host) { try { crossOrigin ||= new URL(origin).host !== host; } catch { crossOrigin = true; } }
    if (crossOrigin) return fail(403, "CROSS_ORIGIN", "Cross-site requests are not allowed");
  }

  const route = path.join("/");
  const headers = new Headers();
  for (const h of FORWARD) { const v = req.headers.get(h); if (v) headers.set(h, v); }
  const token = req.cookies.get(SESSION)?.value;
  if (token) headers.set("authorization", `Bearer ${token}`);

  // A CSV upload can be 100 MB. Buffering it here would hold the whole file in this server's memory and hit the 30 s limit,
  // so it is streamed straight through to the API (which streams it into the database) with a much longer allowance.
  const isUpload = req.method === "POST" && route === "imports";
  const init: RequestInit & { duplex?: "half" } = {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : isUpload ? req.body : await req.arrayBuffer(),
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.timeout(isUpload ? 20 * 60_000 : 30_000),
    ...(isUpload ? { duplex: "half" as const } : {}),
  };
  let up: Response;
  try {
    up = await fetch(`${API}/v1/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`, init);
  } catch {
    return fail(502, "UPSTREAM_UNAVAILABLE", "The server could not be reached. Try again shortly.");
  }

  let res: NextResponse;
  const isJson = (up.headers.get("content-type") ?? "").includes("application/json");
  if (route.startsWith("auth/") && up.ok && isJson) {
    // Login, register, accept-invite and session rotation return a token: move it into the cookie and never expose it to the page.
    const data = (await up.json().catch(() => null)) as Record<string, unknown> | null;
    const issued = data && typeof data.token === "string" ? data.token : null;
    if (data) delete data.token;
    res = NextResponse.json(data, { status: up.status });
    const id = up.headers.get("x-request-id");
    if (id) res.headers.set("x-request-id", id);
    if (issued) {
      const ttl = Math.max(60, Math.floor((Date.parse(String(data?.expiresAt)) - Date.now()) / 1000) || 43_200);
      const base = { secure: SECURE, sameSite: "lax" as const, path: "/", maxAge: ttl };
      res.cookies.set({ name: SESSION, value: issued, httpOnly: true, ...base });
      res.cookies.set({ name: HINT, value: "1", httpOnly: false, ...base });
    }
  } else {
    res = new NextResponse(up.status === 204 || up.status === 304 ? null : up.body, { status: up.status });
    for (const h of RETURN) { const v = up.headers.get(h); if (v) res.headers.set(h, v); }
  }

  if (route === "auth/logout" || (up.status === 401 && route !== "auth/login")) {
    res.cookies.delete(SESSION);
    res.cookies.delete(HINT);
  }
  res.headers.set("cache-control", "no-store");
  return res;
}

export const GET = handle, POST = handle, PUT = handle, PATCH = handle, DELETE = handle, HEAD = handle;
