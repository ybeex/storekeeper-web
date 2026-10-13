"use client";
import { createContext, useCallback, useContext, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Dialog, Select as RSelect, Toast } from "radix-ui";
import { Check, ChevronDown, Inbox, Loader2, X } from "lucide-react";
import { ApiError, rowsOf, type Row } from "@/lib/api";

/* ---------- toasts ---------- */
type T = { id: number; title: string; tone: "ok" | "bad" };
const ToastCtx = createContext<(title: string, tone?: "ok" | "bad") => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong. Try again.");

export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<T[]>([]);
  const push = useCallback((title: string, tone: "ok" | "bad" = "ok") => setList((l) => [...l, { id: Math.random(), title, tone }]), []);
  return (
    <ToastCtx.Provider value={push}>
      <Toast.Provider swipeDirection="right" duration={4500}>
        {children}
        {list.map((t) => (
          <Toast.Root key={t.id} className={`toast glass ${t.tone}`} onOpenChange={(o) => !o && setList((l) => l.filter((x) => x.id !== t.id))}>
            <Toast.Title>{t.title}</Toast.Title>
          </Toast.Root>
        ))}
        <Toast.Viewport className="toast-viewport" />
      </Toast.Provider>
    </ToastCtx.Provider>
  );
}

/* ---------- modal ---------- */
export function Modal({ open, onOpenChange, title, description, children, wide }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; children: ReactNode; wide?: boolean }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className={`modal glass${wide ? " wide" : ""}`}>
          <Dialog.Title className="modal-title">{title}</Dialog.Title>
          {description ? <Dialog.Description className="muted">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
          {children}
          <Dialog.Close className="btn icon modal-x" aria-label="Close"><X size={18} /></Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ---------- select ---------- */
export type Option = { value: string; label: string };
export function Select({ value, onValueChange, options, placeholder, id }: { value?: string; onValueChange: (v: string) => void; options: Option[]; placeholder?: string; id?: string }) {
  return (
    <RSelect.Root value={value || undefined} onValueChange={onValueChange}>
      <RSelect.Trigger id={id} className="input select-trigger">
        <RSelect.Value placeholder={placeholder ?? "Select"} />
        <RSelect.Icon><ChevronDown size={16} /></RSelect.Icon>
      </RSelect.Trigger>
      <RSelect.Portal>
        <RSelect.Content className="menu glass select-content" position="popper" sideOffset={6}>
          <RSelect.Viewport>
            {options.map((o) => (
              <RSelect.Item key={o.value} value={o.value} className="menu-item">
                <RSelect.ItemText>{o.label}</RSelect.ItemText>
                <RSelect.ItemIndicator className="item-check"><Check size={14} /></RSelect.ItemIndicator>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}

/* ---------- buttons that say what they are doing ---------- */
/**
 * A button for anything that takes time. While `busy` it shows a spinner, switches to `busyLabel` ("Validating"), is
 * disabled so it cannot be pressed twice, and announces itself as busy to screen readers. Its width is held steady so
 * the layout does not jump when the label changes.
 */
export function Btn({ busy, busyLabel, children, className = "", disabled, type = "button", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean; busyLabel?: string }) {
  return (
    <button {...rest} type={type} className={`btn ${className}${busy ? " busy" : ""}`} disabled={busy || disabled} aria-busy={busy || undefined}>
      {busy && <Loader2 size={16} className="spin" aria-hidden />}
      <span className="btn-label">{busy ? busyLabel ?? children : children}</span>
    </button>
  );
}

/** Determinate when given `value` (0..100), otherwise an indeterminate sweep. Always paired with words saying what is happening. */
export function ProgressBar({ value, label }: { value?: number; label: string }) {
  const known = typeof value === "number";
  return (
    <div className="progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={known ? Math.round(value) : undefined}>
      <span className={known ? "progress-fill" : "progress-fill sweep"} style={known ? { width: `${Math.max(2, Math.min(100, value))}%` } : undefined} />
    </div>
  );
}

/* ---------- small pieces ---------- */
export function PageHeader({ title, lede, actions }: { title: string; lede?: string; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {lede && <p className="muted lede">{lede}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}
export const Skeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="skeleton-list" aria-busy="true">{Array.from({ length: rows }, (_, i) => <div key={i} className="skeleton" style={{ animationDelay: `${i * 80}ms` }} />)}</div>
);
export const Empty = ({ children }: { children: ReactNode }) => (
  <div className="empty"><Inbox size={28} />{children}</div>
);
export function Field({ label, htmlFor, children, hint }: { label: string; htmlFor?: string; children: ReactNode; hint?: string }) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <small className="hint">{hint}</small>}
    </div>
  );
}

/* ---------- auto table: infers columns from the first row ---------- */
const HIDE = /(^id$|Id$|orgId|hash|payload|metadata|^data$|storageKey|qrCode|photoUrl)/;
const label = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
const ISO = /^\d{4}-\d{2}-\d{2}T/;

const scalar = (v: unknown): string => {
  if (v === null || v === undefined || v === "") return "None";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "string" && ISO.test(v)) return new Date(v).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  if (typeof v === "string" && /^[a-z]+(_[a-z]+)+$/.test(v)) return label(v);
  return String(v);
};

/** Formats one table cell. Objects and arrays are summarised, never dumped as raw JSON. */
export function fmtCell(v: unknown): ReactNode {
  if (v === null || v === undefined || v === "") return <span className="muted">None</span>;
  if (typeof v === "boolean") return <span className={`badge ${v ? "ok" : "neu"}`}>{v ? "Yes" : "No"}</span>;
  if (typeof v === "string" && ISO.test(v)) return <span className="mono">{scalar(v)}</span>;
  if (typeof v === "string" && /^[a-z]+(_[a-z]+)+$|^(open|closed|pending|approved|rejected|cancelled|admin|supervisor|viewer|asset|consumable|person|team|job|new|handled)$/.test(v)) return <span className="badge neu">{label(v)}</span>;
  if (Array.isArray(v)) {
    if (v.length === 0) return <span className="muted">None</span>;
    const names = v.map((x) => (x && typeof x === "object" ? ((x as Row).name ?? (x as Row).fullName ?? (x as Row).email) : x)).filter((x) => x !== undefined && x !== null);
    if (names.length === v.length) return <span className="clip" title={names.join(", ")}>{names.slice(0, 2).map(scalar).join(", ")}{names.length > 2 ? ` +${names.length - 2}` : ""}</span>;
    return `${v.length} item${v.length === 1 ? "" : "s"}`;
  }
  if (typeof v === "object") {
    const o = v as Row;
    const named = o.name ?? o.fullName ?? o.email;
    if (named) return String(named);
    const pairs = Object.entries(o).filter(([, x]) => x === null || ["number", "string", "boolean"].includes(typeof x)).slice(0, 4);
    if (pairs.length === 0) return <span className="muted">Details</span>;
    return <span className="kvchips">{pairs.map(([k, x]) => <span key={k} className="kvchip"><i>{label(k)}</i><b>{scalar(x)}</b></span>)}</span>;
  }
  const str = String(v);
  return str.length > 64 ? <span className="clip" title={str}>{str}</span> : str;
}

export function AutoTable({ rows, actions, hide = [], max = 8, onRow }: { rows: Row[]; actions?: (r: Row) => ReactNode; hide?: string[]; max?: number; onRow?: (r: Row) => void }) {
  const first = rows[0];
  if (!first) return <Empty>Nothing here yet.</Empty>;
  const cols = Object.keys(first).filter((k) => !HIDE.test(k) && !hide.includes(k)).slice(0, max);
  return (
    <div className="table-scroll">
      <table>
        <thead><tr>{cols.map((c) => <th key={c}>{label(c)}</th>)}{actions && <th aria-label="Actions" />}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={String(r.id ?? i)} className={onRow ? "clickable" : undefined} onClick={onRow ? () => onRow(r) : undefined}>
              {cols.map((c) => <td key={c}>{fmtCell(r[c])}</td>)}
              {actions && <td className="row-actions" onClick={(e) => e.stopPropagation()}>{actions(r)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function toCsv(rows: Row[]) {
  const cols = Object.keys(rows[0] ?? {});
  const esc = (v: unknown) => `"${String(typeof v === "object" && v ? JSON.stringify(v) : (v ?? "")).replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}
export function saveText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  Object.assign(document.createElement("a"), { href: url, download: name }).click();
  URL.revokeObjectURL(url);
}
export { rowsOf };
