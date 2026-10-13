import Link from "next/link";
import { ArrowRight, Boxes, ClipboardCheck, FileClock, Layers, ScanLine, ShieldCheck, Users, WifiOff, Bell, FileSpreadsheet, UserCheck, Wrench } from "lucide-react";
import { Media } from "@/components/media";
import { CountUp, Parallax, Reveal, Tilt } from "@/components/motion";
import { Faq } from "@/components/marketing";

const SEGMENTS = [
  ["segment-construction", "Construction sites", "Site stores and tool cribs with dozens of hands."],
  ["segment-maintenance", "Maintenance teams", "Shared kits that need to come back, in good condition."],
  ["segment-factory", "Factories", "Tooling and consumables across lines and shifts."],
  ["segment-workshop", "Workshops", "A small store that still needs a clear record."],
  ["segment-warehouse", "Warehouses", "Stock, equipment and the people who move them."],
] as const;

const ROWS = [
  { slot: "feature-scan", icon: ScanLine, title: "Scan, issue, done", copy: "Scan the tag and the item opens with the next action ready. Pick the holder, confirm, and the movement is on the record. Built for gloves, bright sun and shared tablets.", brief: "Close-up of a hand scanning a QR tag on a power drill, store shelving behind" },
  { slot: "feature-batch", icon: Boxes, title: "Issue a whole kit in one pass", copy: "Helmet, gloves, glasses, a drill and a cable for the same person or team. One confirmation, with a separate record for every line.", brief: "Tablet showing a batch checkout list beside a stack of issued tools" },
  { slot: "feature-outstanding", icon: UserCheck, title: "Always know who has what", copy: "The Outstanding view is one tap away: every item that is out, the person, team or job holding it, and what is overdue. No more asking the storekeeper to remember.", brief: "Supervisor reading the outstanding list on a phone at a site gate" },
  { slot: "feature-reconcile", icon: ClipboardCheck, title: "Count against the shelf", copy: "Enter the physical count and see the variance at once. Explain it, approve it, and the original number stays on the record. Your ledger stays honest.", brief: "Storekeeper counting boxes of consumables with a clipboard and tablet" },
] as const;

const GRID = [
  [WifiOff, "Works without signal", "Transactions queue on the device, show their pending state clearly, and sync when the connection returns."],
  [FileClock, "A ledger nobody can quietly edit", "Mistakes are fixed with a new correction record on top, never by rewriting history."],
  [Layers, "Shelves, categories, items", "Every item lives in a category on a shelf, so the store on screen matches the store in the building."],
  [ShieldCheck, "Roles and approvals", "Admins, supervisors, store staff and viewers. Require approval for large adjustments and losses."],
  [Bell, "Alerts that matter", "Low stock, overdue returns, count discrepancies and failed syncs, to the right roles."],
  [FileSpreadsheet, "Import your spreadsheet", "Upload a CSV, map the columns, preview, validate and import. Be issuing items the same day."],
] as const;

const STEPS = [
  ["Set up the store", "Create your organization, add locations, shelves and categories."],
  ["Bring your stock", "Import a spreadsheet or add your first items by hand."],
  ["Invite your team", "Give each person a role: admin, supervisor, store staff or viewer."],
  ["Issue the first item", "Scan or search, choose the holder, confirm. That is your first accountable record."],
] as const;

const ROLES = [
  ["role-storekeeper", "Storekeepers", "Fast transactions, large targets, almost no typing.", Wrench],
  ["role-supervisor", "Supervisors", "See who has what and approve what matters.", Users],
  ["role-admin", "Administrators", "Configure users, policies and thresholds without engineering.", ShieldCheck],
] as const;

const FAQ = [
  { q: "Does it work when the site has no signal?", a: "Yes. Eligible transactions are saved on the device and queued, with a clear pending status, then synced automatically when the connection returns. Conflicts are shown to you rather than silently overwritten." },
  { q: "Can we track both tools and consumables?", a: "Yes. Tools and equipment are tracked individually, each with its own holder and condition. Gloves, bolts and welding rods are tracked by quantity, with minimum levels and low-stock alerts." },
  { q: "How do we get our current stock in?", a: "Upload a CSV, map your columns, preview the result and import. The importer reports duplicate SKUs, missing fields and bad quantities before anything is saved." },
  { q: "What happens when a count does not match?", a: "Reconciliation compares the system count with the physical count, calculates the variance, asks for a reason where you require one, and records an adjustment. The original number is preserved." },
  { q: "Who can change or delete records?", a: "Nobody edits history. Admins correct mistakes with explicit correction transactions, and every material action is written to the audit log." },
  { q: "How is it priced?", a: "We are testing per-store pricing with unlimited staff and transactions, so a busy store is not penalized for being busy. Start a pilot and we will agree terms with you." },
] as const;

