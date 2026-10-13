import { expect, test } from "@playwright/test";
import { issueDrill, seed, signedIn } from "./helpers";

test("issue a tool, see it outstanding, then return it in one tap", async ({ page }) => {
  const s = await seed();
  await signedIn(page, s.token);

  await page.goto("/transactions");
  await issueDrill(page);
  await expect(page.getByText("Recorded", { exact: true })).toBeVisible();

  await page.goto("/outstanding");
  const row = page.getByRole("row", { name: /Makita drill/ });
  await expect(row).toContainText("John Okafor");

  await row.getByRole("button", { name: "Return", exact: true }).click();
  await expect(page.getByText("Makita drill returned")).toBeVisible();
  await expect(page.getByText("Nothing is out")).toBeVisible();
});

test("a tool that is already out cannot be issued twice", async ({ page }) => {
  const s = await seed();
  await signedIn(page, s.token);
  await page.goto("/transactions");
  await issueDrill(page);
  await expect(page.getByText("Recorded", { exact: true })).toBeVisible();

  await page.reload();
  await issueDrill(page);
  // The API refuses; the app surfaces the reason instead of recording a second movement.
  await expect(page.locator(".toast.bad")).toBeVisible();
});
