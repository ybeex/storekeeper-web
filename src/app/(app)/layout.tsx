"use client";
import { useEffect, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { DropdownMenu } from "radix-ui";
import { Activity, BarChart3, Bell, Boxes, CheckSquare, ClipboardCheck, FileUp, Gauge, Layers, LogOut, Package, PackageMinus, Repeat, Settings, User, UserCheck, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { sk } from "@/lib/endpoints";
import { can, homeFor, type Cap } from "@/lib/roles";
import { OrgSwitcher } from "@/components/org-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { SyncBar } from "@/components/sync-bar";
import { ScanButton, ScanHost } from "@/components/scan";
import { InstallButton } from "@/components/pwa";
import { cacheMeta, refreshCache } from "@/lib/cache";
import { useOnline } from "@/lib/offline";

type NavLink = [string, string, ComponentType<{ size?: number }>, Cap?];
const NAV: [string, NavLink[]][] = [
  ["Overview", [["/dashboard", "Dashboard", Gauge, "dashboard"]]],
  ["Store", [["/outstanding", "Outstanding", UserCheck], ["/low-stock", "Low stock", PackageMinus], ["/catalog", "Catalog", Layers], ["/transactions", "Transactions", Repeat]]],
  ["Control", [["/holders", "Holders", Users], ["/reconciliation", "Reconciliation", ClipboardCheck], ["/approvals", "Approvals", CheckSquare], ["/activity", "Activity", Activity], ["/insights", "Insights", BarChart3, "insights"]]],
  ["Admin", [["/imports", "Import", FileUp, "import"], ["/team", "Team", Boxes, "team"], ["/settings", "Settings", Settings]]],
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { me, ready, signOut } = useAuth();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => { if (ready && !me) router.replace("/login"); }, [ready, me, router]);
  // Store staff have no dashboard or analytics: anything that lands them there sends them to their own work instead.
  useEffect(() => { if (me && path.startsWith("/dashboard") && !can(me.role, "dashboard")) router.replace(homeFor(me.role)); }, [me, path, router]);
  const online = useOnline();
  useEffect(() => {
    if (!me || !online) return;
    let stop = false;
    const run = async () => { const m = await cacheMeta(); if (!stop && (!m || Date.now() - m.syncedAt > 15 * 60_000)) await refreshCache().catch(() => undefined); };
    void run();
    const t = setInterval(() => void run(), 5 * 60_000);
    return () => { stop = true; clearInterval(t); };
  }, [me, online]);
  const unread = useQuery({ queryKey: ["unread"], queryFn: sk.notifications.unreadCount, enabled: !!me, refetchInterval: 60_000 });
  if (!ready || !me) return <div className="boot" aria-busy="true" />;
  const count = unread.data?.unread ?? 0;

  return (
    <div className="shell">
      <aside className="side glass">
        <Link href={homeFor(me.role)} className="brand"><span className="brand-mark"><Package size={18} /></span>StoreKeeper</Link>
        <nav aria-label="Primary">
          {NAV.map(([group, all]) => { const links = all.filter((l) => !l[3] || can(me.role, l[3])); return links.length === 0 ? null : (
            <div key={group} className="nav-group">
              <span className="nav-label">{group}</span>
              {links.map(([href, label, Icon]) => (
                <Link key={href} href={href} className="nav-link" aria-current={path.startsWith(href) ? "page" : undefined}><Icon size={17} />{href === "/activity" && me.role === "store_staff" ? "My activity" : label}</Link>
              ))}
            </div>
          ); })}
        </nav>
        <p className="org-tag muted">{me.orgName ?? "Your store"}</p>
      </aside>
      <div className="main-col">
        <header className="appbar">
          <div className="appbar-in">
          {can(me.role, "orgs") ? <OrgSwitcher name={me.orgName ?? "Your store"} /> : <span className="org-name" title={me.orgName}>{me.orgName}</span>}
          <div className="topbar-end">
            <InstallButton />
            <span className="hide-sm"><ScanButton /></span>
            <Link href="/notifications" className="btn icon bell" aria-label={`Notifications${count ? `, ${count} unread` : ""}`}><Bell size={18} />{count > 0 && <span className="bell-dot">{count > 99 ? "99+" : count}</span>}</Link>
            <ThemeToggle />
            <DropdownMenu.Root>
              <DropdownMenu.Trigger className="btn icon" aria-label="Account"><User size={18} /></DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="menu glass" align="end" sideOffset={8}>
                  <DropdownMenu.Label className="menu-label">{me.fullName ?? me.email}<small>{me.role.replace("_", " ")}</small></DropdownMenu.Label>
                  <DropdownMenu.Separator className="menu-sep" />
                  <DropdownMenu.Item className="menu-item" onSelect={() => router.push("/settings")}><Settings size={16} />Settings</DropdownMenu.Item>
                  <DropdownMenu.Item className="menu-item" onSelect={() => void signOut().then(() => router.replace("/"))}><LogOut size={16} />Sign out</DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
          </div>
        </header>
        <SyncBar />
        <ScanHost />
        <span className="fab-wrap"><ScanButton fab /></span>
        <main className="page">{children}</main>
      </div>
    </div>
  );
}