export default function Landing() {
  return (
    <>
      {/* HERO */}
      <section className="mk-wrap hero">
        <div className="hero-copy">
          <Reveal><span className="eyebrow">The digital tool crib</span></Reveal>
          <Reveal delay={80}><h1 className="mk-h1">Know who has every tool in your store.</h1></Reveal>
          <Reveal delay={160}><p className="mk-lede">StoreKeeper turns your tool crib or site store into one accountable record. Scan, issue, return and count, and see exactly what is out and who has it, even when the signal drops.</p></Reveal>
          <Reveal delay={240}>
            <div className="cta-row">
              <Link href="/register" className="btn primary lg shine">Start free<ArrowRight size={18} /></Link>
              <a href="#how" className="btn lg">See how it works</a>
            </div>
            <p className="fineprint">Import your spreadsheet and issue your first item today.</p>
          </Reveal>
        </div>
        <Reveal delay={120} className="hero-visual">
          <Tilt max={5}><Media slot="hero" alt="Storekeeper issuing a tool at the store counter" brief="Wide, warm photo of a storekeeper at a site store counter handing a drill to a worker; tablet in hand, shelving behind" ratio="16 / 12" priority className="hero-media" /></Tilt>
          <Parallax speed={-0.05} className="chip c1"><span className="chip-dot bad" />Drill DRL-0042<small>Overdue 2 days</small></Parallax>
          <Parallax speed={0.06} className="chip c2"><span className="chip-dot ok" />Grinder 12<small>Held by Electrical team</small></Parallax>
          <Parallax speed={-0.03} className="chip c3"><span className="chip-dot warn" />Safety gloves<small>37 left, minimum 50</small></Parallax>
        </Reveal>
      </section>

      {/* SEGMENTS */}
      <section className="mk-wrap section tight" aria-labelledby="seg">
        <Reveal><p className="eyebrow center" id="seg">Built for physical stores</p></Reveal>
        <div className="seg-grid">
          {SEGMENTS.map(([slot, name, line], i) => (
            <Reveal key={slot} delay={i * 70}>
              <article className="seg-card glass"><Media slot={slot} alt={name} brief={`${name}: ${line}`} ratio="4 / 5" /><div className="seg-body"><h3>{name}</h3><p className="muted">{line}</p></div></article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TARGETS */}
      <section className="mk-wrap section tight">
        <div className="band glass">
          <Reveal className="band-item"><strong>Under <CountUp to={30} /> s</strong><span>Target for a routine checkout, from start to confirmation</span></Reveal>
          <Reveal className="band-item" delay={90}><strong><CountUp to={0} /> silent edits</strong><span>Every correction is a new, visible record</span></Reveal>
          <Reveal className="band-item" delay={180}><strong>Offline ready</strong><span>Issue and receive items through a network outage</span></Reveal>
        </div>
      </section>

      {/* FEATURE ROWS */}
      <section className="mk-wrap section" id="product">
        <Reveal><h2 className="mk-h2">Faster than the notebook. Clearer than the spreadsheet.</h2></Reveal>
        {ROWS.map((r, i) => (
          <div key={r.slot} className={`feature-row${i % 2 ? " flip" : ""}`}>
            <Reveal className="feature-media"><Tilt max={4}><Media slot={r.slot} alt={r.title} brief={r.brief} ratio="4 / 3" /></Tilt></Reveal>
            <Reveal delay={120} className="feature-copy">
              <span className="feature-icon"><r.icon size={22} /></span>
              <h3>{r.title}</h3>
              <p className="muted">{r.copy}</p>
            </Reveal>
          </div>
        ))}
      </section>

      {/* GRID */}
      <section className="mk-wrap section tight">
        <Reveal><h2 className="mk-h2">Everything a store needs, nothing it does not</h2></Reveal>
        <div className="grid-cards">
          {GRID.map(([Icon, t, c], i) => (
            <Reveal key={t} delay={(i % 3) * 80}><Tilt><article className="gcard glass"><span className="feature-icon"><Icon size={20} /></span><h3>{t}</h3><p className="muted">{c}</p></article></Tilt></Reveal>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section className="mk-wrap section" id="how">
        <Reveal><h2 className="mk-h2">From empty store to first record in four steps</h2></Reveal>
        <ol className="steps">
          {STEPS.map(([t, c], i) => (
            <Reveal as="li" key={t} delay={i * 90} className="step glass"><span className="step-n">{i + 1}</span><h3>{t}</h3><p className="muted">{c}</p></Reveal>
          ))}
        </ol>
      </section>

      {/* ROLES */}
      <section className="mk-wrap section tight">
        <Reveal><h2 className="mk-h2">One system, the right view for everyone</h2></Reveal>
        <div className="role-grid">
          {ROLES.map(([slot, name, line, Icon], i) => (
            <Reveal key={slot} delay={i * 90}>
              <article className="role-card glass"><Media slot={slot} alt={name} brief={`${name}: ${line}`} ratio="3 / 2" /><div className="seg-body"><h3><Icon size={18} />{name}</h3><p className="muted">{line}</p></div></article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="mk-wrap section" id="pricing">
        <Reveal><h2 className="mk-h2">Priced per store, not per person</h2></Reveal>
        <Reveal delay={100}>
          <div className="price-card glass">
            <div>
              <span className="eyebrow">Pilot program</span>
              <h3>One flat fee for each store</h3>
              <p className="muted">Unlimited staff and unlimited transactions, so your busiest day costs the same as your quietest. We are working with a small number of stores to agree pricing that fits.</p>
              <Link href="/register" className="btn primary lg shine">Start a pilot<ArrowRight size={18} /></Link>
            </div>
            <ul className="ticks">
              {["Unlimited users and transactions", "Tools and consumables", "Offline-tolerant transactions", "CSV import and export", "Roles, approvals and audit log", "Email support during the pilot"].map((t) => <li key={t}><ShieldCheck size={16} />{t}</li>)}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="mk-wrap section narrow" id="faq">
        <Reveal><h2 className="mk-h2">Questions, answered</h2></Reveal>
        <Reveal delay={100}><Faq items={[...FAQ]} /></Reveal>
      </section>

      {/* CTA */}
      <section className="mk-wrap section tight">
        <Reveal>
          <div className="cta-band">
            <Media slot="cta" alt="A tidy, well-run tool crib" brief="Wide, calm shot of an organised tool crib with labelled shelves; room for text overlay on the left" ratio="21 / 9" className="cta-media" />
            <div className="cta-over">
              <h2 className="mk-h2">Stop losing tools because nobody knows who took them.</h2>
              <Link href="/register" className="btn primary lg shine">Create your store<ArrowRight size={18} /></Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
