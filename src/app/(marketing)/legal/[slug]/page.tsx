import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LEGAL, UPDATED } from "@/lib/legal-content";

export const dynamicParams = false;
export function generateStaticParams() { return LEGAL.map((d) => ({ slug: d.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = LEGAL.find((x) => x.slug === slug);
  return { title: d?.title ?? "Legal", description: d?.summary };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = LEGAL.find((x) => x.slug === slug);
  if (!doc) notFound();
  return (
    <article className="mk-wrap section legal-doc">
      <Link href="/legal" className="back"><ArrowLeft size={16} />All legal documents</Link>
      <h1 className="mk-h2">{doc.title}</h1>
      <p className="muted">Last updated {UPDATED}</p>
      <p className="draft-note glass">Template text. Replace the bracketed placeholders and have a qualified lawyer review this document before you launch.</p>
      <nav className="toc glass" aria-label="On this page">{doc.sections.map((s, i) => <a key={s.h} href={`#s${i}`}>{s.h}</a>)}</nav>
      {doc.sections.map((s, i) => (
        <section key={s.h} id={`s${i}`}><h2>{s.h}</h2>{s.p.map((t) => <p key={t}>{t}</p>)}</section>
      ))}
    </article>
  );
}
