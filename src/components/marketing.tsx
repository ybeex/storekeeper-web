"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Accordion } from "radix-ui";
import { ArrowRight, Menu, Package, Plus, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "./theme-toggle";

const LINKS = [["Product", "/#product"], ["How it works", "/#how"], ["Pricing", "/#pricing"], ["Blog", "/blog"], ["About", "/about"]] as const;

export function MarketingNav() {
  const { me, ready } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(scrollY > 12);
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`glass mk-nav${scrolled ? " scrolled" : ""}`}>
      <Link href="/" className="brand"><span className="brand-mark"><Package size={18} /></span>StoreKeeper</Link>
      <nav aria-label="Main" className={`mk-links${open ? " open" : ""}`}>
        {LINKS.map(([l, h]) => <a key={h} href={h} onClick={() => setOpen(false)}>{l}</a>)}
      </nav>
      <div className="mk-end">
        <ThemeToggle />
        {ready && me ? (
          <Link href="/dashboard" className="btn primary shine">Open app<ArrowRight size={16} /></Link>
        ) : (
          <>
            <Link href="/contact" className="btn ghost hide-sm">Contact</Link>
            <Link href="/login" className="btn ghost hide-sm">Sign in</Link>
            <Link href="/register" className="btn primary shine">Start free</Link>
          </>
        )}
        <button className="btn icon menu-btn" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? <X size={18} /> : <Menu size={18} />}</button>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="mk-footer">
      <div className="mk-wrap footer-grid five">
        <div>
          <Link href="/" className="brand"><span className="brand-mark"><Package size={18} /></span>StoreKeeper</Link>
          <p className="muted">The digital tool crib for your site. Know what your store has, who has it, and what went missing.</p>
        </div>
        <div><h4>Product</h4><a href="/#product">Features</a><a href="/#how">How it works</a><a href="/#pricing">Pricing</a><a href="/#faq">FAQ</a></div>
        <div><h4>Company</h4><Link href="/about">About</Link><Link href="/blog">Blog</Link><Link href="/contact">Contact</Link></div>
        <div><h4>Account</h4><Link href="/login">Sign in</Link><Link href="/register">Create an account</Link><Link href="/forgot-password">Reset password</Link></div>
        <div><h4>Legal</h4><Link href="/legal/terms">Terms of service</Link><Link href="/legal/privacy">Privacy policy</Link><Link href="/legal/cookies">Cookie policy</Link><Link href="/legal/acceptable-use">Acceptable use</Link><Link href="/legal/data-processing">Data processing</Link><Link href="/legal/security">Security</Link></div>
      </div>
      <div className="mk-wrap footer-base"><span>&copy; {new Date().getFullYear()} StoreKeeper. All rights reserved.</span><Link href="/legal">All legal documents</Link></div>
    </footer>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <Accordion.Root type="single" collapsible className="faq">
      {items.map((it) => (
        <Accordion.Item key={it.q} value={it.q} className="faq-item glass">
          <Accordion.Header>
            <Accordion.Trigger className="faq-trigger">{it.q}<Plus size={18} className="faq-plus" /></Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="faq-content"><p className="muted">{it.a}</p></Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
