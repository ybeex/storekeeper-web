"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { DropdownMenu } from "radix-ui";
import { Archive, MoreHorizontal, Pencil, Plus } from "lucide-react";
import { rowsOf, type Row } from "@/lib/api";
import { sk } from "@/lib/endpoints";
import { Btn, Field, Modal, Select, errMsg, useToast } from "./ui";
import { Glyph, LookPicker, iconOf, resolveLook, type Look } from "./appearance";
import { PhotoField } from "./photo";

/** Everything that shows shelves, categories or items re-reads after a catalog change. */
export const refreshCatalog = (qc: QueryClient) =>
  Promise.all(["shelves", "shelf", "categories", "category", "cat-items", "items", "dash-items", "item-pick"].map((k) => qc.invalidateQueries({ queryKey: [k] })));

const num = (v: unknown) => (typeof v === "number" ? v : 0);
const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString()} ${n === 1 ? one : many}`;
const look = (r: Row | undefined, ...parents: Array<Row | undefined>) => resolveLook(r as Look, ...(parents as Look[]));

/** One shared place that knows how to read shelves and categories (so the modals can offer them). */
export function useShelves() { return useQuery({ queryKey: ["shelves"], queryFn: () => sk.shelves.list() }); }
export function useCategories() { return useQuery({ queryKey: ["categories"], queryFn: () => sk.categories.list() }); }

/* ───────────────────────── cards ───────────────────────── */

export function CardMenu({ label, onEdit, onArchive }: { label: string; onEdit: () => void; onArchive: () => void }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="btn icon sm tile-menu" aria-label={`Options for ${label}`}><MoreHorizontal size={18} /></DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="menu glass" align="end" sideOffset={6}>
          <DropdownMenu.Item className="menu-item" onSelect={onEdit}><Pencil size={16} />Edit</DropdownMenu.Item>
          <DropdownMenu.Item className="menu-item" onSelect={onArchive}><Archive size={16} />Archive</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function Attention({ stats }: { stats: Row | undefined }) {
  const low = num(stats?.lowStock), overdue = num(stats?.overdue), out = num(stats?.assetsOut), repair = num(stats?.underRepair);
  if (!low && !overdue && !out && !repair) return <span className="muted small">Nothing needs attention</span>;
  return (
    <>
      {overdue > 0 && <span className="badge bad">{overdue} overdue</span>}
      {low > 0 && <span className="badge warn">{low} low stock</span>}
      {repair > 0 && <span className="badge warn">{repair} in repair</span>}
      {out > 0 && <span className="badge">{out} out</span>}
    </>
  );
}

export function ShelfCard({ shelf, onEdit, onArchive, canWrite }: { shelf: Row; onEdit: () => void; onArchive: () => void; canWrite: boolean }) {
  const l = look(shelf); const stats = shelf.stats as Row | undefined; const items = num(stats?.assets) + num(stats?.products);
  return (
    <article className={`tile-card glass tone-${l.color}`}>
      <div className="tile-top">
        <Glyph look={l} size={48} solid />
        {canWrite && <CardMenu label={String(shelf.name)} onEdit={onEdit} onArchive={onArchive} />}
      </div>
      <h3 className="tile-title"><Link href={`/catalog/shelves/${shelf.id}`} className="tile-link">{String(shelf.name)}</Link></h3>
      <div className="tile-meta"><span>{plural(num(shelf.categoryCount), "category", "categories")}</span><span>{plural(items, "item")}</span></div>
      <div className="tile-foot"><Attention stats={stats} /></div>
    </article>
  );
}

export function CategoryCard({ category, shelf, onEdit, onArchive, canWrite }: { category: Row; shelf?: Row; onEdit: () => void; onArchive: () => void; canWrite: boolean }) {
  const l = look(category, shelf); const stats = category.stats as Row | undefined; const items = num(stats?.assets) + num(stats?.products);
  return (
    <article className={`tile-card glass tone-${l.color}`}>
      <div className="tile-top">
        <Glyph look={l} size={48} solid />
        {canWrite && <CardMenu label={String(category.name)} onEdit={onEdit} onArchive={onArchive} />}
      </div>
      <h3 className="tile-title"><Link href={`/catalog/categories/${category.id}`} className="tile-link">{String(category.name)}</Link></h3>
      <div className="tile-meta"><span>{plural(items, "item")}</span>{num(stats?.units) > 0 && <span>{plural(num(stats?.units), "unit")} in stock</span>}</div>
      <div className="tile-foot"><Attention stats={stats} /></div>
    </article>
  );
}

/** The cover shared by the card and the form preview: the photo if there is one, otherwise the item's icon on its colour. */
export function ItemCover({ item, category, shelf }: { item: Row; category?: Row; shelf?: Row }) {
  const fromItem = look(item, { color: item.categoryColor as string, icon: item.categoryIcon as string }, { color: item.shelfColor as string, icon: item.shelfIcon as string }, category, shelf);
  const Icon = iconOf(fromItem.icon);
  return (
    <div className={`item-cover tone-${fromItem.color}`}>
      {item.photoUrl ? <img src={String(item.photoUrl)} alt="" loading="lazy" /> : <Icon className="cover-icon" size={52} strokeWidth={1.6} aria-hidden />}
    </div>
  );
}

export function ItemCard({ item }: { item: Row }) {
  const isAsset = item.type === "asset";
  const qty = num(item.quantityAvailable); const low = !!item.lowStock;
  const status = String(item.assetStatus ?? "").replace(/_/g, " ");
  return (
    <article className="item-card glass">
      <ItemCover item={item} />
      <div className="item-body">
        <Link href={`/items/${item.id}`} className="tile-link item-name">{String(item.name)}</Link>
        <span className="item-sku">{String(item.sku ?? "")}</span>
        <div className="item-avail">
          {isAsset ? (
            <span className={`badge ${item.assetStatus === "available" ? "ok" : item.assetStatus === "checked_out" ? "" : "warn"}`}>{status || "asset"}</span>
          ) : (
            <>
              <span className={`badge ${qty <= 0 ? "bad" : low ? "warn" : "ok"}`}>{qty.toLocaleString()} {String(item.unit ?? "in stock")}</span>
              {low && qty > 0 && <span className="badge warn">low</span>}
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export function NewCard({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" className="new-card" onClick={onClick}><span className="plus"><Plus size={22} /></span>{label}</button>;
}

export function CardGridSkeleton({ items = false }: { items?: boolean }) {
  return <div className={`card-grid-skel`} aria-busy="true">{Array.from({ length: items ? 8 : 4 }, (_, i) => <div key={i} className="skeleton card-skel" style={{ animationDelay: `${i * 80}ms` }} />)}</div>;
}

export function Crumbs({ trail }: { trail: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {trail.map((t, i) => (
        <span key={i} className="crumb-part">
          {t.href ? <Link href={t.href}>{t.label}</Link> : <span aria-current="page">{t.label}</span>}
          {i < trail.length - 1 && <span aria-hidden> / </span>}
        </span>
      ))}
    </nav>
  );
}

/* ───────────────────────── shelf modal ───────────────────────── */

export function ShelfModal({ open, onOpenChange, shelf, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; shelf?: Row; onSaved?: (s: Row) => void }) {
  const qc = useQueryClient(); const toast = useToast();
  const locations = useQuery({ queryKey: ["locations", "options"], queryFn: () => sk.locations.list(), enabled: open });
  const locs = rowsOf(locations.data);
  const [name, setName] = useState(""); const [code, setCode] = useState(""); const [locationId, setLocationId] = useState<string>("");
  const [lk, setLk] = useState<Look>({});
  useEffect(() => {
    if (!open) return;
    setName(String(shelf?.name ?? "")); setCode(String(shelf?.code ?? "")); setLocationId(String(shelf?.locationId ?? ""));
    setLk({ color: (shelf?.color as string) ?? null, icon: (shelf?.icon as string) ?? null });
  }, [open, shelf]);
  const save = useMutation({
    mutationFn: () => {
      const b: Row = { name: name.trim(), color: lk.color ?? null, icon: lk.icon ?? null };
      if (code.trim()) b.code = code.trim();
      if (shelf) return sk.shelves.update(String(shelf.id), b);
      if (locationId) b.locationId = locationId;
      return sk.shelves.create(b);
    },
    onSuccess: async (r) => { toast(shelf ? "Shelf updated" : "Shelf created"); await refreshCatalog(qc); onOpenChange(false); onSaved?.(r as Row); },
    onError: (e) => toast(errMsg(e), "bad"),
  });
  return (
    <Modal open={open} onOpenChange={onOpenChange} wide title={shelf ? "Edit shelf" : "New shelf"} description="A shelf is a place in your store. Categories live on shelves, and items live in categories.">
      <div className="form-grid">
        <Field label="Name" htmlFor="sh-name"><input id="sh-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoFocus placeholder="Safety wall" /></Field>
        <Field label="Code (optional)" htmlFor="sh-code" hint="A short label, such as the one on the shelf."><input id="sh-code" className="input" value={code} onChange={(e) => setCode(e.target.value)} maxLength={40} /></Field>
        {!shelf && locs.length > 1 && <Field label="Location"><Select value={locationId} onValueChange={setLocationId} options={locs.map((l) => ({ value: String(l.id), label: String(l.name) }))} placeholder="Default location" /></Field>}
      </div>
      <LookPicker value={lk} onChange={setLk} fallback={{ color: "graphite", icon: "warehouse" }} inheritLabel="Default" />
      <div className="modal-actions">
        <Btn className="ghost" onClick={() => onOpenChange(false)}>Cancel</Btn>
        <Btn className="primary" busy={save.isPending} busyLabel={shelf ? "Saving" : "Creating"} disabled={!name.trim()} onClick={() => save.mutate()}>{shelf ? "Save shelf" : "Create shelf"}</Btn>
      </div>
    </Modal>
  );
}

/* ───────────────────────── category modal ───────────────────────── */

export function CategoryModal({ open, onOpenChange, category, shelfId, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; category?: Row; shelfId?: string; onSaved?: (c: Row) => void }) {
  const qc = useQueryClient(); const toast = useToast();
  const shelves = useShelves(); const shelfRows = rowsOf(shelves.data);
  const [name, setName] = useState(""); const [shelf, setShelf] = useState(""); const [minT, setMinT] = useState(""); const [ret, setRet] = useState("");
  const [lk, setLk] = useState<Look>({}); const [newShelf, setNewShelf] = useState(false);
  useEffect(() => {
    if (!open) return;
    setName(String(category?.name ?? "")); setShelf(String(category?.shelfId ?? shelfId ?? ""));
    setMinT(category?.defaultMinThreshold != null ? String(category.defaultMinThreshold) : ""); setRet(category?.defaultExpectedReturnHours != null ? String(category.defaultExpectedReturnHours) : "");
    setLk({ color: (category?.color as string) ?? null, icon: (category?.icon as string) ?? null });
  }, [open, category, shelfId]);
  const parent = shelfRows.find((s) => String(s.id) === shelf);
  const save = useMutation({
    mutationFn: () => {
      const b: Row = { name: name.trim(), color: lk.color ?? null, icon: lk.icon ?? null,
        defaultMinThreshold: minT === "" ? null : Number(minT), defaultExpectedReturnHours: ret === "" ? null : Number(ret) };
      if (category) return sk.categories.update(String(category.id), { ...b, ...(shelf && shelf !== category.shelfId ? { shelfId: shelf } : {}) });
      return sk.categories.create({ ...b, shelfId: shelf });
    },
    onSuccess: async (r) => { toast(category ? "Category updated" : "Category created"); await refreshCatalog(qc); onOpenChange(false); onSaved?.(r as Row); },
    onError: (e) => toast(errMsg(e), "bad"),
  });
  return (
    <>
      <Modal open={open} onOpenChange={onOpenChange} wide title={category ? "Edit category" : "New category"} description="A category groups similar items on a shelf, such as Gloves or Angle grinders.">
        <div className="form-grid">
          <div className="field-row">
            <Field label="Shelf" htmlFor="cat-shelf"><Select id="cat-shelf" value={shelf} onValueChange={setShelf} options={shelfRows.map((s) => ({ value: String(s.id), label: String(s.name) }))} placeholder="Choose a shelf" /></Field>
            <Btn className="ghost" onClick={() => setNewShelf(true)} aria-label="Create a new shelf"><Plus size={16} />New shelf</Btn>
          </div>
          <Field label="Name" htmlFor="cat-name"><input id="cat-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoFocus={!!shelf} placeholder="Gloves" /></Field>
          <Field label="Default minimum stock" htmlFor="cat-min" hint="Consumables here are flagged low at or below this."><input id="cat-min" className="input" inputMode="numeric" value={minT} onChange={(e) => setMinT(e.target.value.replace(/\D/g, ""))} placeholder="Optional" /></Field>
          <Field label="Default return window (hours)" htmlFor="cat-ret" hint="Assets here become overdue after this long."><input id="cat-ret" className="input" inputMode="numeric" value={ret} onChange={(e) => setRet(e.target.value.replace(/\D/g, ""))} placeholder="Optional" /></Field>
        </div>
        <LookPicker value={lk} onChange={setLk} fallback={resolveLook(parent as Look)} inheritLabel="Match the shelf" />
        <div className="modal-actions">
          <Btn className="ghost" onClick={() => onOpenChange(false)}>Cancel</Btn>
          <Btn className="primary" busy={save.isPending} busyLabel={category ? "Saving" : "Creating"} disabled={!name.trim() || !shelf} onClick={() => save.mutate()}>{category ? "Save category" : "Create category"}</Btn>
        </div>
      </Modal>
      <ShelfModal open={newShelf} onOpenChange={setNewShelf} onSaved={(s) => setShelf(String(s.id))} />
    </>
  );
}

/* ───────────────────────── item modal ───────────────────────── */

const blankItem = { type: "consumable", sku: "", name: "", assetTag: "", unit: "", openingQuantity: "", minThreshold: "", reorderQuantity: "", description: "" };

export function ItemModal({ open, onOpenChange, categoryId, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; categoryId?: string; onSaved?: (i: Row) => void }) {
  const qc = useQueryClient(); const toast = useToast();
  const shelves = useShelves(); const categories = useCategories();
  const shelfRows = rowsOf(shelves.data); const catRows = rowsOf(categories.data);
  const [f, setF] = useState(blankItem); const [shelf, setShelf] = useState(""); const [cat, setCat] = useState("");
  const [mode, setMode] = useState<"icon" | "photo">("icon"); const [lk, setLk] = useState<Look>({}); const [photo, setPhoto] = useState<string | null>(null);
  const [newShelf, setNewShelf] = useState(false); const [newCat, setNewCat] = useState(false);
  const set = (k: keyof typeof blankItem) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    if (!open) return;
    setF(blankItem); setMode("icon"); setLk({}); setPhoto(null);
    const c = catRows.find((x) => String(x.id) === categoryId);
    setCat(categoryId ?? ""); setShelf(c ? String(c.shelfId) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, categoryId]);
  // When the page that opened the form knew the category but the list arrived later, fill in its shelf.
  useEffect(() => { if (open && cat && !shelf) { const c = catRows.find((x) => String(x.id) === cat); if (c) setShelf(String(c.shelfId)); } }, [open, cat, shelf, catRows]);

  const shelfCats = useMemo(() => catRows.filter((c) => String(c.shelfId) === shelf), [catRows, shelf]);
  const parentCat = catRows.find((c) => String(c.id) === cat); const parentShelf = shelfRows.find((s) => String(s.id) === shelf);
  const inherited = resolveLook(parentCat as Look, parentShelf as Look);
  const isAsset = f.type === "asset";
  const save = useMutation({
    mutationFn: () => {
      const n = (v: string) => (v === "" ? undefined : Number(v));
      const b: Row = { type: f.type, categoryId: cat, sku: f.sku.trim(), name: f.name.trim(), description: f.description.trim() || undefined };
      if (isAsset) b.assetTag = f.assetTag.trim() || undefined;
      else Object.assign(b, { unit: f.unit.trim() || undefined, openingQuantity: n(f.openingQuantity), minThreshold: n(f.minThreshold), reorderQuantity: n(f.reorderQuantity) });
      if (mode === "photo" && photo) b.photoFileId = photo;
      if (mode === "icon") { if (lk.color) b.color = lk.color; if (lk.icon) b.icon = lk.icon; }
      return sk.items.create(b);
    },
    onSuccess: async (r) => { toast("Item created"); await refreshCatalog(qc); onOpenChange(false); onSaved?.(r as Row); },
    onError: (e) => toast(errMsg(e), "bad"),
  });
  const ready = f.sku.trim() && f.name.trim() && cat && (isAsset ? true : f.openingQuantity !== "");
  return (
    <>
      <Modal open={open} onOpenChange={onOpenChange} wide title="New item" description="Choose where it lives, name it, and pick how it should look on its card.">
        <div className="form-grid">
          <Field label="Kind"><Select value={f.type} onValueChange={(v) => setF((p) => ({ ...p, type: v }))} options={[{ value: "consumable", label: "Stock item (counted in quantity)" }, { value: "asset", label: "Tracked asset (one specific tool)" }]} /></Field>
          <div className="field-row">
            <Field label="Shelf" htmlFor="it-shelf"><Select id="it-shelf" value={shelf} onValueChange={(v) => { setShelf(v); if (!catRows.some((c) => String(c.id) === cat && String(c.shelfId) === v)) setCat(""); }} options={shelfRows.map((s) => ({ value: String(s.id), label: String(s.name) }))} placeholder="Choose a shelf" /></Field>
            <Btn className="ghost" onClick={() => setNewShelf(true)} aria-label="Create a new shelf"><Plus size={16} />Shelf</Btn>
          </div>
          <div className="field-row">
            <Field label="Category" htmlFor="it-cat" hint={shelf ? undefined : "Choose a shelf first, or create one."}><Select id="it-cat" value={cat} onValueChange={setCat} options={shelfCats.map((c) => ({ value: String(c.id), label: String(c.name) }))} placeholder={shelf ? (shelfCats.length ? "Choose a category" : "No categories on this shelf yet") : "Choose a shelf first"} /></Field>
            <Btn className="ghost" onClick={() => setNewCat(true)} aria-label="Create a new category"><Plus size={16} />Category</Btn>
          </div>
          <Field label="SKU" htmlFor="it-sku"><input id="it-sku" className="input" value={f.sku} onChange={set("sku")} maxLength={100} /></Field>
          <Field label="Name" htmlFor="it-name"><input id="it-name" className="input" value={f.name} onChange={set("name")} maxLength={200} /></Field>
          {isAsset ? (
            <Field label="Asset tag (optional)" htmlFor="it-tag"><input id="it-tag" className="input" value={f.assetTag} onChange={set("assetTag")} maxLength={100} /></Field>
          ) : (
            <>
              <Field label="Unit" htmlFor="it-unit" hint="pairs, boxes, pieces"><input id="it-unit" className="input" value={f.unit} onChange={set("unit")} maxLength={30} /></Field>
              <Field label="Opening quantity" htmlFor="it-qty"><input id="it-qty" className="input" inputMode="numeric" value={f.openingQuantity} onChange={(e) => setF((p) => ({ ...p, openingQuantity: e.target.value.replace(/\D/g, "") }))} /></Field>
              <Field label="Minimum level" htmlFor="it-min" hint="Flagged low at or below this."><input id="it-min" className="input" inputMode="numeric" value={f.minThreshold} onChange={(e) => setF((p) => ({ ...p, minThreshold: e.target.value.replace(/\D/g, "") }))} /></Field>
              <Field label="Reorder quantity" htmlFor="it-reo"><input id="it-reo" className="input" inputMode="numeric" value={f.reorderQuantity} onChange={(e) => setF((p) => ({ ...p, reorderQuantity: e.target.value.replace(/\D/g, "") }))} /></Field>
            </>
          )}
          <Field label="Description (optional)" htmlFor="it-desc"><input id="it-desc" className="input" value={f.description} onChange={set("description")} maxLength={500} /></Field>
        </div>

        <fieldset className="look-field">
          <legend>How it looks</legend>
          <div className="seg-pick" role="group" aria-label="Card appearance">
            <button type="button" aria-pressed={mode === "icon"} onClick={() => setMode("icon")}>Icon and color</button>
            <button type="button" aria-pressed={mode === "photo"} onClick={() => setMode("photo")}>Photo</button>
          </div>
          {mode === "icon"
            ? <LookPicker value={lk} onChange={setLk} fallback={inherited} inheritLabel="Match the category" />
            : <PhotoField kind="item_photo" label="Add a photo" hint="Shown on the item's card. You can change it later." onChange={setPhoto} />}
        </fieldset>

        <div className="modal-actions">
          <Btn className="ghost" onClick={() => onOpenChange(false)}>Cancel</Btn>
          <Btn className="primary" busy={save.isPending} busyLabel="Creating item" disabled={!ready} onClick={() => save.mutate()}>Create item</Btn>
        </div>
      </Modal>
      <ShelfModal open={newShelf} onOpenChange={setNewShelf} onSaved={(s) => { setShelf(String(s.id)); setCat(""); }} />
      <CategoryModal open={newCat} onOpenChange={setNewCat} shelfId={shelf || undefined} onSaved={(c) => { setShelf(String(c.shelfId)); setCat(String(c.id)); }} />
    </>
  );
}

/* ───────────────────────── archive confirmation ───────────────────────── */

export function ArchiveModal({ target, onClose }: { target: { kind: "shelf" | "category"; row: Row } | null; onClose: () => void }) {
  const qc = useQueryClient(); const toast = useToast();
  const go = useMutation({
    mutationFn: () => (target!.kind === "shelf" ? sk.shelves.remove(String(target!.row.id)) : sk.categories.remove(String(target!.row.id))),
    onSuccess: async () => { toast(`${target!.kind === "shelf" ? "Shelf" : "Category"} archived`); await refreshCatalog(qc); onClose(); },
    onError: (e) => toast(errMsg(e), "bad"),
  });
  return (
    <Modal open={!!target} onOpenChange={(o) => !o && onClose()} title={`Archive ${target?.kind ?? ""}?`}
      description={target ? `"${String(target.row.name)}" will be hidden from the catalog. ${target.kind === "shelf" ? "A shelf must have no categories to be archived." : "A category must have no items to be archived."} History is kept.` : undefined}>
      <div className="modal-actions">
        <Btn className="ghost" onClick={onClose}>Keep it</Btn>
        <Btn className="danger" busy={go.isPending} busyLabel="Archiving" onClick={() => go.mutate()}>Archive</Btn>
      </div>
    </Modal>
  );
}

export type { ReactNode };
