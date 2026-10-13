"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import type { Row } from "@/lib/api";
import { sk } from "@/lib/endpoints";
import { compressImage } from "@/lib/image";
import { useOnline } from "@/lib/offline";
import { errMsg, useToast } from "./ui";

/** Take or choose a photo, shrink it, upload it, and hand back the file id. Needs a connection: uploads are not queued offline. */
export function PhotoField({ kind, onChange, label = "Add a photo", hint }: { kind: "item_photo" | "transaction_snapshot"; onChange: (fileId: string | null) => void; label?: string; hint?: string }) {
  const toast = useToast();
  const online = useOnline();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const small = await compressImage(file);
      const up = (await sk.files.upload(kind, small)) as Row;
      setPreview(URL.createObjectURL(small));
      onChange(String(up.id));
    } catch (e) {
      toast(e instanceof Error && !("status" in e) ? "Could not read that image. Use a JPEG, PNG or WebP photo." : errMsg(e), "bad");
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  }
  const clear = () => { setPreview(null); onChange(null); };

  return (
    <div className="photo-field">
      {preview ? (
        <div className="photo-thumb"><img src={preview} alt="Attached photo" /><button type="button" className="btn icon sm" aria-label="Remove photo" onClick={clear}><X size={15} /></button></div>
      ) : (
        <button type="button" className="photo-add" disabled={busy || !online} onClick={() => input.current?.click()}>
          {busy ? <Loader2 size={20} className="spin" /> : <Camera size={20} />}
          <span>{busy ? "Uploading" : label}</span>
          <small>{!online ? "Photos need a connection" : hint ?? "Optional"}</small>
        </button>
      )}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/*" capture={kind === "transaction_snapshot" ? "environment" : undefined} hidden onChange={(e) => void pick(e.target.files?.[0])} />
    </div>
  );
}
