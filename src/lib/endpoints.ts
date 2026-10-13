import { api, uploadWithProgress, type Page, type Row } from "./api";

type Q = Record<string, string | number | boolean | null | undefined>;
const qs = (p?: Q) => {
  const e = Object.entries(p ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== "");
  return e.length ? "?" + new URLSearchParams(e.map(([k, v]) => [k, String(v)])).toString() : "";
};
const get = <T = Row>(path: string, p?: Q) => api<T>(path + qs(p));
const send = <T = Row>(method: string, path: string, body?: unknown) => api<T>(path, { method, body });
const send2 = <T = Row>(path: string, body: unknown, idempotencyKey?: string) => api<T>(path, { method: "POST", body, idempotencyKey });
const post = <T = Row>(path: string, body?: unknown) => send<T>("POST", path, body);
const patch = <T = Row>(path: string, body?: unknown) => send<T>("PATCH", path, body);
const put = <T = Row>(path: string, body?: unknown) => send<T>("PUT", path, body);
const del = <T = void>(path: string) => send<T>("DELETE", path);

export type ImportUpload = { id: string; headers: string[]; totalRows: number; preview: Row[]; mappableFields: string[] };
export type ImportError = { row: number; field: string; message: string };
export type ImportStatus = "uploaded" | "validating" | "ready" | "queued" | "committing" | "completed" | "failed";
export type ImportState = {
  id: string; fileName?: string; status: ImportStatus; processedRows: number; totalRows: number | null; percent: number;
  validRows: number | null; invalidRows: number | null; importedRows?: number | null; skippedRows?: number | null; failedRows?: number | null;
  failureReason?: string | null; errors: ImportError[];
};
export type DashboardAnalytics = {
  days: number; timezone: string;
  daily: { date: string; checkouts: number; checkins: number; consumed: number; restocked: number; incidents: number; total: number }[];
  topConsumed: { item_id: string; name: string; unit: string | null; units: number }[];
  incidents: { current: number; previous: number; lost: number; damaged: number };
  stockHealth: { out: number; low: number; near: number; ok: number };
  topHolders: { holder: string | null; type: string; lines: number; overdue: number }[];
  summary: { total: number; previousTotal: number; checkouts: number; activeUsers: number; accountableRate: number | null; offlineShare: number | null };
};

export type Holder = { type: "person" | "team" | "job"; id: string };
export type Condition = "good" | "damaged" | "needs_inspection" | "replaced";
export type Role = "admin" | "store_staff" | "supervisor" | "viewer";

/** Simple CRUD resource under /v1/<base>. */
const crud = (base: string) => ({
  list: (p?: Q) => get<Page | Row[]>(base, p),
  get: (id: string) => get(`${base}/${id}`),
  create: (b: Row) => post(base, b),
  update: (id: string, b: Row) => patch(`${base}/${id}`, b),
  remove: (id: string) => del(`${base}/${id}`),
});

