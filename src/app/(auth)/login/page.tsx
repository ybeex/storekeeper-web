"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { Field } from "@/components/ui";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (sessionStorage.getItem("sk-expired")) { sessionStorage.removeItem("sk-expired"); setNotice("Your session expired. Sign in again to continue. Anything saved offline will sync."); }
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await signIn({ organization: String(f.get("organization")).trim().toLowerCase(), email: String(f.get("email")).trim(), password: String(f.get("password")) });
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? "Those details do not match an account." : err instanceof ApiError && err.status === 429 ? "Too many attempts. Wait a moment and try again." : "Could not sign in. Try again.");
      setBusy(false);
    }
  }
  return (
    <AuthShell title="Open the store" lede="Sign in to see what is out, who has it, and what needs attention." foot={<>New here? <Link href="/register" className="link">Create your store</Link></>}>
      {notice && <p className="notice glass small" role="status">{notice}</p>}
      <form onSubmit={onSubmit} className="form-grid" noValidate>
        <Field label="Organization" htmlFor="organization" hint="The short name you chose at sign-up"><input id="organization" name="organization" className="input" autoComplete="organization" required placeholder="acme-construction" /></Field>
        <Field label="Email" htmlFor="email"><input id="email" name="email" type="email" className="input" autoComplete="username" required /></Field>
        <Field label="Password" htmlFor="password"><input id="password" name="password" type="password" className="input" autoComplete="current-password" required /></Field>
        <Link href="/forgot-password" className="link small">Forgot your password?</Link>
        {error && <p role="alert" className="form-error">{error}</p>}
        <button className="btn primary lg shine" disabled={busy}>{busy ? "Signing in" : "Sign in"}</button>
      </form>
    </AuthShell>
  );
}
