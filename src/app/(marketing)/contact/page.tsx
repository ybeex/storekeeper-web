import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { Media } from "@/components/media";
import { Reveal } from "@/components/motion";

export const metadata: Metadata = { title: "Contact", description: "Talk to the StoreKeeper team about a pilot, pricing or support." };

export default function ContactPage() {
  return (
    <section className="mk-wrap">
      <div className="page-hero">
        <Reveal><span className="eyebrow">Contact</span></Reveal>
        <Reveal delay={80}><h1 className="mk-h1">Tell us about your store.</h1></Reveal>
        <Reveal delay={160}><p className="mk-lede">Planning a pilot, comparing options or need a hand? Send a message and we will reply by email.</p></Reveal>
      </div>
      <div className="contact-grid">
        <Reveal><ContactForm /></Reveal>
        <Reveal delay={120}><Media slot="contact" alt="A storekeeper at the counter" brief="Friendly, candid portrait of a storekeeper at a counter, tools on pegboard behind, warm light" ratio="4 / 5" /></Reveal>
      </div>
    </section>
  );
}
