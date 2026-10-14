"use client";
import { useState } from "react";
import { Tabs } from "radix-ui";
import { Plus } from "lucide-react";
import { rowsOf, type Row } from "@/lib/api";
import { Btn, Empty, PageHeader } from "@/components/ui";
import { useCan } from "@/components/restricted";
import { ItemsTable } from "@/components/items-table";
import { ArchiveModal, CardGridSkeleton, ItemModal, NewCard, ShelfCard, ShelfModal, useShelves } from "@/components/catalog";

export default function Catalog() {
  const canWrite = useCan("catalogWrite");
  const shelves = useShelves();
  const rows = rowsOf(shelves.data);
  const [shelfDlg, setShelfDlg] = useState<{ shelf?: Row } | null>(null);
  const [itemDlg, setItemDlg] = useState(false);
  const [archive, setArchive] = useState<Row | null>(null);

  return (
    <>
      <PageHeader title="Catalog" lede="Shelves hold categories, and categories hold your items."
        actions={canWrite && <><Btn onClick={() => setShelfDlg({})}><Plus size={16} />New shelf</Btn><Btn className="primary" onClick={() => setItemDlg(true)}><Plus size={16} />New item</Btn></>} />
      <Tabs.Root defaultValue="shelves">
        <Tabs.List className="tab-bar glass" aria-label="Catalog sections">
          <Tabs.Trigger value="shelves" className="tab">Shelves</Tabs.Trigger>
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
        <Tabs.Content value="items"><ItemsTable /></Tabs.Content>
      </Tabs.Root>
      <ShelfModal open={!!shelfDlg} onOpenChange={(o) => !o && setShelfDlg(null)} shelf={shelfDlg?.shelf} />
      <ItemModal open={itemDlg} onOpenChange={setItemDlg} />
      <ArchiveModal target={archive ? { kind: "shelf", row: archive } : null} onClose={() => setArchive(null)} />
    </>
  );
}
