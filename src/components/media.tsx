import Image from "next/image";
import { ImageIcon } from "lucide-react";

/**
 * Image slot. With no `src` it renders a designed placeholder that tells the designer exactly what to supply.
 * To go live, drop the file in /public/images and pass src="/images/<slot>.jpg".
 */
export function Media({ slot, alt, brief, ratio = "16 / 10", src, className = "", priority = false }: { slot: string; alt: string; brief: string; ratio?: string; src?: string; className?: string; priority?: boolean }) {
  if (src) {
    return (
      <div className={`media ${className}`} style={{ aspectRatio: ratio }}>
        <Image src={src} alt={alt} fill priority={priority} sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div className={`media placeholder ${className}`} style={{ aspectRatio: ratio }} role="img" aria-label={alt}>
      <span className="ph-grid" aria-hidden="true" />
      <span className="ph-corner tl" aria-hidden="true" /><span className="ph-corner tr" aria-hidden="true" />
      <span className="ph-corner bl" aria-hidden="true" /><span className="ph-corner br" aria-hidden="true" />
      <div className="ph-body">
        <span className="ph-icon"><ImageIcon size={22} /></span>
        <strong>{alt}</strong>
        <span className="ph-brief">{brief}</span>
        <span className="ph-chip">/images/{slot}.jpg &middot; {ratio.replace(" / ", ":")}</span>
      </div>
    </div>
  );
}
