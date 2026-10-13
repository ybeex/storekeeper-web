import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Media } from "@/components/media";
import { Reveal, Tilt } from "@/components/motion";

export const metadata: Metadata = { title: "About", description: "Why we are building the digital tool crib." };

const PRINCIPLES = [
  ["Transactions over dashboards", "The movement is the unit of truth. Everything else is a view of it."],
  ["Accountability over complexity", "Every movement has a clear actor and, where it matters, a clear holder."],
  ["Speed over completeness", "Capture the minimum needed for accountability without slowing the counter."],
  ["Physical reality over system assumptions", "Records and shelves drift apart. Reconciliation is part of the product, not an afterthought."],
  ["Offline over connectivity", "A dropped signal must never stop a store from issuing or receiving items."],
  ["History is never rewritten", "Mistakes are fixed with a visible correction on top, so the ledger stays trustworthy."],
] as const;

export default function About() {
  return (
    <>
      <section className="mk-wrap">
        <div className="page-hero">
          <Reveal><span className="eyebrow">About</span></Reveal>
          <Reveal delay={80}><h1 className="mk-h1">We are building the digital tool crib.</h1></Reveal>
          <Reveal delay={160}><p className="mk-lede">Physical stores run on notebooks, memory and goodwill. StoreKeeper replaces that with one fast, accountable record, built for the people standing at the counter.</p></Reveal>
        </div>
        <Reveal><Media slot="about-hero" alt="A busy, well-run tool crib" brief="Wide documentary photo of a site tool crib mid-shift: storekeeper, a worker at the counter, labelled shelving" ratio="21 / 9" /></Reveal>
      </section>

      <section className="mk-wrap section">
        <div className="split">
          <Reveal><h2 className="mk-h2">Why this exists</h2><p className="muted mk-lede">Tools disappear without a clear owner. Equipment comes back damaged and nobody records it. Consumables run out on the day they are needed. Counts disagree with records, and no one can say who was responsible.</p><p className="muted mk-lede">The problem is not a lack of inventory software. It is that physical movements are hard to capture consistently. So we designed around the moment of the movement: if recording is slower than not recording, people will skip it.</p></Reveal>
          <Reveal delay={120}><Tilt max={4}><Media slot="about-story" alt="Worker returning a tool" brief="Close, human moment of a worker handing a tool back across the counter; hands and tablet in frame" ratio="4 / 3" /></Tilt></Reveal>
        </div>
      </section>

      <section className="mk-wrap section tight">
        <Reveal><h2 className="mk-h2">What we believe</h2></Reveal>
        <div className="principles">
          {PRINCIPLES.map(([t, c], i) => (
            <Reveal key={t} delay={(i % 2) * 90}><article className="principle glass"><h3><span className="n">{String(i + 1).padStart(2, "0")}</span>{t}</h3><p className="muted">{c}</p></article></Reveal>
          ))}
        </div>
      </section>

      <section className="mk-wrap section">
        <Reveal>
          <div className="price-card glass">
            <div><span className="eyebrow">Where we are</span><h3>Working with a small number of stores</h3><p className="muted">We are running pilots with real tool cribs and site stores, and we shape the product around how they actually work. If that sounds like your store, we would like to hear from you.</p><Link href="/contact" className="btn primary lg shine">Talk to us<ArrowRight size={18} /></Link></div>
            <Media slot="about-pilot" alt="A pilot store in use" brief="Tablet on a store counter showing the outstanding list, tools and a hi-vis vest beside it" ratio="4 / 3" />
          </div>
        </Reveal>
      </section>
    </>
  );
}
