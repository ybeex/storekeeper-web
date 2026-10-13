import type { Page } from "@playwright/test";

export const API = (process.env.E2E_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const PASSWORD = "correct-horse-battery-staple";

let n = 0;
export const uniq = (p: string) => `${p}-${Date.now().toString(36)}${(n++).toString(36)}`;

async function call<T = any>(path: string, method: string, token?: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(method !== "GET" ? { "Idempotency-Key": crypto.randomUUID() } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

/** A fresh organization with one admin, one tool and one person, created straight through the API. */
export async function seed() {
  const email = `${uniq("admin")}@example.com`;
  const reg = await call("/auth/register", "POST", undefined, { organizationName: uniq("E2E Crew"), fullName: "Ada Admin", email, password: PASSWORD, firstLocationName: "Main store" });
  const token: string = reg.token;
  const shelf = await call("/shelves", "POST", token, { name: "Power tools" });
  const category = await call("/categories", "POST", token, { name: "Drills", shelfId: shelf.id });
  const item = await call("/items", "POST", token, { type: "asset", sku: uniq("DRL").toUpperCase(), name: "Makita drill", categoryId: category.id, assetTag: uniq("TAG").toUpperCase() });
  const person = await call("/people", "POST", token, { fullName: "John Okafor" });
  return { token, organization: reg.organizationSlug as string, email, password: PASSWORD, item, person };
}

/** Signs the browser in the way the app does: an httpOnly session cookie plus the readable hint cookie. */
export const signedIn = async (page: Page, token: string) => {
  const url = process.env.E2E_BASE_URL ?? "http://localhost:3001";
  await page.context().addCookies([
    { name: "sk_session", value: token, url, httpOnly: true, sameSite: "Lax" },
    { name: "sk_auth", value: "1", url, httpOnly: false, sameSite: "Lax" },
  ]);
};

/** How many items the app has saved for offline use. Never opens the database if the app has not created it yet. */
export const cachedItemCount = (page: Page) =>
  page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    if (!dbs.some((d) => d.name === "sk-cache")) return 0;
    return new Promise<number>((resolve) => {
      const o = indexedDB.open("sk-cache");
      o.onerror = () => resolve(0);
      o.onsuccess = () => {
        const db = o.result;
        if (!db.objectStoreNames.contains("items")) return resolve(0);
        const r = db.transaction("items").objectStore("items").count();
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => resolve(0);
      };
    });
  });

/** Fills the Check out form for the seeded tool and person. */
export async function issueDrill(page: Page) {
  const form = page.locator("form").filter({ hasText: "Issue to" });
  await form.getByLabel("Search items").fill("Makita");
  await form.getByRole("button", { name: /Makita drill/ }).click();
  await form.getByRole("combobox").filter({ hasText: "Choose person" }).click();
  await page.getByRole("option", { name: "John Okafor" }).click();
  await form.getByRole("button", { name: "Confirm" }).click();
}
