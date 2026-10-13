"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import type { Row } from "@/lib/api";
import { sk } from "@/lib/endpoints";
import { Btn, Empty, PageHeader } from "@/components/ui";
import { useCan } from "@/components/restricted";
import { Glyph, resolveLook, type Look } from "@/components/appearance";
import { ArchiveModal, CardGridSkeleton, CategoryCard, CategoryModal, Crumbs, NewCard, ShelfModal } from "@/components/catalog";

export default function ShelfPage() {
  const { shelfId } = useParams<{ shelfId: string }>();
  const router = useRouter();
  const canWrite = useCan("catalogWrite");
  const shelf = useQuery({ queryKey: ["shelf", shelfId], queryFn: () => sk.shelves.get(shelfId) as Promise<Row> });
  const [catDlg, setCatDlg] = useState<{ category?: Row } | null>(null);
  const [editShelf, setEditShelf] = useState(false);
  const [archive, setArchive] = useState<Row | null>(null);

  if (shelf.isError) return <div className="glass card empty">This shelf could not be found. <Btn onClick={() => router.push("/catalog")}>Back to the catalog</Btn></div>;
  const s = shelf.data;
  const cats = (s?.categories as Row[] | undefined) ?? [];
  const l = resolveLook(s as Look);
  const stats = s?.stats as Row | undefined;
  const items = Number(stats?.assets ?? 0) + Number(stats?.products ?? 0);

  return (
    <>
      <Crumbs trail={[{ label: "Catalog", href: "/catalog" }, { label: s ? String(s.name) : "Shelf" }]} />
      <div className="page-head">
        <div className="head-look">
          {s && <Glyph look={l} size={64} solid />}
          <div>
            <h1 className="page-title">{s ? String(s.name) : "Shelf"}</h1>
            {s && <p className="muted lede">{cats.length} {cats.length === 1 ? "category" : "categories"}, {items.toLocaleString()} {items === 1 ? "item" : "items"}</p>}
          </div>
        </div>
        {canWrite && s && <div className="page-actions"><Btn onClick={() => setEditShelf(true)}><Pencil size={16} />Edit shelf</Btn><Btn className="primary" onClick={() => setCatDlg({})}><Plus size={16} />New category</Btn></div>}
      </div>
      {shelf.isPending && <CardGridSkeleton />}
      {s && cats.length === 0 && !canWrite && <div className="glass card"><Empty>No categories on this shelf yet.</Empty></div>}
      {s && (cats.length > 0 || canWrite) && (
        <div className="cards">
          {cats.map((c) => <CategoryCard key={String(c.id)} category={c} shelf={s} canWrite={canWrite} onEdit={() => setCatDlg({ category: { ...c, shelfId: s.id } })} onArchive={() => setArchive(c)} />)}
          {canWrite && <NewCard label={cats.length ? "New category" : "Add the first category"} onClick={() => setCatDlg({})} />}
        </div>
      )}
      <CategoryModal open={!!catDlg} onOpenChange={(o) => !o && setCatDlg(null)} category={catDlg?.category} shelfId={shelfId} />
      <ShelfModal open={editShelf} onOpenChange={setEditShelf} shelf={s} />
      <ArchiveModal target={archive ? { kind: "category", row: archive } : null} onClose={() => setArchive(null)} />
    </>
  );
}
