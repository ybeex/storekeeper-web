"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Search } from "lucide-react";
import type { Row } from "@/lib/api";
import { sk } from "@/lib/endpoints";
import { Btn, Empty, Select } from "@/components/ui";
import { useCan } from "@/components/restricted";
import { Glyph, resolveLook, type Look } from "@/components/appearance";
import { CardGridSkeleton, CategoryModal, Crumbs, ItemCard, ItemModal, NewCard } from "@/components/catalog";

function useDebounced<T>(v: T, ms = 300) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const router = useRouter();
  const canWrite = useCan("catalogWrite");
  const cat = useQuery({ queryKey: ["category", categoryId], queryFn: () => sk.categories.get(categoryId) as Promise<Row> });
  const [q, setQ] = useState(""); const [type, setType] = useState("all");
  const search = useDebounced(q.trim());
  const list = useInfiniteQuery({
    queryKey: ["cat-items", categoryId, search, type],
    queryFn: ({ pageParam }) => sk.items.list({ categoryId, q: search || undefined, type: type === "all" ? undefined : type, limit: 24, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
  const [itemDlg, setItemDlg] = useState(false); const [edit, setEdit] = useState(false);

  if (cat.isError) return <div className="glass card empty">This category could not be found. <Btn onClick={() => router.push("/catalog")}>Back to the catalog</Btn></div>;
  const c = cat.data;
  const l = resolveLook(c as Look, { color: c?.shelfColor as string, icon: c?.shelfIcon as string });
  const items = list.data?.pages.flatMap((p) => p.items) ?? [];
  const filtered = !!search || type !== "all";

  return (
    <>
      <Crumbs trail={[{ label: "Catalog", href: "/catalog" }, { label: c ? String(c.shelfName) : "Shelf", href: c ? `/catalog/shelves/${c.shelfId}` : undefined }, { label: c ? String(c.name) : "Category" }]} />
      <div className="page-head">
        <div className="head-look">
          {c && <Glyph look={l} size={64} solid />}
          <div>
            <h1 className="page-title">{c ? String(c.name) : "Category"}</h1>
            {c && <p className="muted lede">On {String(c.shelfName)}</p>}
          </div>
        </div>
        {canWrite && c && <div className="page-actions"><Btn onClick={() => setEdit(true)}><Pencil size={16} />Edit category</Btn><Btn className="primary" onClick={() => setItemDlg(true)}><Plus size={16} />New item</Btn></div>}
      </div>
      <div className="sub-tools">
        <span className="input icon-input grow-input"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search this category" aria-label="Search items in this category" /></span>
        <div className="narrow"><Select value={type} onValueChange={setType} options={[{ value: "all", label: "All kinds" }, { value: "asset", label: "Tracked assets" }, { value: "consumable", label: "Stock items" }]} /></div>
      </div>
      {list.isPending && <CardGridSkeleton items />}
      {list.isError && <div className="glass card empty">Could not load items. <Btn onClick={() => void list.refetch()}>Try again</Btn></div>}
      {list.isSuccess && items.length === 0 && !canWrite && <div className="glass card"><Empty>{filtered ? "No items match." : "No items in this category yet."}</Empty></div>}
      {list.isSuccess && (items.length > 0 || (canWrite && !filtered)) && (
        <div className="cards items">
          {items.map((i: Row) => <ItemCard key={String(i.id)} item={i} />)}
          {canWrite && !filtered && <NewCard label={items.length ? "New item" : "Add the first item"} onClick={() => setItemDlg(true)} />}
        </div>
      )}
      {list.isSuccess && items.length === 0 && filtered && canWrite && <div className="glass card"><Empty>No items match your search.</Empty></div>}
      {list.hasNextPage && <div className="more"><Btn busy={list.isFetchingNextPage} busyLabel="Loading" onClick={() => void list.fetchNextPage()}>Load more</Btn></div>}
      <ItemModal open={itemDlg} onOpenChange={setItemDlg} categoryId={categoryId} />
      <CategoryModal open={edit} onOpenChange={setEdit} category={c} />
    </>
  );
}
