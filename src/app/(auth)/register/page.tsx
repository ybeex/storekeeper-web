"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sk } from "@/lib/endpoints";
import { useAuth } from "@/lib/auth";
import { errMsg, Field } from "@/components/ui";
import { AuthShell } from "@/components/auth-shell";

export default function RegisterPage() {
  const { refresh } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    if (v("password").length < 12) return setError("Use a password of at least 12 characters.");
    if (!f.get("terms")) return setError("Please accept the terms to continue.");
    setBusy(true);
    setError(null);
    try {
      await sk.auth.register({ organizationName: v("organizationName"), fullName: v("fullName") || undefined, email: v("email"), password: v("password"), firstLocationName: v("firstLocationName") || undefined });
      await refresh(); // the proxy has set the session cookie
      router.replace("/dashboard");
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  }
  return (
    <AuthShell title="Create your store" lede="Set up your organization and first location. You will be the administrator." foot={<>Already have an account? <Link href="/login" className="link">Sign in</Link></>}>
      <form onSubmit={onSubmit} className="form-grid" noValidate>
        <Field label="Organization name" htmlFor="organizationName"><input id="organizationName" name="organizationName" className="input" required placeholder="Acme Construction" /></Field>
        <Field label="Your name" htmlFor="fullName"><input id="fullName" name="fullName" className="input" autoComplete="name" /></Field>
        <Field label="Work email" htmlFor="email"><input id="email" name="email" type="email" className="input" autoComplete="username" required /></Field>
        <Field label="Password" htmlFor="password" hint="At least 12 characters"><input id="password" name="password" type="password" className="input" autoComplete="new-password" required /></Field>
        <Field label="First store or site" htmlFor="firstLocationName"><input id="firstLocationName" name="firstLocationName" className="input" placeholder="Main tool crib" /></Field>
        <label className="check"><input type="checkbox" name="terms" />I agree to the <Link href="/legal/terms" className="link">Terms</Link> and <Link href="/legal/privacy" className="link">Privacy Policy</Link></label>
        {error && <p role="alert" className="form-error">{error}</p>}
        <button className="btn primary lg shine" disabled={busy}>{busy ? "Creating" : "Create store"}</button>
      </form>
    </AuthShell>
  );
}
