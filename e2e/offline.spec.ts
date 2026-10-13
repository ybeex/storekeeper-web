import { expect, test } from "@playwright/test";
import { cachedItemCount, issueDrill, seed, signedIn } from "./helpers";

test("a checkout made without a signal is saved on the device and syncs when the connection returns", async ({ page, context }) => {
  const s = await seed();
  await signedIn(page, s.token);

  // Load the screen online and let the app save its offline copy of items and people.
  await page.goto("/transactions");
  await expect.poll(() => cachedItemCount(page), { timeout: 30_000 }).toBeGreaterThan(0);

  await context.setOffline(true);
  await issueDrill(page);
  await expect(page.getByText("Saved on this device")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("1 waiting to sync");

  await context.setOffline(false);
  await expect(page.getByText(/Synced 1 saved action/)).toBeVisible({ timeout: 40_000 });

  await page.goto("/outstanding");
  await expect(page.getByRole("row", { name: /Makita drill/ })).toContainText("John Okafor");
});
