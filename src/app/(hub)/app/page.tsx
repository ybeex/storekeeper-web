"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Bell, Mail, Plus, Users } from "lucide-react";
import { sk } from "@/lib/endpoints";
import { useAuth } from "@/lib/auth";
import { Btn, Empty, Field, Modal, Skeleton, errMsg, useToast } from "@/components/ui";
import { NewCard } from "@/components/catalog";
import { PALETTE } from "@/components/appearance";

/** A stable colour per organisation, so each one is recognisable at a glance. */
const toneFor = (id: string) => PALETTE[[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % PALETTE.length][0];
const ago = (iso: string) => {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (m < 1) return "Just now"; if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} ${h === 1 ? "hour" : "hours"} ago`;
  const d = Math.round(h / 24); return `${d} ${d === 1 ? "day" : "days"} ago`;
};
const left = (iso: string) => {
  const h = Math.round((Date.parse(iso) - Date.now()) / 3_600_000);
  return h < 1 ? "Expires within the hour" : h < 48 ? `Expires in ${h} hours` : `Expires in ${Math.round(h / 24)} days`;
};

export default function OrganizationsPage() {
  const { me, switchOrg } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const overview = useQuery({ queryKey: ["account-overview"], queryFn: sk.account.overview, refetchInterval: 60_000 });
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [fresh, setFresh] = useState<string | null>(null); // the organisation just created, highlighted for a moment
  const [opening, setOpening] = useState<string | null>(null);

  // "New organization" in the top-bar menu lands here with ?new=1.
  useEffect(() => { if (new URLSearchParams(window.location.search).has("new")) { setCreating(true); window.history.replaceState(null, "", "/app"); } }, []);
  useEffect(() => { if (!fresh) return; const t = setTimeout(() => setFresh(null), 6000); return () => clearTimeout(t); }, [fresh]);

  const create = useMutation({
    mutationFn: () => sk.account.createOrganization({ organizationName: name.trim() }),
    onSuccess: async (o) => {
      toast(`${o.name} is ready`); setCreating(false); setName(""); setFresh(o.id);
      await Promise.all([qc.invalidateQueries({ queryKey: ["account-overview"] }), qc.invalidateQueries({ queryKey: ["account-orgs"] })]);
    },
    onError: (e) => toast(errMsg(e), "bad"),
  });

  /** Opens an organisation. Moving into a different one swaps the session; the current one just navigates. */
  const open = async (org: { id: string; name: string; current?: boolean }, to = "/dashboard") => {
    setOpening(org.id);
    try {
      const current = org.current ?? org.id === overview.data?.organizations.find((o) => o.current)?.id;
      if (!current) await switchOrg(org.id);
      router.push(to);
    } catch (e) { toast(errMsg(e), "bad"); setOpening(null); }
  };

  const d = overview.data;
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Your organizations</h1>
          <p className="muted lede">{me?.fullName ? `${me.fullName}, open` : "Open"} one to work in it, or start another under the same login.</p>
        </div>
        <div className="page-actions"><Btn className="primary" onClick={() => setCreating(true)}><Plus size={16} />New organization</Btn></div>
      </div>

      {overview.isError && <div className="glass card empty">Could not load your organizations.<Btn onClick={() => void overview.refetch()}>Try again</Btn></div>}
      {overview.isPending && <div className="hub-grid"><div className="cards"><div className="skeleton card-skel" /><div className="skeleton card-skel" /></div><Skeleton rows={4} /></div>}

      {d && (
        <div className="hub-grid">
          <section aria-label="Organizations">
            <div className="cards">
              {d.organizations.map((o) => (
                <article key={o.id} className={`tile-card glass tone-${toneFor(o.id)}${fresh === o.id ? " hub-new" : ""}`}>
                  <div className="tile-top">
                    <span className={`glyph solid tone-${toneFor(o.id)}`} style={{ width: 48, height: 48, borderRadius: 14, font: "900 22px var(--display)" }} aria-hidden>{o.name.trim().charAt(0).toUpperCase()}</span>
                    {o.current ? <span className="badge ok">You are here</span> : fresh === o.id ? <span className="badge">New</span> : null}
                  </div>
                  <h2 className="tile-title">{o.name}</h2>
                  <div className="tile-meta">
                    <span><Users size={14} aria-hidden /> {o.members} {o.members === 1 ? "person" : "people"}</span>
                    {o.unread > 0 && <span><Bell size={14} aria-hidden /> {o.unread} unread {o.unread === 1 ? "alert" : "alerts"}</span>}
                  </div>
                  <div className="tile-foot"><Btn className="primary" busy={opening === o.id} busyLabel="Opening" disabled={!!opening} onClick={() => void open(o)}>{o.current ? "Continue" : "Open"}<ArrowRight size={16} aria-hidden /></Btn></div>
                </article>
              ))}
              <NewCard label="New organization" onClick={() => setCreating(true)} />
            </div>
          </section>

          <aside className="hub-side" aria-label="Invitations and alerts">
            <section className="glass card">
              <h2 className="sub-title">Invitations waiting</h2>
              {d.pendingInvites.length === 0 ? <Empty>No invitations are waiting. Invite people from Team inside an organization.</Empty> : (
                <ul className="hub-list">{d.pendingInvites.map((i) => (
                  <li key={i.id}>
                    <span className="hub-ico"><Mail size={16} aria-hidden /></span>
                    <div className="hub-li"><strong>{i.email}</strong><span className="muted small">{String(i.role ?? "").replace("_", " ")} at {i.orgName}</span><span className="muted small">{left(i.expiresAt)}</span></div>
                  </li>
                ))}</ul>
              )}
            </section>
            <section className="glass card">
              <h2 className="sub-title">Latest alerts</h2>
              {d.notifications.length === 0 ? <Empty>Nothing needs your attention in any organization.</Empty> : (
                <ul className="hub-list">{d.notifications.map((n) => (
                  <li key={n.id}>
                    <button type="button" className={`hub-note${n.read ? "" : " unread"}`} disabled={!!opening} onClick={() => void open({ id: n.orgId, name: n.orgName }, "/notifications")}>
                      <span className="hub-li"><strong>{n.title}</strong><span className="muted small hub-clamp">{n.body}</span><span className="muted small">{n.orgName}, {ago(n.createdAt)}</span></span>
                    </button>
                  </li>
                ))}</ul>
              )}
            </section>
          </aside>
        </div>
      )}

      <Modal open={creating} onOpenChange={(o) => !create.isPending && setCreating(o)} title="New organization" description="It gets its own people, shelves and items. You stay signed in with the same login and can switch between organizations at any time.">
        <form className="form-grid" onSubmit={(e) => { e.preventDefault(); if (name.trim().length >= 2) create.mutate(); }}>
          <Field label="Organization name" htmlFor="org-name"><input id="org-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoFocus placeholder="Okafor Provisions, Warri branch" /></Field>
          <div className="modal-actions">
            <Btn onClick={() => setCreating(false)} disabled={create.isPending}>Cancel</Btn>
            <Btn type="submit" className="primary" busy={create.isPending} busyLabel="Creating organization" disabled={name.trim().length < 2}>Create organization</Btn>
          </div>
        </form>
      </Modal>
    </>
  );
}
