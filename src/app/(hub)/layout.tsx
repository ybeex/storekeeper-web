"use client";
import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import { LogOut, Package, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { can, homeFor } from "@/lib/roles";
import { ThemeToggle } from "@/components/theme-toggle";

/** A lighter shell than the working app: no store navigation, because you have not chosen a store yet. Admins only. */
export default function HubLayout({ children }: { children: ReactNode }) {
  const { me, ready, signOut } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    if (!me) router.replace("/login");
    else if (!can(me.role, "orgs")) router.replace(homeFor(me.role)); // only administrators have an organisations page
  }, [ready, me, router]);
  if (!ready || !me || !can(me.role, "orgs")) return <div className="boot" aria-busy="true" />;
  return (
    <div className="hub-shell">
      <header className="appbar">
        <div className="appbar-in">
          <Link href="/app" className="brand"><span className="brand-mark"><Package size={18} /></span>StoreKeeper</Link>
          <div className="topbar-end">
            <ThemeToggle />
            <DropdownMenu.Root>
              <DropdownMenu.Trigger className="btn icon" aria-label="Account"><User size={18} /></DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="menu glass" align="end" sideOffset={8}>
                  <DropdownMenu.Label className="menu-label">{me.fullName ?? me.email}<small>{me.email}</small></DropdownMenu.Label>
                  <DropdownMenu.Item className="menu-item" onSelect={() => void signOut().then(() => router.replace("/login"))}><LogOut size={16} />Sign out</DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </header>
      <main className="hub-main">{children}</main>
    </div>
  );
}
