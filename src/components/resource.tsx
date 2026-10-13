"use client";
import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { rowsOf, type Row } from "@/lib/api";
import { AutoTable, Btn, Empty, errMsg, Field, Modal, Select, Skeleton, useToast, type Option } from "./ui";
import { useOptions } from "./pickers";

export type FieldDef = {
  name: string; label: string; kind?: "text" | "email" | "number" | "textarea" | "select"; required?: boolean; placeholder?: string;
  options?: Option[]; optionsFrom?: { qk: string; load: () => Promise<unknown>; label: (r: Row) => string }; createOnly?: boolean; hint?: string;
};

function FieldInput({ f, value, onChange }: { f: FieldDef; value: string; onChange: (v: string) => void }) {
  const remote = useOptions(f.optionsFrom?.qk ?? "none", f.optionsFrom?.load ?? (async () => []), f.optionsFrom?.label ?? (() => ""));
  const id = `f-${f.name}`;
  if (f.kind === "select") return <Select id={id} value={value} onValueChange={onChange} options={f.options ?? remote} placeholder={f.placeholder} />;
  if (f.kind === "textarea") return <textarea id={id} className="input area" value={value} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} />;
  return <input id={id} className="input" type={f.kind === "number" ? "number" : f.kind ?? "text"} value={value} required={f.required} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export function ResourceManager({ title, noun, qk, load, fields, create, update, remove, columns, rowExtra, headerExtra }: {
  title?: string; noun: string; qk: string; load: () => Promise<unknown>; fields: FieldDef[];
  create?: (b: Row) => Promise<unknown>; update?: (id: string, b: Row) => Promise<unknown>; remove?: (id: string) => Promise<unknown>;
  columns?: string[]; rowExtra?: (r: Row) => ReactNode; headerExtra?: ReactNode;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isPending, isError, refetch } = useQuery({ queryKey: [qk], queryFn: load });
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<Row | null>(null);
  const rows = rowsOf(data).filter((r) => !r.archivedAt);

  const open = (r: Row | "new") => {
    setEditing(r);
    setForm(r === "new" ? {} : Object.fromEntries(fields.map((f) => [f.name, r[f.name] == null ? "" : String(r[f.name])])));
  };
  const body = () => {
    const out: Row = {};
    for (const f of fields) {
      if (editing !== "new" && f.createOnly) continue;
      const v = form[f.name]?.trim();
      if (v) out[f.name] = f.kind === "number" ? Number(v) : v;
    }
    return out;
  };
  const save = useMutation({
    mutationFn: () => (editing === "new" ? create!(body()) : update!(String((editing as Row).id), body())),
    onSuccess: () => { toast(editing === "new" ? `${noun} created` : `${noun} updated`); setEditing(null); void qc.invalidateQueries({ queryKey: [qk] }); },
    onError: (e) => toast(errMsg(e), "bad"),
  });
  const del = useMutation({
    mutationFn: (id: string) => remove!(id),
    onSuccess: () => { toast(`${noun} archived`); setConfirm(null); void qc.invalidateQueries({ queryKey: [qk] }); },
    onError: (e) => toast(errMsg(e), "bad"),
  });

  return (
    <div>
      <div className="toolbar">
        {title && <h2 className="section-title">{title}</h2>}
        <div className="toolbar-end">{headerExtra}{create && <button className="btn primary" onClick={() => open("new")}><Plus size={16} />New {noun}</button>}</div>
      </div>
      <div className="glass table-card">
        {isPending && <Skeleton />}
        {isError && <div className="empty">Could not load. <button className="link" onClick={() => void refetch()}>Try again</button></div>}
        {!isPending && !isError && rows.length === 0 && <Empty>No {noun}s yet.</Empty>}
        {rows.length > 0 && (
          <AutoTable
            rows={columns ? rows.map((r) => ({ id: r.id, ...Object.fromEntries(columns.map((c) => [c, r[c]])) })) : rows}
            actions={(r) => {
              const full = rows.find((x) => x.id === r.id) ?? r;
              return (<>{rowExtra?.(full)}{update && <button className="btn icon sm" aria-label={`Edit ${noun}`} onClick={() => open(full)}><Pencil size={15} /></button>}{remove && <button className="btn icon sm danger" aria-label={`Archive ${noun}`} onClick={() => setConfirm(full)}><Trash2 size={15} /></button>}</>);
            }}
          />
        )}
      </div>

      <Modal open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} title={editing === "new" ? `New ${noun}` : `Edit ${noun}`}>
        <form className="form-grid" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          {fields.filter((f) => editing === "new" || !f.createOnly).map((f) => (
            <Field key={f.name} label={f.label} htmlFor={`f-${f.name}`} hint={f.hint}>
              <FieldInput f={f} value={form[f.name] ?? ""} onChange={(v) => setForm((s) => ({ ...s, [f.name]: v }))} />
            </Field>
          ))}
          <div className="modal-actions"><Btn onClick={() => setEditing(null)} disabled={save.isPending}>Cancel</Btn><Btn type="submit" className="primary" busy={save.isPending} busyLabel="Saving">Save</Btn></div>
        </form>
      </Modal>

      <Modal open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)} title={`Archive this ${noun}?`} description="It stays in the history but can no longer be used in new transactions.">
        <div className="modal-actions"><Btn onClick={() => setConfirm(null)} disabled={del.isPending}>Cancel</Btn><Btn className="danger-fill" busy={del.isPending} busyLabel="Archiving" onClick={() => confirm && del.mutate(String(confirm.id))}>Archive</Btn></div>
      </Modal>
    </div>
  );
}
