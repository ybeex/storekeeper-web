import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion";
import { LEGAL, UPDATED } from "@/lib/legal-content";

export const metadata: Metadata = { title: "Legal" };

export default function LegalIndex() {
  return (
    <section className="mk-wrap section legal-index">
      <Reveal><span className="eyebrow">Legal</span><h1 className="mk-h2">Terms, privacy and security</h1><p className="muted">Last updated {UPDATED}</p></Reveal>
      <div className="grid-cards two">
        {LEGAL.map((d, i) => (
          <Reveal key={d.slug} delay={(i % 2) * 90}>
            <Link href={`/legal/${d.slug}`} className="gcard glass link-card"><h3>{d.title}<ArrowUpRight size={18} /></h3><p className="muted">{d.summary}</p></Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
