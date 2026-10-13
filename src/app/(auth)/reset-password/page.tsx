"use client";
import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { sk } from "@/lib/endpoints";
import { errMsg, Field } from "@/components/ui";
import { AuthShell } from "@/components/auth-shell";

function Form() {
  const token = useSearchParams().get("token") ?? "";
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password"));
    if (password.length < 12) return setError("Use at least 12 characters.");
    setBusy(true);
    setError(null);
    try { await sk.auth.resetPassword({ token, password }); setDone(true); } catch (err) { setError(errMsg(err)); }
    setBusy(false);
  }
  if (!token) return <p className="form-error">This link is missing its token. Open the link from your email again.</p>;
  if (done) return <p className="notice glass">Done. <Link href="/login" className="link">Sign in</Link></p>;
  return (
    <form onSubmit={onSubmit} className="form-grid" noValidate>
      <Field label="New password" htmlFor="password" hint="At least 12 characters"><input id="password" name="password" type="password" className="input" autoComplete="new-password" required /></Field>
      {error && <p role="alert" className="form-error">{error}</p>}
      <button className="btn primary lg shine" disabled={busy}>{busy ? "Saving" : "Update password"}</button>
    </form>
  );
}

export default function Page() {
  return (
    <AuthShell title="Choose a new password" lede="Pick a password of at least 12 characters.">
      <Suspense fallback={null}><Form /></Suspense>
    </AuthShell>
  );
}
