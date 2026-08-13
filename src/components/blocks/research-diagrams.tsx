import type { ReactNode } from "react";

/**
 * The diagrams in the research artifacts.
 *
 * These replace the ASCII blocks the drafts were written with. ASCII art is
 * unreadable to a screen reader — it arrives as a wall of punctuation — and it
 * breaks at 390px, where the only options are a horizontal scrollbar on a
 * `<pre>` or a shrunken monospace font. An SVG can carry a real accessible
 * description and a real caption instead.
 *
 * Each diagram states the same information the ASCII did, no more: these are
 * illustrations of the prose, not a second source of claims (hard rule 12).
 *
 * Conventions across all six:
 *   - Inter for node labels, mono for annotations, matching the site's voices
 *   - Gold appears only as a rule or an accent edge, never carrying meaning,
 *     because at 1.59:1 it cannot (the same constraint as everywhere else)
 *   - `role="img"` plus a `<title>` and `<desc>`, so the whole figure is one
 *     announced object rather than a pile of stray text nodes
 */

const INK = "#111111";
const MUTED = "#555555";
const DIVIDER = "#e5e5e5";
const BORDER = "#767676";
const SURFACE = "#f5f5f5";
const ACCENT = "#f5c842";

/**
 * Scroll container.
 *
 * The SVG keeps a minimum width and scrolls inside its own box rather than
 * scaling down: scaling would shrink 13px labels to unreadable at 390px. Same
 * treatment the article tables get, including `tabIndex` — a region that only
 * responds to swipe is unusable from a keyboard (WCAG 2.1.1).
 */
function DiagramFrame({
  caption,
  minWidth,
  children,
}: {
  caption: string;
  minWidth: number;
  children: ReactNode;
}) {
  return (
    <figure className="mt-md">
      <div
        className="overflow-x-auto rounded-lg border border-divider"
        tabIndex={0}
      >
        <div style={{ minWidth }} className="p-md">
          {children}
        </div>
      </div>
      <figcaption className="mt-2xs text-xs text-text-muted">
        {caption}
      </figcaption>
    </figure>
  );
}

/**
 * The site's gold rule, inside a diagram.
 *
 * The only place gold appears in these figures. It is the same short
 * underline that follows headings elsewhere on the site (`heading-rule`), so
 * it reads as the house accent rather than as a line with a meaning the
 * reader has to work out. Decorative: at 1.59:1 it cannot carry one.
 */
function AccentRule({ x, y, w = 44 }: { x: number; y: number; w?: number }) {
  return (
    <line
      x1={x}
      y1={y}
      x2={x + w}
      y2={y}
      stroke={ACCENT}
      strokeWidth={2.5}
      strokeLinecap="round"
    />
  );
}

