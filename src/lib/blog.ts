export type Block = { h?: string; p: string[] };
export type Post = { slug: string; title: string; excerpt: string; date: string; readMinutes: number; tag: string; coverSlot: string; coverBrief: string; body: Block[] };

export const POSTS: Post[] = [
  {
    slug: "why-tools-disappear",
    title: "Why tools disappear from site stores, and how to stop it",
    excerpt: "Most losses are not theft. They are movements nobody wrote down. Here is how to close that gap without slowing the counter.",
    date: "2026-09-28", readMinutes: 5, tag: "Accountability",
    coverSlot: "blog-tools", coverBrief: "Overhead shot of a cluttered site store counter with a notebook, a drill and a hand reaching for it",
    body: [
      { p: ["Ask any storekeeper where a missing grinder went and you will usually get a shrug and a name. The tool did not vanish. Someone took it, meant to bring it back, and the only record was a mental note or a line in a notebook that nobody can find."] },
      { h: "Losses are mostly missing records", p: ["When a tool leaves the store without a clear holder, three things stop working at once: you cannot chase it, you cannot plan around it, and you cannot tell a forgotten return from a genuine loss. The cost shows up later as replacement orders and delays on site."] },
      { h: "Make recording faster than skipping it", p: ["People bypass a system when the system is slower than the alternative. A paper sign-out takes ten seconds, so a process that takes thirty will lose. The goal is a record that costs less effort than not making one: scan, pick the holder, confirm.", "Batch issue helps most. A worker collecting a helmet, gloves, glasses and a drill should be one transaction, not four."] },
      { h: "Give every item a holder", p: ["A holder can be a person, a team or a job. What matters is that responsibility is always named. When a team has the generator, the question is no longer who took it, it is who on that team has it, and the answer is one tap away."] },
      { h: "Look at the outstanding list every day", p: ["The most useful screen in any tool store is the list of what is currently out. Check it at the end of the shift. Overdue items become a conversation on day one instead of a write-off at month end."] },
    ],
  },
  {
    slug: "assets-vs-consumables",
    title: "Assets and consumables need different bookkeeping",
    excerpt: "A drill and a box of bolts are not the same kind of thing. Treating them alike is why most spreadsheets break.",
    date: "2026-09-21", readMinutes: 4, tag: "Inventory",
    coverSlot: "blog-assets", coverBrief: "Flat lay: a power drill with a tag beside a small box of bolts and a pair of gloves",
    body: [
      { p: ["A drill has an identity. You care which drill it is, who has it, what condition it came back in, and when it is due for service. A box of bolts has none of that. You care how many are left and when to reorder."] },
      { h: "Track assets one by one", p: ["Each tool gets its own record and its own tag. Its history is a timeline: checked out, returned damaged, sent for inspection, back in service. Quantity is always one, so the useful questions are about state and custody."] },
      { h: "Track consumables by quantity", p: ["Gloves, screws and welding rods move in counts. They are issued, consumed on a job, restocked and counted. The useful questions are how many are left, what the minimum is, and what to reorder."] },
      { h: "Why mixing them fails", p: ["A single sheet with a quantity column cannot say who holds drill number 42, and a record per bolt would be absurd. Keep the two models separate, but put them in one transaction flow so a worker can take both in a single pass."] },
    ],
  },
  {
    slug: "count-the-shelf",
    title: "Count the shelf: a practical guide to reconciliation",
    excerpt: "A perfect ledger can still be wrong about the shelf. Regular counts, with explained variances, keep the numbers honest.",
    date: "2026-09-14", readMinutes: 5, tag: "Operations",
    coverSlot: "blog-count", coverBrief: "Storekeeper counting boxes on a shelf with a tablet, shallow depth of field",
    body: [
      { p: ["Records describe what should be on the shelf. Reality has its own opinion. Breakage, unrecorded use and miscounts all push the two apart, and the gap only grows if nobody looks."] },
      { h: "Count a slice, not the whole store", p: ["A full stocktake stops work. Counting one shelf or category at a time is quick enough to do weekly, and it spreads the effort. Rotate so that everything is counted on a regular cycle."] },
      { h: "Record the variance, then explain it", p: ["If the system says 100 and the shelf holds 93, the minus seven is information, not an error to bury. Ask why: unrecorded use, damage, a miscount. Write the reason down."] },
      { h: "Never overwrite history", p: ["Correct the stock with an adjustment that sits on top of the original figure. The old number stays visible, which is what lets a supervisor trust the new one. Require approval for large adjustments so they cannot become a quiet way to erase a discrepancy."] },
    ],
  },
];

export const postBySlug = (s: string) => POSTS.find((p) => p.slug === s);
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
