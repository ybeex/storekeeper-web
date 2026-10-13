import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Media } from "@/components/media";
import { POSTS, fmtDate, postBySlug } from "@/lib/blog";

export const dynamicParams = false;
export const generateStaticParams = () => POSTS.map((p) => ({ slug: p.slug }));
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = postBySlug((await params).slug);
  return { title: p?.title ?? "Blog", description: p?.excerpt };
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const post = postBySlug((await params).slug);
  if (!post) notFound();
  return (
    <article className="mk-wrap article">
      <Link href="/blog" className="back"><ArrowLeft size={16} />All posts</Link>
      <span className="tag-pill">{post.tag}</span>
      <h1>{post.title}</h1>
      <div className="meta"><time dateTime={post.date}>{fmtDate(post.date)}</time><span>{post.readMinutes} min read</span><span>The StoreKeeper team</span></div>
      <Media slot={post.coverSlot} alt={post.title} brief={post.coverBrief} ratio="16 / 9" />
      {post.body.map((b, i) => (<section key={i}>{b.h && <h2>{b.h}</h2>}{b.p.map((t) => <p key={t}>{t}</p>)}</section>))}
      <Link href="/contact" className="btn primary lg shine">Talk to us about your store<ArrowRight size={18} /></Link>
    </article>
  );
}
