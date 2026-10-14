import type { Role } from "./endpoints";

/** What each role may do. Mirrors the API's server-side checks; the API remains the authority, this only hides what would be refused. */
export type Cap = "move" | "catalogWrite" | "holdersWrite" | "approve" | "reconcile" | "import" | "team" | "invite" | "insights" | "audit" | "exportAudit" | "announce" | "photo" | "correct" | "dashboard" | "orgs";
const R: Record<Cap, Role[]> = {
  move: ["admin", "supervisor", "store_staff"],
  catalogWrite: ["admin"],
  holdersWrite: ["admin", "supervisor"],
  approve: ["admin", "supervisor"],
  reconcile: ["admin", "supervisor", "store_staff"],
  import: ["admin"],
  team: ["admin", "supervisor"],
  invite: ["admin"],
  insights: ["admin", "supervisor", "viewer"],
  audit: ["admin", "supervisor"],
  exportAudit: ["admin"],
  announce: ["admin", "supervisor"],
  photo: ["admin", "supervisor"],
  correct: ["admin", "supervisor"],
  // Store staff record movements; they do not review the store, so they get no dashboard and no analytics.
  dashboard: ["admin", "supervisor", "viewer"],
  // The organisations page (/app) and switching between organisations: administrators only.
  orgs: ["admin"],
};
export const can = (role: string | undefined, cap: Cap) => !!role && (R[cap] as string[]).includes(role);

/** Where a person lands after signing in, and where a blocked page sends them back to. */
export const homeFor = (role: string | undefined) => (can(role, "dashboard") ? "/dashboard" : "/transactions");