/** Every route the API exposes, grouped by module. */
export const sk = {
  auth: {
    register: (b: { organizationName: string; fullName?: string; email: string; password: string; firstLocationName?: string }) => post("/auth/register", b),
    login: (b: { organization: string; email: string; password: string }) => post<{ token: string }>("/auth/login", b),
    logout: () => post("/auth/logout"),
    me: () => get("/auth/me"),
    updateProfile: (b: Row) => patch("/auth/profile", b),
    sessions: () => get<Page | Row[]>("/auth/sessions"),
    revokeSession: (id: string) => del(`/auth/sessions/${id}`),
    changePassword: (b: { currentPassword: string; newPassword: string }) => post("/auth/change-password", b),
    forgotPassword: (b: { organization: string; email: string }) => post("/auth/forgot-password", b),
    resetPassword: (b: { token: string; password: string }) => post("/auth/reset-password", b),
    acceptInvite: (b: { token: string; password: string }) => post("/auth/accept-invite", b),
  },
  users: {
    list: (p?: Q) => get<Page | Row[]>("/users", p),
    get: (id: string) => get(`/users/${id}`),
    update: (id: string, b: Row) => patch(`/users/${id}`, b),
    setLocations: (id: string, locationIds: string[]) => put(`/users/${id}/locations`, { locationIds }),
    invites: {
      create: (b: { email: string; role: Role; fullName?: string; personId?: string; locationIds?: string[] }) => post("/users/invites", b),
      list: (p?: Q) => get<Page | Row[]>("/users/invites", p),
      resend: (id: string) => post(`/users/invites/${id}/resend`),
      revoke: (id: string) => del(`/users/invites/${id}`),
    },
  },
  organization: {
    settings: () => get("/organization/settings"),
    updateSettings: (b: Row) => patch("/organization/settings", b),
    policies: () => get("/organization/approval-policies"),
    setPolicies: (policies: Row[]) => put("/organization/approval-policies", { policies }),
  },
  locations: crud("/locations"),
  people: crud("/people"),
  teams: {
    ...crud("/teams"),
    addMembers: (id: string, personIds: string[]) => post(`/teams/${id}/members`, { personIds }),
    removeMember: (id: string, personId: string) => del(`/teams/${id}/members/${personId}`),
  },
  jobs: crud("/jobs"),
  shelves: crud("/shelves"),
  categories: crud("/categories"),
  files: {
    upload: (kind: "item_photo" | "transaction_snapshot", file: File) => {
      const f = new FormData();
      f.append("kind", kind); // must precede the file part
      f.append("file", file);
      return post("/files", f);
    },
    url: (id: string) => get<{ url: string | null; expiresInSeconds: number }>(`/files/${id}`),
  },
  items: {
    list: (p?: Q) => get<Page>("/items", p),
    create: (b: Row) => post("/items", b),
    bulkMove: (itemIds: string[], categoryId: string) => post("/items/bulk-move", { itemIds, categoryId }),
    lookup: (p: Q) => get("/items/lookup", p),
    get: (id: string) => get(`/items/${id}`),
    update: (id: string, b: Row) => patch(`/items/${id}`, b),
    archive: (id: string) => del(`/items/${id}`),
    restore: (id: string) => post(`/items/${id}/restore`),
    timeline: (id: string, p?: Q) => get<Page>(`/items/${id}/timeline`, p),
    qrPath: (id: string) => `/items/${id}/qr`,
  },
  transactions: {
    list: (p?: Q) => get<Page>("/transactions", p),
    get: (id: string) => get(`/transactions/${id}`),
    checkout: (b: Row, key?: string) => send2("/checkouts", b, key),
    batchCheckout: (b: Row) => post("/checkouts/batch", b),
    checkin: (b: Row, key?: string) => send2("/checkins", b, key),
    consume: (b: Row, key?: string) => send2("/consumptions", b, key),
    restock: (b: Row, key?: string) => send2("/restocks", b, key),
    adjust: (b: Row) => post("/adjustments", b),
    loss: (b: Row) => post("/losses", b),
    damage: (b: Row) => post("/damages", b),
    condition: (itemId: string, b: { condition: Condition; note?: string }) => post(`/items/${itemId}/condition`, b),
    status: (itemId: string, b: { to: "available" | "under_repair" | "retired"; note?: string }) => post(`/items/${itemId}/status`, b),
    transfer: (b: Row) => post("/transfers", b),
    correct: (id: string, note: string) => post(`/transactions/${id}/corrections`, { note }),
  },
  approvals: {
    list: (p?: Q) => get<Page>("/approvals", p),
    get: (id: string) => get(`/approvals/${id}`),
    approve: (id: string, b?: Row) => post(`/approvals/${id}/approve`, b ?? {}),
    reject: (id: string, b?: Row) => post(`/approvals/${id}/reject`, b ?? {}),
    cancel: (id: string) => post(`/approvals/${id}/cancel`),
  },
  reconciliation: {
    list: (p?: Q) => get<Page>("/reconciliation-sessions", p),
    start: (b: Row) => post("/reconciliation-sessions", b),
    get: (id: string) => get(`/reconciliation-sessions/${id}`),
    count: (id: string, b: { itemId: string; physicalQuantity: number; reason?: string; note?: string }) => post(`/reconciliation-sessions/${id}/counts`, b),
    close: (id: string, b?: Row) => post(`/reconciliation-sessions/${id}/close`, b),
    schedules: () => get<Page | Row[]>("/reconciliation-sessions/schedules"),
    createSchedule: (b: Row) => post("/reconciliation-sessions/schedules", b),
    updateSchedule: (id: string, b: Row) => patch(`/reconciliation-sessions/schedules/${id}`, b),
  },
  imports: {
    list: () => get<Page | Row[]>("/imports"),
    /** Streams the file to the server. `onProgress` gets 0..1 as the bytes go up. */
    upload: (file: File, onProgress: (fraction: number) => void, locationId?: string) => {
      const f = new FormData();
      if (locationId) f.append("locationId", locationId); // must precede the file part
      f.append("file", file);
      return uploadWithProgress<ImportUpload>("/imports", f, onProgress);
    },
    /** Starts validation. It runs in the background: poll `get` for progress and the report. */
    validate: (id: string, b: { mapping: Record<string, string>; defaultType?: "asset" | "consumable"; defaultShelfId?: string; createMissing?: boolean }) => post<ImportState>(`/imports/${id}/validate`, b),
    commit: (id: string) => post<{ id: string; status: string }>(`/imports/${id}/commit`),
    get: (id: string) => get<ImportState>(`/imports/${id}`),
    discard: (id: string) => del(`/imports/${id}`),
  },
  sync: {
    batch: (b: Row) => post("/sync/batch", b),
    conflicts: (p?: Q) => get<Page | Row[]>("/sync/conflicts", p),
    resolve: (id: string, b: Row) => post(`/sync/conflicts/${id}/resolve`, b),
  },
  notifications: {
    list: (p?: Q) => get<Page>("/notifications", p),
    unreadCount: () => get<{ unread: number }>("/notifications/unread-count"),
    read: (id: string) => post(`/notifications/${id}/read`),
    readAll: () => post("/notifications/read-all"),
    rules: () => get("/notifications/rules"),
    setRules: (rules: Row[]) => put("/notifications/rules", { rules }),
    announce: (b: Row) => post("/notifications/announcements", b),
  },
  views: {
    dashboard: () => get("/dashboard"),
    dashboardAnalytics: (days = 14) => get<DashboardAnalytics>("/dashboard/analytics", { days }),
    outstanding: (p?: Q) => get<Page>("/outstanding", p),
    lowStock: (p?: Q) => get<Page>("/low-stock", p),
  },
  reports: {
    inventory: (p?: Q) => get<Page | Row[]>("/reports/inventory", p),
    outstanding: (p?: Q) => get<Page | Row[]>("/reports/outstanding", p),
    transactions: (p?: Q) => get<Page | Row[]>("/reports/transactions", p),
    discrepancies: (p?: Q) => get<Page | Row[]>("/reports/discrepancies", p),
  },
  analytics: {
    lossDamage: (p?: Q) => get<Page | Row[]>("/analytics/loss-damage", p),
    consumption: (p?: Q) => get<Page | Row[]>("/analytics/consumption", p),
    assetUtilization: (p?: Q) => get<Page | Row[]>("/analytics/asset-utilization", p),
    reorder: (p?: Q) => get<Page | Row[]>("/analytics/reorder-recommendations", p),
    accountability: (p?: Q) => get<Page | Row[]>("/analytics/accountability", p),
  },
  audit: {
    list: (p?: Q) => get<Page>("/audit-logs", p),
    entity: (type: string, id: string) => get<Page>(`/audit-logs/entity/${type}/${id}`),
    exportPath: "/audit-logs/export.csv",
  },
  activity: {
    list: (p?: Q) => get<Page>("/activity", p),
    holders: (p?: Q) => get<Page | Row[]>("/holders", p),
  },
  public: {
    contact: (b: { name: string; email: string; company?: string; topic: "sales" | "pilot" | "support" | "press" | "other"; message: string; website?: string }) => post<{ ok: boolean }>("/public/contact", b),
  },
  ops: { health: () => get("/healthz"), ready: () => get("/readyz") },
};
