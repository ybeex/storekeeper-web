"use client";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Registers the service worker in production builds. */
export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);
  return null;
}

/** Shows an Install button when the browser says the app can be installed. */
export function InstallButton() {
  const [ev, setEv] = useState<InstallEvent | null>(null);
  useEffect(() => {
    const on = (e: Event) => { e.preventDefault(); setEv(e as InstallEvent); };
    window.addEventListener("beforeinstallprompt", on);
    window.addEventListener("appinstalled", () => setEv(null));
    return () => window.removeEventListener("beforeinstallprompt", on);
  }, []);
  if (!ev) return null;
  return <button className="btn sm hide-sm" onClick={() => { void ev.prompt(); setEv(null); }}><Download size={15} />Install app</button>;
}
