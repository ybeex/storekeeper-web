import { expect, test } from "@playwright/test";
import { PASSWORD, seed, signedIn, uniq } from "./helpers";

test("a new store registers from the landing page and reaches its dashboard", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Start free" }).first().click();
  await expect(page).toHaveURL(/\/register/);
  await page.getByLabel("Organization name").fill(uniq("Acme Crew"));
  await page.getByLabel("Work email").fill(`${uniq("owner")}@example.com`);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByLabel(/I agree to the/).check();
  await page.getByRole("button", { name: "Create store" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("an existing user signs in, and signs out again", async ({ page, context }) => {
  const s = await seed();
  await page.goto("/login");
  await page.getByLabel("Organization").fill(s.organization);
  await page.getByLabel("Email").fill(s.email);
  await page.getByLabel("Password").fill(s.password);
  const login = page.waitForResponse((r) => r.url().includes("/api/v1/auth/login"));
  await page.getByRole("button", { name: "Sign in" }).click();
  // The page never receives the session token: the proxy moves it into an httpOnly cookie.
  expect(await (await login).json()).not.toHaveProperty("token");
  await expect(page).toHaveURL(/\/dashboard/);

  const session = (await context.cookies()).find((c) => c.name === "sk_session");
  expect(session?.httpOnly).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain("sk_session");
  expect(await page.evaluate(() => JSON.stringify({ ...sessionStorage, ...localStorage }))).not.toContain(session!.value);

  await page.getByRole("button", { name: "Account" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/");
  expect((await context.cookies()).find((c) => c.name === "sk_session")).toBeUndefined();
});

test("a wrong password is refused with a clear message", async ({ page }) => {
  const s = await seed();
  await page.goto("/login");
  await page.getByLabel("Organization").fill(s.organization);
  await page.getByLabel("Email").fill(s.email);
  await page.getByLabel("Password").fill("not-the-password-123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toContainText("do not match");
  await expect(page).toHaveURL(/\/login/);
});

test("an expired session sends the user to sign-in with an explanation", async ({ page, context }) => {
  const s = await seed();
  await signedIn(page, s.token);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  // The session stops being valid on the server (for example it expired or was revoked).
  const url = process.env.E2E_BASE_URL ?? "http://localhost:3001";
  await context.addCookies([{ name: "sk_session", value: "this-token-is-not-valid", url, httpOnly: true, sameSite: "Lax" }]);

  await page.getByRole("link", { name: "Outstanding" }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("status")).toContainText("session expired");
});

test("a cross-site write through the proxy is refused", async ({ request }) => {
  const res = await request.post("/api/v1/auth/logout", { headers: { Origin: "https://evil.example", "Sec-Fetch-Site": "cross-site" } });
  expect(res.status()).toBe(403);
});
