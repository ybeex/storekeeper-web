"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, hasSessionHint, sessionFlag, type Me } from "./api";
import { clearCache } from "./cache";
import { readQueue } from "./offline";

type Auth = {
  me: Me | null;
  ready: boolean;
  signIn: (v: { organization: string; email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-reads the signed-in user, for example right after the proxy set the session cookie (register, accept-invite). */
  refresh: () => Promise<void>;
  /** Admins only: moves into another of their organisations. Refuses while this device still holds unsynced offline work. */
  switchOrg: (orgId: string) => Promise<void>;
};
const Ctx = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    if (!hasSessionHint()) return setReady(true); // anonymous visitor: no request needed
    api<Me>("/auth/me")
      .then((m) => { setMe(m); sessionFlag.set(); })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    // The API said the session is no longer valid. The offline queue is kept and replays after signing in again.
    const expired = () => { qc.clear(); setMe(null); };
    window.addEventListener("sk-session-expired", expired);
    return () => window.removeEventListener("sk-session-expired", expired);
  }, [qc]);

  const refresh = useCallback(async () => {
    setMe(await api<Me>("/auth/me"));
    sessionFlag.set();
  }, []);

  const signIn: Auth["signIn"] = useCallback(async (v) => {
    await api("/auth/login", { method: "POST", body: v }); // the proxy turns the returned token into an httpOnly cookie
    await refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => undefined);
    sessionFlag.clear();
    await clearCache(); // reference data never outlives the session on a shared device
    qc.clear();
    setMe(null);
  }, [qc]);

  const switchOrg = useCallback(async (orgId: string) => {
    // Saved-offline actions belong to the organisation they were made in; replaying them into another would misfile them.
    const waiting = readQueue().length;
    if (waiting > 0) throw new Error(`${waiting} ${waiting === 1 ? "action is" : "actions are"} still saved on this device and not synced yet. Let ${waiting === 1 ? "it" : "them"} sync, then switch organization.`);
    await api("/auth/switch-org", { method: "POST", body: { orgId } }); // the proxy swaps the session cookie
    await clearCache(); // reference data from the old organisation must not be shown in the new one
    qc.clear();
    await refresh();
  }, [qc, refresh]);

  return <Ctx.Provider value={{ me, ready, signIn, signOut, refresh, switchOrg }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
