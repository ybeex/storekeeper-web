"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { DropdownMenu } from "radix-ui";
import { Building2, Check, ChevronsUpDown, LayoutGrid, Loader2, Plus } from "lucide-react";
import { sk } from "@/lib/endpoints";
import { useAuth } from "@/lib/auth";
import { errMsg, useToast } from "./ui";

/**
 * The organisation name in the top bar. For an admin it opens the list of organisations they run, so switching is one
 * click from anywhere. Everyone else just sees the name.
 */
export function OrgSwitcher({ name }: { name: string }) {
  const { switchOrg } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const orgs = useQuery({ queryKey: ["account-orgs"], queryFn: sk.account.organizations, staleTime: 60_000 });
  const items = orgs.data?.items ?? [];

  const go = async (id: string, label: string) => {
    setBusy(id);
    try { await switchOrg(id); toast(`Now working in ${label}`); router.replace("/dashboard"); }
    catch (e) { toast(errMsg(e), "bad"); }
    finally { setBusy(null); }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="org-trigger" aria-label={`${name}. Switch organization`}>
        <span className="org-name">{name}</span>
        {busy ? <Loader2 size={16} className="spin" aria-hidden /> : <ChevronsUpDown size={16} aria-hidden />}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="menu glass org-menu" align="start" sideOffset={8}>
          <DropdownMenu.Label className="menu-label">Your organizations</DropdownMenu.Label>
          {orgs.isPending && <div className="menu-item muted" aria-busy="true"><Loader2 size={16} className="spin" aria-hidden />Loading</div>}
          {items.map((o) => (
            <DropdownMenu.Item key={o.id} className="menu-item org-item" disabled={!!busy} onSelect={() => (o.current ? undefined : void go(o.id, o.name))}>
              <Building2 size={16} aria-hidden /><span className="org-item-name">{o.name}</span>{o.current && <Check size={16} aria-label="Current organization" />}
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="menu-sep" />
          <DropdownMenu.Item className="menu-item" onSelect={() => router.push("/app")}><LayoutGrid size={16} aria-hidden />All organizations</DropdownMenu.Item>
          <DropdownMenu.Item className="menu-item" onSelect={() => router.push("/app?new=1")}><Plus size={16} aria-hidden />New organization</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
