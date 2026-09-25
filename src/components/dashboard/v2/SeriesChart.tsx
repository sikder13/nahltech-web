import type { DashboardConfig } from "@/lib/dashboards/v2/schema";

import { EvidenceLabel, Labelled } from "./EvidenceLabel";

/**
 * The public series, drawn as plain SVG at build time. No chart library and
 * no client JavaScript: the data are fixed at publication and dated beside
 * the chart, so there is nothing for a browser to compute.
 *
 * Conventions follow `research-diagrams.tsx`: ink and muted for anything that
 * states a value, gold only as an accent that states nothing, and each
 * figure announced once through `role="img"` with a title and description.
 *
 * The viewBoxes are drawn at roughly phone width so 12-unit type lands near
 * 12px on the device this page is scanned from, and the figure is capped on
 * wide screens so the type never balloons.
 */

type Chart = DashboardConfig["market"]["charts"][number];

const INK = "#111111";
const MUTED = "#555555";
const DIVIDER = "#e5e5e5";
const ACCENT = "#f5c842";

/** 1, 2 or 5 times a power of ten: the steps a person reads an axis in. */
function niceStep(raw: number): number {
  const power = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / power;
  return (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10) * power;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 1 });

function Bars({ chart }: { chart: Extract<Chart, { kind: "bars" }> }) {
  const W = 400;
  const rowH = 44;
  const labelW = 48;
  const valueW = 76;
  const H = chart.bars.length * rowH + 8;
  const max = Math.max(...chart.bars.map((b) => b.value));
  const barMax = W - labelW - valueW;
  const last = chart.bars.length - 1;
  const desc = chart.bars.map((b) => `${b.label}: ${fmt(b.value)}`).join("; ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" className="h-auto w-full">
      <title>{chart.title}</title>
      <desc>{desc}</desc>
      {chart.bars.map((bar, i) => {
        const y = i * rowH + 8;
        const w = (bar.value / max) * barMax;
        const current = i === last;
        return (
          <g key={bar.label}>
            <text x={0} y={y + 20} fontSize={13} fontWeight={600} fill={INK}>
              {bar.label}
            </text>
            <rect
              x={labelW}
              y={y + 4}
              width={w}
              height={24}
              rx={3}
              fill={current ? INK : DIVIDER}
              stroke={current ? INK : MUTED}
              strokeWidth={1}
            />
            <text x={labelW + w + 8} y={y + 21} fontSize={13} fill={INK}>
              {fmt(bar.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Line({ chart }: { chart: Extract<Chart, { kind: "line" }> }) {
  const W = 400;
  const H = 210;
  const pad = { l: 36, r: 16, t: 26, b: 28 };
  const values = chart.points.map((p) => p.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const margin = (hi - lo) * 0.12 || 1;
  const yMin = lo - margin;
  const yMax = hi + margin;
  const n = chart.points.length;
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / (n - 1);
  const y = (v: number) =>
    pad.t + (1 - (v - yMin) / (yMax - yMin)) * (H - pad.t - pad.b);
  const path = chart.points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`,
    )
    .join(" ");
  // Round gridlines, so an axis value is never mistaken for a data point.
  const tickStep = niceStep((yMax - yMin) / 3);
  const ticks: number[] = [];
  for (
    let t = Math.ceil(yMin / tickStep) * tickStep;
    t <= yMax;
    t += tickStep
  ) {
    ticks.push(t);
  }
  const last = n - 1;
  const xLabels = [
    0,
    ...chart.annotate.filter((i) => i !== 0 && i !== last),
    last,
  ].filter((i, idx, arr) => arr.indexOf(i) === idx);
  const desc = chart.points
    .map((p) => `${p.label}: ${fmt(p.value)}`)
    .join("; ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" className="h-auto w-full">
      <title>{chart.title}</title>
      <desc>{desc}</desc>
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={y(t)}
            y2={y(t)}
            stroke={DIVIDER}
          />
          <text
            x={pad.l - 6}
            y={y(t) + 4}
            fontSize={11}
            fill={MUTED}
            textAnchor="end"
          >
            {Math.round(t)}
          </text>
        </g>
      ))}
      <path
        d={path}
        fill="none"
        stroke={INK}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {chart.annotate.map((i) => {
        const p = chart.points[i];
        if (!p) return null;
        const isLast = i === last;
        // Label on the side away from the line: above a peak, below a trough
        // or a slope, so a value never sits on its own stroke.
        const neighbours = [chart.points[i - 1], chart.points[i + 1]]
          .filter((q): q is { label: string; value: number } => Boolean(q))
          .map((q) => q.value);
        const above = neighbours.every((v) => p.value >= v);
        return (
          <g key={i}>
            <circle
              cx={x(i)}
              cy={y(p.value)}
              r={isLast ? 5 : 3.5}
              fill={isLast ? ACCENT : INK}
              stroke={INK}
              strokeWidth={1.5}
            />
            <text
              x={x(i)}
              y={above ? y(p.value) - 10 : y(p.value) + 18}
              fontSize={12}
              fontWeight={600}
              fill={INK}
              textAnchor={i === 0 ? "start" : isLast ? "end" : "middle"}
            >
              {fmt(p.value)}
            </text>
          </g>
        );
      })}
      {xLabels.map((i) => (
        <text
          key={`x${i}`}
          x={x(i)}
          y={H - 8}
          fontSize={11}
          fill={MUTED}
          textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}
        >
          {chart.points[i]?.label}
        </text>
      ))}
    </svg>
  );
}

/**
 * Two dated readings drawn as a drafting sheet would: each point on a zero
 * baseline scale, a dashed extension line from each to a dimension line on
 * the right, and the change written on that dimension. There is deliberately
 * no line between the points: the sources give two readings, not a monthly
 * series, and a joining line would imply data we do not have.
 *
 * A computed point (derived from a published change rather than read from a
 * source) is drawn hollow and carries its note, such as "implied by the 41
 * percent change", directly under its value.
 */
function Points({ chart }: { chart: Extract<Chart, { kind: "points" }> }) {
  const W = 400;
  const H = 230;
  const pad = { l: 44, r: 112, t: 40, b: 30 };
  const plotW = W - pad.l - pad.r;
  const max = Math.max(...chart.points.map((p) => p.value));
  const tickStep = niceStep(max / 4);
  const yMax = Math.ceil((max * 1.08) / tickStep) * tickStep;
  const y = (v: number) => pad.t + (1 - v / yMax) * (H - pad.t - pad.b);
  const xs = [pad.l + plotW * 0.25, pad.l + plotW * 0.75];
  const dimX = W - pad.r + 18;
  const ticks: number[] = [];
  for (let t = 0; t <= yMax + 1e-9; t += tickStep) ticks.push(t);
  const [a, b] = chart.points as [
    (typeof chart.points)[number],
    (typeof chart.points)[number],
  ];
  const yA = y(a.value);
  const yB = y(b.value);
  const top = Math.min(yA, yB);
  const bottom = Math.max(yA, yB);
  const words = chart.bracket.split(" ");
  // "about +50 percent" sets as two lines, "about" over "+50 percent".
  const bracketLines =
    words.length > 2
      ? [words.slice(0, -2).join(" "), words.slice(-2).join(" ")]
      : [chart.bracket];
  const desc = chart.points
    .map(
      (p) =>
        `${p.date}: ${p.display}${p.computed && p.note ? `, ${p.note}` : ""}`,
    )
    .join("; ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" className="h-auto w-full">
      <title>{chart.title}</title>
      <desc>{`${desc}. Change: ${chart.bracket}.`}</desc>
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={y(t)}
            y2={y(t)}
            stroke={DIVIDER}
            strokeWidth={t === 0 ? 1.25 : 0.75}
          />
          <text
            x={pad.l - 6}
            y={y(t) + 4}
            fontSize={11}
            fill={MUTED}
            textAnchor="end"
          >
            {fmt(t)}
          </text>
        </g>
      ))}
      {chart.points.map((p, i) => {
        const cx = xs[i] ?? 0;
        const cy = y(p.value);
        return (
          <g key={p.date}>
            {/* extension line to the dimension */}
            <line
              x1={cx + 7}
              x2={dimX + 6}
              y1={cy}
              y2={cy}
              stroke={MUTED}
              strokeWidth={0.75}
              strokeDasharray="3 3"
            />
            <circle
              cx={cx}
              cy={cy}
              r={5}
              fill={p.computed ? "#ffffff" : i === 1 ? ACCENT : INK}
              stroke={INK}
              strokeWidth={1.5}
              strokeDasharray={p.computed ? "2 1.5" : undefined}
            />
            <text
              x={cx}
              y={cy - 11}
              fontSize={12}
              fontWeight={600}
              fill={INK}
              textAnchor="middle"
            >
              {p.display}
            </text>
            {p.computed && p.note ? (
              // Under the point, where the plot is empty, large enough to read on a phone.
              <text
                x={cx - 8}
                y={cy + 20}
                fontSize={11}
                fill={INK}
                textAnchor="start"
              >
                <tspan fontWeight={600}>Computed: </tspan>
                {p.note}
              </text>
            ) : null}
            <text
              x={cx}
              y={H - 9}
              fontSize={11}
              fill={MUTED}
              textAnchor="middle"
            >
              {p.date}
            </text>
          </g>
        );
      })}
      {/* dimension line with arrowheads, and the change written beside it */}
      <line
        x1={dimX}
        x2={dimX}
        y1={top}
        y2={bottom}
        stroke={INK}
        strokeWidth={1}
      />
      <path
        d={`M${dimX - 3.5},${top + 6} L${dimX},${top} L${dimX + 3.5},${top + 6}`}
        fill="none"
        stroke={INK}
        strokeWidth={1}
      />
      <path
        d={`M${dimX - 3.5},${bottom - 6} L${dimX},${bottom} L${dimX + 3.5},${bottom - 6}`}
        fill="none"
        stroke={INK}
        strokeWidth={1}
      />
      <text
        x={dimX + 9}
        y={(top + bottom) / 2 - (bracketLines.length - 1) * 7 + 4}
        fontSize={12}
        fontWeight={600}
        fill={INK}
      >
        {bracketLines.map((line, i) => (
          <tspan key={line} x={dimX + 9} dy={i === 0 ? 0 : 15}>
            {line}
          </tspan>
        ))}
      </text>
    </svg>
  );
}

export function SeriesChart({ chart }: { chart: Chart }) {
  return (
    <figure className="rounded-lg border border-divider p-sm sm:p-md print:break-inside-avoid">
      <div className="flex flex-wrap items-center gap-x-sm gap-y-2xs">
        <EvidenceLabel label="BENCHMARK" />
        <h3 className="font-semibold text-text">{chart.title}</h3>
      </div>
      <p className="mt-3xs text-xs text-text-muted">{chart.unit}</p>
      {/* Capped and centred in a single column, so the type stays near its
          drawn size on a tablet; full width in a desktop half column. */}
      <div className="mx-auto mt-sm max-w-(--container-card) lg:max-w-none">
        {chart.kind === "bars" ? (
          <Bars chart={chart} />
        ) : chart.kind === "points" ? (
          <Points chart={chart} />
        ) : (
          <Line chart={chart} />
        )}
      </div>
      <figcaption>
        <p className="mt-sm text-sm text-text">
          <Labelled text={chart.callout} />
        </p>
        <p className="mt-2xs text-xs text-text-muted">{chart.source}</p>
      </figcaption>
    </figure>
  );
}
