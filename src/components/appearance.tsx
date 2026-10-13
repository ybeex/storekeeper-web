"use client";
import type { CSSProperties } from "react";
import {
  Boxes, Cable, Check, Cog, Drill, Droplet, Flame, FlaskConical, Gauge, Glasses, Hammer, HardHat, Key, Layers, Lightbulb, Package, Paintbrush, Pill, Plug,
  Ruler, Scissors, Shield, Shirt, ShoppingBasket, Sprout, Tag, Thermometer, Truck, Utensils, Warehouse, Wheat, Wrench, Zap, type LucideIcon,
} from "lucide-react";

/**
 * Visual identity for shelves, categories and items.
 *
 * The server stores only these KEYS (src/lib/appearance.ts in the API mirrors the lists), never raw hex values. Every
 * colour here has a light and a night variant in globals.css (`.tone-*`), checked for contrast in both themes, so a card
 * is readable whichever theme the storekeeper is in and a stray value can never produce an unreadable tile.
 */
export const PALETTE = [
  ["maroon", "Maroon"], ["amber", "Amber"], ["teal", "Teal"], ["slate", "Slate"], ["forest", "Forest"], ["indigo", "Indigo"],
  ["rose", "Rose"], ["copper", "Copper"], ["sky", "Sky"], ["olive", "Olive"], ["plum", "Plum"], ["graphite", "Graphite"],
] as const;
export type PaletteKey = (typeof PALETTE)[number][0];

export const ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  package: { icon: Package, label: "Package" }, boxes: { icon: Boxes, label: "Boxes" }, layers: { icon: Layers, label: "Layers" },
  wrench: { icon: Wrench, label: "Wrench" }, hammer: { icon: Hammer, label: "Hammer" }, drill: { icon: Drill, label: "Drill" },
  zap: { icon: Zap, label: "Electrical" }, plug: { icon: Plug, label: "Plug" }, cable: { icon: Cable, label: "Cable" },
  lightbulb: { icon: Lightbulb, label: "Lighting" }, "hard-hat": { icon: HardHat, label: "Hard hat" }, shield: { icon: Shield, label: "Safety" },
  glasses: { icon: Glasses, label: "Eyewear" }, shirt: { icon: Shirt, label: "Clothing" }, truck: { icon: Truck, label: "Transport" },
  paintbrush: { icon: Paintbrush, label: "Paint" }, flask: { icon: FlaskConical, label: "Chemicals" }, droplet: { icon: Droplet, label: "Liquids" },
  flame: { icon: Flame, label: "Welding" }, scissors: { icon: Scissors, label: "Cutting" }, ruler: { icon: Ruler, label: "Measuring" },
  gauge: { icon: Gauge, label: "Gauge" }, thermometer: { icon: Thermometer, label: "Temperature" }, key: { icon: Key, label: "Keys" },
  tag: { icon: Tag, label: "Tag" }, wheat: { icon: Wheat, label: "Grains" }, "shopping-basket": { icon: ShoppingBasket, label: "Provisions" },
  utensils: { icon: Utensils, label: "Kitchen" }, sprout: { icon: Sprout, label: "Produce" }, pill: { icon: Pill, label: "Medical" },
  cog: { icon: Cog, label: "Machinery" }, warehouse: { icon: Warehouse, label: "Warehouse" },
};

export type Look = { color?: string | null; icon?: string | null };
const KNOWN = new Set<string>(PALETTE.map(([k]) => k));

/** The first level that names a colour, and the first that names an icon, win. Item → category → shelf → default. */
export function resolveLook(...levels: Array<Look | null | undefined>): { color: PaletteKey; icon: string } {
  const color = levels.map((l) => l?.color).find((c): c is string => !!c && KNOWN.has(c)) ?? "graphite";
  const icon = levels.map((l) => l?.icon).find((i): i is string => !!i && i in ICONS) ?? "package";
  return { color: color as PaletteKey, icon };
}
export const iconOf = (key: string): LucideIcon => (ICONS[key] ?? ICONS.package).icon;

/** The coloured square with an icon in it: used in headers, menus and as the cover of cards that have no photo. */
export function Glyph({ look, size = 44, solid = false, className = "" }: { look: { color: string; icon: string }; size?: number; solid?: boolean; className?: string }) {
  const Icon = iconOf(look.icon);
  return (
    <span className={`glyph tone-${look.color}${solid ? " solid" : ""} ${className}`} style={{ width: size, height: size, borderRadius: Math.round(size * 0.3) } as CSSProperties} aria-hidden>
      <Icon size={Math.round(size * 0.5)} />
    </span>
  );
}

/**
 * Colour and icon chooser with a live preview. `inheritLabel` names what "no choice" means for this level
 * ("Match the shelf"), because a category with no colour of its own takes its shelf's.
 */
export function LookPicker({ value, onChange, fallback, inheritLabel = "Default" }: {
  value: Look; onChange: (v: Look) => void; fallback: { color: string; icon: string }; inheritLabel?: string;
}) {
  const shown = resolveLook(value, fallback);
  return (
    <div className="look-picker">
      <div className="look-preview">
        <Glyph look={shown} size={56} solid />
        <div className="look-preview-text">
          <strong>Preview</strong>
          <span className="muted small">{value.color || value.icon ? "Your choice" : inheritLabel}</span>
        </div>
      </div>
      <div role="radiogroup" aria-label="Color" className="swatches">
        <button type="button" role="radio" aria-checked={!value.color} aria-label={inheritLabel} title={inheritLabel} className={`swatch auto${!value.color ? " on" : ""}`} onClick={() => onChange({ ...value, color: null })}>
          {!value.color && <Check size={14} />}
        </button>
        {PALETTE.map(([k, label]) => (
          <button key={k} type="button" role="radio" aria-checked={value.color === k} aria-label={label} title={label} className={`swatch tone-${k}${value.color === k ? " on" : ""}`} onClick={() => onChange({ ...value, color: k })}>
            {value.color === k && <Check size={14} />}
          </button>
        ))}
      </div>
      <div role="radiogroup" aria-label="Icon" className="icon-grid">
        <button type="button" role="radio" aria-checked={!value.icon} title={inheritLabel} aria-label={inheritLabel} className={`icon-cell auto${!value.icon ? " on" : ""}`} onClick={() => onChange({ ...value, icon: null })}>Auto</button>
        {Object.entries(ICONS).map(([k, { icon: Icon, label }]) => (
          <button key={k} type="button" role="radio" aria-checked={value.icon === k} aria-label={label} title={label} className={`icon-cell${value.icon === k ? " on" : ""}`} onClick={() => onChange({ ...value, icon: k })}>
            <Icon size={20} />
          </button>
        ))}
      </div>
    </div>
  );
}