/** A labelled box. `lines` wrap by hand — SVG text does not reflow. */
function Node({
  x,
  y,
  w,
  h,
  lines,
  tone = "plain",
  mono = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  lines: string[];
  tone?: "plain" | "fill" | "strong";
  mono?: boolean;
}) {
  const fill = tone === "fill" ? SURFACE : "#ffffff";
  const stroke = tone === "strong" ? INK : BORDER;
  const startY = y + h / 2 - ((lines.length - 1) * 15) / 2 + 5;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        fill={fill}
        stroke={stroke}
        strokeWidth={tone === "strong" ? 1.75 : 1}
      />
      {lines.map((line, i) => (
        <text
          key={i}
          x={x + w / 2}
          y={startY + i * 15}
          textAnchor="middle"
          fontFamily={mono ? "var(--font-mono)" : "var(--font-inter)"}
          fontSize={mono ? 11.5 : 13}
          fontWeight={i === 0 && !mono ? 600 : 400}
          fill={i === 0 ? INK : MUTED}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

/** Annotation text set flush-left, mono, muted. */
function Note({ x, y, lines }: { x: number; y: number; lines: string[] }) {
  return (
    <g>
      {lines.map((line, i) => (
        <text
          key={i}
          x={x}
          y={y + i * 14}
          fontFamily="var(--font-mono)"
          fontSize={11}
          fill={MUTED}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  markerId,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  markerId: string;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={BORDER}
      strokeWidth={1.25}
      markerEnd={`url(#${markerId})`}
    />
  );
}

/** One arrowhead definition per diagram, since ids must be unique per page. */
function ArrowHead({ id }: { id: string }) {
  return (
    <defs>
      <marker
        id={id}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill={BORDER} />
      </marker>
    </defs>
  );
}

function Svg({
  width,
  height,
  title,
  desc,
  children,
}: {
  width: number;
  height: number;
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label={title}
      style={{ display: "block", height: "auto" }}
    >
      <title>{title}</title>
      <desc>{desc}</desc>
      {children}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Redbud — HVAC                                                       */
/* ------------------------------------------------------------------ */

export function CallRoutingDiagram() {
  const id = "arrow-call-routing";
  return (
    <DiagramFrame
      minWidth={640}
      caption="Where inbound calls end up at Redbud, from the phone system's own logs."
    >
      <Svg
        width={640}
        height={300}
        title="Where inbound calls end up at Redbud Heating & Air"
        desc="An inbound call splits three ways. During office hours with staff free, it is answered and booked. During office hours with both lines busy, it goes to voicemail, and roughly seventy percent of those callers never leave a message. At nights and weekends it goes to voicemail and hits the same cliff, where a competitor answers instead."
      >
        <ArrowHead id={id} />

        <Node
          x={16}
          y={124}
          w={150}
          h={52}
          lines={["Call arrives"]}
          tone="strong"
        />

        <Arrow x1={166} y1={150} x2={214} y2={44} markerId={id} />
        <Arrow x1={166} y1={150} x2={214} y2={150} markerId={id} />
        <Arrow x1={166} y1={150} x2={214} y2={256} markerId={id} />

        <Node
          x={218}
          y={18}
          w={190}
          h={52}
          lines={["Office hours, staff free", "answered, booked"]}
        />
        <Node
          x={218}
          y={124}
          w={190}
          h={52}
          lines={["Office hours, lines busy", "voicemail"]}
          tone="fill"
        />
        <Node
          x={218}
          y={230}
          w={190}
          h={52}
          lines={["Nights / weekends", "voicemail"]}
          tone="fill"
        />

        <Arrow x1={408} y1={150} x2={452} y2={150} markerId={id} />
        <Arrow x1={408} y1={256} x2={452} y2={256} markerId={id} />

        <Note x={456} y={140} lines={["~70% never leave", "a message"]} />
        <Note
          x={456}
          y={246}
          lines={["same cliff —", "a competitor answers"]}
        />
      </Svg>
    </DiagramFrame>
  );
}

export function HvacIntakeArchitecture() {
  const id = "arrow-hvac-intake";
  const stages: { lines: string[]; note: string[] }[] = [
    {
      lines: [
        "AI intake",
        "answers instantly: problem, location,",
        "urgency, callback number",
      ],
      note: ["[AI: conversation — where it", "genuinely earns its place]"],
    },
    {
      lines: [
        "Triage rules",
        "no heat in January, no AC over 95°F",
        "page the on-call tech",
      ],
      note: [
        "[deterministic rules — safety logic",
        "is never left to a model]",
      ],
    },
    {
      lines: ["Scheduler", "offers real slots, books,", "confirms by text"],
      note: ["[integration with the field-service", "calendar]"],
    },
    {
      lines: [
        "Morning digest",
        "booked jobs and full transcripts,",
        "not voicemails",
      ],
      note: ["[a human reviews everything", "the AI did]"],
    },
  ];

  return (
    <DiagramFrame
      minWidth={700}
      caption="The intake system Redbud had built, stage by stage."
    >
      <Svg
        width={700}
        height={392}
        title="Redbud's after-hours intake system, stage by stage"
        desc="An after-hours call, text or web form enters an AI intake step that asks for the problem, location, urgency and a callback number. It passes to deterministic triage rules, which page the on-call technician for no-heat and no-cooling emergencies and book everything else. A scheduler offers real calendar slots and confirms by text. In the morning the office receives a digest of booked jobs and full transcripts, which a human reviews."
      >
        <ArrowHead id={id} />

        <Node
          x={16}
          y={8}
          w={330}
          h={44}
          lines={["After-hours call, text or web form"]}
          tone="strong"
        />

        {stages.map((stage, i) => {
          const y = 76 + i * 78;
          return (
            <g key={i}>
              <Arrow x1={181} y1={y - 24} x2={181} y2={y - 4} markerId={id} />
              <Node
                x={16}
                y={y}
                w={330}
                h={54}
                lines={stage.lines}
                tone="fill"
              />
              <Note x={362} y={y + 24} lines={stage.note} />
            </g>
          );
        })}
      </Svg>
    </DiagramFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Kestrel — beverage manufacturing                                    */
/* ------------------------------------------------------------------ */

export function RfqProcessMap() {
  const id = "arrow-rfq-map";
  return (
    <DiagramFrame
      minWidth={680}
      caption="How a request for quote moves through Kestrel today: two to four days, by hand."
    >
      <Svg
        width={680}
        height={330}
        title="How a request for quote moves through Kestrel today"
        desc="An inbound request for quote arrives in the sales inbox and is copied into a pricing spreadsheet, which requires manual lookups of material costs, line rates and the changeover matrix. A draft quote goes to the production manager, who checks the schedule. The client receives a PDF two to four days after asking."
      >
        <ArrowHead id={id} />

        <Node
          x={16}
          y={16}
          w={170}
          h={48}
          lines={["Inbound RFQ"]}
          tone="strong"
        />
        <Arrow x1={186} y1={40} x2={228} y2={40} markerId={id} />
        <Node x={232} y={16} w={170} h={48} lines={["Sales inbox"]} />
        <Arrow x1={402} y1={40} x2={444} y2={40} markerId={id} />
        <Node
          x={448}
          y={10}
          w={216}
          h={60}
          lines={["Pricing spreadsheet", "version 3, usually"]}
          tone="fill"
        />

        <Arrow x1={556} y1={70} x2={556} y2={104} markerId={id} />
        <Note
          x={392}
          y={126}
          lines={[
            "manual lookups: material costs,",
            "line rates, changeover matrix",
          ]}
        />

        <Arrow x1={556} y1={150} x2={556} y2={182} markerId={id} />
        <Node
          x={448}
          y={188}
          w={216}
          h={54}
          lines={["Draft quote", "email thread"]}
          tone="fill"
        />

        <Arrow x1={448} y1={215} x2={394} y2={215} markerId={id} />
        <Node
          x={216}
          y={188}
          w={174}
          h={54}
          lines={["Production manager", "checks the schedule"]}
        />

        <Arrow x1={303} y1={242} x2={303} y2={274} markerId={id} />
        <Node
          x={186}
          y={278}
          w={234}
          h={44}
          lines={["Client gets PDF — 2–4 days later"]}
          tone="strong"
        />
      </Svg>
    </DiagramFrame>
  );
}

export function QuotingArchitecture() {
  const id = "arrow-quoting";
  const stages: { lines: string[]; note: string[] }[] = [
    {
      lines: [
        "Intake parser",
        "extracts product type, volume, can size,",
        "packaging, target date",
      ],
      note: ["[AI: document extraction]"],
    },
    {
      lines: [
        "Pricing engine",
        "materials, line rate, changeover,",
        "carbonation loss curves",
      ],
      note: ["[NOT AI — arithmetic should", "never hallucinate]"],
    },
    {
      lines: [
        "Schedule checker",
        "reads the production calendar,",
        "proposes three viable slots",
      ],
      note: ["[integration, not AI]"],
    },
    {
      lines: ["Draft quote", "priced, slotted, formatted"],
      note: ["[human stays in the loop]"],
    },
  ];

  return (
    <DiagramFrame
      minWidth={700}
      caption="The quoting system, and which steps are AI and which deliberately are not."
    >
      <Svg
        width={700}
        height={476}
        title="Kestrel's quoting system, and which steps are AI"
        desc="A request for quote arriving by email or web form passes through an AI intake parser that extracts product type, volume, can size, packaging and target date. A deterministic pricing engine — explicitly not AI — computes materials, line rate, changeover and carbonation loss. A schedule checker reads the production calendar and proposes three viable slots. A draft quote is priced, slotted and formatted for a human to approve, and one click sends it. Elapsed time is minutes."
      >
        <ArrowHead id={id} />

        <Node
          x={16}
          y={8}
          w={330}
          h={44}
          lines={["RFQ arrives (email / web form)"]}
          tone="strong"
        />

        {stages.map((stage, i) => {
          const y = 76 + i * 78;
          return (
            <g key={i}>
              <Arrow x1={181} y1={y - 24} x2={181} y2={y - 4} markerId={id} />
              <Node
                x={16}
                y={y}
                w={330}
                h={54}
                lines={stage.lines}
                tone="fill"
              />
              <Note x={362} y={y + 30} lines={stage.note} />
            </g>
          );
        })}

        <Arrow x1={181} y1={388} x2={181} y2={408} markerId={id} />
        <Node
          x={16}
          y={412}
          w={330}
          h={48}
          lines={["One click — approved quote to client", "Elapsed: minutes"]}
          tone="strong"
        />
      </Svg>
    </DiagramFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Limestone — freight brokerage                                       */
/* ------------------------------------------------------------------ */

export function OpsInboxComposition() {
  const rows = [
    {
      pct: 31,
      label: "Status requests",
      detail: "“where's load #4471?”",
      mechanical: true,
    },
    {
      pct: 22,
      label: "Quote requests",
      detail: "free-text: lane, weight, date",
      mechanical: true,
    },
    {
      pct: 19,
      label: "Carrier documents",
      detail: "rate cons, PODs, insurance certs",
      mechanical: true,
    },
    {
      pct: 28,
      label: "Everything else",
      detail: "real judgment work",
      mechanical: false,
    },
  ];

  const scale = 4.4;
  return (
    <DiagramFrame
      minWidth={640}
      caption="Two weeks of Limestone's shared ops mailbox, categorised message by message."
    >
      <Svg
        width={640}
        height={286}
        title="Composition of Limestone's ops inbox over two weeks"
        desc="Of roughly 340 emails a day, 31 percent are status requests, 22 percent are quote requests, and 19 percent are carrier documents such as rate confirmations, proofs of delivery and insurance certificates. Together those three categories are 72 percent of the inbox and are mechanical work. The remaining 28 percent is judgment work that stays with people."
      >
        <text
          x={16}
          y={20}
          fontFamily="var(--font-inter)"
          fontSize={13}
          fontWeight={600}
          fill={INK}
        >
          Ops inbox — about 340 emails a day
        </text>
        <AccentRule x={16} y={30} />

        {rows.map((row, i) => {
          const y = 44 + i * 46;
          return (
            <g key={row.label}>
              <text
                x={16}
                y={y + 15}
                fontFamily="var(--font-mono)"
                fontSize={13}
                fontWeight={600}
                fill={INK}
              >
                {row.pct}%
              </text>
              <rect
                x={58}
                y={y}
                width={row.pct * scale}
                height={22}
                rx={3}
                fill={row.mechanical ? INK : SURFACE}
                stroke={row.mechanical ? INK : BORDER}
                strokeWidth={1}
              />
              <text
                x={58 + row.pct * scale + 12}
                y={y + 11}
                fontFamily="var(--font-inter)"
                fontSize={13}
                fontWeight={600}
                fill={INK}
              >
                {row.label}
              </text>
              <text
                x={58 + row.pct * scale + 12}
                y={y + 25}
                fontFamily="var(--font-mono)"
                fontSize={11}
                fill={MUTED}
              >
                {row.detail}
              </text>
            </g>
          );
        })}

        <line
          x1={16}
          y1={236}
          x2={624}
          y2={236}
          stroke={DIVIDER}
          strokeWidth={1}
        />
        <text
          x={16}
          y={258}
          fontFamily="var(--font-inter)"
          fontSize={13}
          fontWeight={600}
          fill={INK}
        >
          72% mechanical — filled bars
        </text>
        <text
          x={16}
          y={274}
          fontFamily="var(--font-mono)"
          fontSize={11}
          fill={MUTED}
        >
          reading a document, looking it up, transcribing the answer back out
        </text>
      </Svg>
    </DiagramFrame>
  );
}

export function DocumentAutomationArchitecture() {
  const id = "arrow-doc-automation";
  const branches: { lines: string[]; note: string[] }[] = [
    {
      lines: [
        "Status bot",
        "reads the TMS tracking record, replies",
        "with location and ETA — including 2 AM",
      ],
      note: [
        "[AI drafts from live data — it can",
        "only say what the TMS says]",
      ],
    },
    {
      lines: [
        "Quote intake",
        "extracts lane, weight, dates; creates the",
        "TMS record; pulls rate history",
      ],
      note: ["[AI extracts; pricing stays HUMAN —", "margin is judgment]"],
    },
    {
      lines: [
        "Doc processor",
        "identifies rate cons, PODs, insurance certs;",
        "files them; flags expired insurance HARD",
      ],
      note: ["[extraction is AI; the expiry block is", "a deterministic rule]"],
    },
    {
      lines: [
        "Human queue",
        "the 28%, plus anything scored",
        "low-confidence, with full context",
      ],
      note: [
        "[low confidence routes to people,",
        "loudly, rather than guessing quietly]",
      ],
    },
  ];

  return (
    <DiagramFrame
      minWidth={760}
      caption="The three-part document system, and where work is handed back to people."
    >
      <Svg
        width={760}
        height={430}
        title="Limestone's document automation, and where work returns to people"
        desc="An inbound email or document reaches an AI classifier that decides whether it is a status request, a quote, a document, or something else. Status requests go to a bot that reads the transport management system and replies with location and estimated arrival at any hour. Quote requests are extracted into a TMS record with rate history attached, but pricing stays with a human. Documents are identified, filed, and expired insurance is flagged by a deterministic rule. Everything else, plus anything the classifier scores low-confidence, goes to a human queue with full context attached."
      >
        <ArrowHead id={id} />

        <Node
          x={16}
          y={8}
          w={300}
          h={44}
          lines={["Inbound email or document"]}
          tone="strong"
        />
        <Arrow x1={166} y1={52} x2={166} y2={72} markerId={id} />
        <Node
          x={16}
          y={76}
          w={300}
          h={50}
          lines={["Classifier", "status? quote? document? other?"]}
          tone="fill"
        />
        <Note
          x={332}
          y={98}
          lines={[
            "[AI: reading unstructured email is",
            "what modern models are for]",
          ]}
        />

        {branches.map((branch, i) => {
          const y = 154 + i * 68;
          return (
            <g key={i}>
              <line
                x1={40}
                y1={126}
                x2={40}
                y2={y + 26}
                stroke={BORDER}
                strokeWidth={1.25}
              />
              <Arrow x1={40} y1={y + 26} x2={68} y2={y + 26} markerId={id} />
              <Node x={72} y={y} w={330} h={52} lines={branch.lines} />
              <Note x={418} y={y + 24} lines={branch.note} />
            </g>
          );
        })}
      </Svg>
    </DiagramFrame>
  );
}
