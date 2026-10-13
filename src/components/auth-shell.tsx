"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { Package } from "lucide-react";
import { Media } from "./media";
import { ThemeToggle } from "./theme-toggle";

export function AuthShell({ title, lede, children, foot }: { title: string; lede: string; children: ReactNode; foot?: ReactNode }) {
  return (
    <div className="auth-split">
      <div className="auth-side">
        <Media slot="auth-side" alt="A well-run tool crib" brief="Tall, moody photo of organised tool shelving with soft rim light; keep the lower third calm for overlay text" ratio="3 / 4" className="auth-media" />
        <p className="auth-quote">Stop losing tools because nobody knows who took them.</p>
      </div>
      <main className="auth-pane">
        <div className="auth-top"><Link href="/" className="brand"><span className="brand-mark"><Package size={18} /></span>StoreKeeper</Link><ThemeToggle /></div>
        <div className="auth-card-lite">
          <h1 className="auth-title">{title}</h1>
          <p className="muted">{lede}</p>
          {children}
          {foot && <p className="auth-foot muted">{foot}</p>}
        </div>
      </main>
    </div>
  );
}
