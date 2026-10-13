import type { Metadata } from "next";
import Link from "next/link";
import { Media } from "@/components/media";
import { Reveal } from "@/components/motion";
import { POSTS, fmtDate } from "@/lib/blog";

export const metadata: Metadata = { title: "Blog", description: "Practical notes on running an accountable tool crib." };

export default function Blog() {
  return (
    <section className="mk-wrap section">
      <Reveal><span className="eyebrow">Blog</span><h1 className="mk-h2">Notes from the tool crib</h1><p className="muted mk-lede">Practical guidance on accountability, inventory and running a store that people actually use.</p></Reveal>
      <div className="blog-grid">
        {POSTS.map((p, i) => (
          <Reveal key={p.slug} delay={(i % 3) * 90}>
            <Link href={`/blog/${p.slug}`} className="post-card glass">
              <Media slot={p.coverSlot} alt={p.title} brief={p.coverBrief} ratio="16 / 10" />
              <div className="post-body"><span className="tag-pill">{p.tag}</span><h3>{p.title}</h3><p className="muted">{p.excerpt}</p><div className="meta"><time dateTime={p.date}>{fmtDate(p.date)}</time><span>{p.readMinutes} min read</span></div></div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
