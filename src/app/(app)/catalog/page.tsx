"use client";
import { useState } from "react";
import { Tabs } from "radix-ui";
import { Plus } from "lucide-react";
import { rowsOf, type Row } from "@/lib/api";
import { Btn, Empty, PageHeader } from "@/components/ui";
import { useCan } from "@/components/restricted";
import { ItemsTable } from "@/components/items-table";
import { ArchiveModal, CardGridSkeleton, CategoryCard, CategoryModal, ItemModal, NewCard, ShelfCard, ShelfModal, useCategories, useShelves } from "@/components/catalog";

export default function Catalog() {
  const canWrite = useCan("catalogWrite");
  const shelves = useShelves();
  const categories = useCategories();
  const rows = rowsOf(shelves.data);
  const categoryRows = rowsOf(categories.data);
  const [shelfDlg, setShelfDlg] = useState<{ shelf?: Row } | null>(null);
  const [itemDlg, setItemDlg] = useState(false);
  const [categoryDlg, setCategoryDlg] = useState<{ category?: Row } | null>(null);
  const [archive, setArchive] = useState<Row | null>(null);

  return (
    <>
      <PageHeader title="Catalog" lede="Shelves hold categories, and categories hold your items."
        actions={canWrite && <><Btn onClick={() => setShelfDlg({})}><Plus size={16} />New shelf</Btn><Btn className="primary" onClick={() => setItemDlg(true)}><Plus size={16} />New item</Btn></>} />
      <Tabs.Root defaultValue="shelves">
        <Tabs.List className="tab-bar glass" aria-label="Catalog sections">
          <Tabs.Trigger value="shelves" className="tab">Shelves</Tabs.Trigger>
          <Tabs.Trigger value="categories" className="tab">Categories</Tabs.Trigger>
          <Tabs.Trigger value="items" className="tab">All items</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="shelves">
          {shelves.isPending && <CardGridSkeleton />}
          {shelves.isError && <div className="glass card empty">Could not load shelves.<Btn onClick={() => void shelves.refetch()}>Try again</Btn></div>}
          {shelves.isSuccess && rows.length === 0 && !canWrite && <div className="glass card"><Empty>No shelves yet. An administrator sets up the store&apos;s shelves.</Empty></div>}
          {shelves.isSuccess && (rows.length > 0 || canWrite) && (
            <div className="cards">
              {rows.map((s) => <ShelfCard key={String(s.id)} shelf={s} canWrite={canWrite} onEdit={() => setShelfDlg({ shelf: s })} onArchive={() => setArchive(s)} />)}
              {canWrite && <NewCard label={rows.length ? "New shelf" : "Create your first shelf"} onClick={() => setShelfDlg({})} />}
            </div>
          )}
        </Tabs.Content>
        <Tabs.Content value="categories">
          {categories.isPending && <CardGridSkeleton />}
          {categories.isError && <div className="glass card empty">Could not load categories.<Btn onClick={() => void categories.refetch()}>Try again</Btn></div>}
          {categories.isSuccess && categoryRows.length === 0 && !canWrite && <div className="glass card"><Empty>No categories yet. An administrator sets up the store&apos;s categories.</Empty></div>}
          {categories.isSuccess && (categoryRows.length > 0 || canWrite) && (
            <div className="cards">
              {categoryRows.map((c) => <CategoryCard key={String(c.id)} category={c} shelf={rows.find((s) => s.id === c.shelfId)} canWrite={canWrite} onEdit={() => setCategoryDlg({ category: c })} onArchive={() => setArchive(c)} />)}
              {canWrite && <NewCard label={categoryRows.length ? "New category" : "Create your first category"} onClick={() => setCategoryDlg({})} />}
            </div>
          )}
        </Tabs.Content>
        <Tabs.Content value="items"><ItemsTable /></Tabs.Content>
      </Tabs.Root>
      <ShelfModal open={!!shelfDlg} onOpenChange={(o) => !o && setShelfDlg(null)} shelf={shelfDlg?.shelf} />
      <CategoryModal open={!!categoryDlg} onOpenChange={(o) => !o && setCategoryDlg(null)} category={categoryDlg?.category} />
      <ItemModal open={itemDlg} onOpenChange={setItemDlg} />
      <ArchiveModal target={archive ? { kind: categoryRows.some((c) => c.id === archive.id) ? "category" : "shelf", row: archive } : null} onClose={() => setArchive(null)} />
    </>
  );
}
