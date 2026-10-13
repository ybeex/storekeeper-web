"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { sk } from "@/lib/endpoints";
import { errMsg, Field } from "@/components/ui";
import { AuthShell } from "@/components/auth-shell";

export default function ForgotPage() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await sk.auth.forgotPassword({ organization: String(f.get("organization")).trim().toLowerCase(), email: String(f.get("email")).trim() });
      setDone(true);
    } catch (err) { setError(errMsg(err)); }
    setBusy(false);
  }
  return (
    <AuthShell title="Reset your password" lede="Enter your organization and email. If there is a matching account, we will send a reset link." foot={<Link href="/login" className="link">Back to sign in</Link>}>
      {done ? <p className="notice glass">If that account exists, a reset link is on its way. Check your inbox.</p> : (
        <form onSubmit={onSubmit} className="form-grid" noValidate>
          <Field label="Organization" htmlFor="organization"><input id="organization" name="organization" className="input" required /></Field>
          <Field label="Email" htmlFor="email"><input id="email" name="email" type="email" className="input" required /></Field>
          {error && <p role="alert" className="form-error">{error}</p>}
          <button className="btn primary lg shine" disabled={busy}>{busy ? "Sending" : "Send reset link"}</button>
        </form>
      )}
    </AuthShell>
  );
}
