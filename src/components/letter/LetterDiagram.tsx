import type { LetterDiagram as Diagram } from "@/lib/letter-pages/schema";

/**
 * A handoff drawn as boxes in order, with the failure point marked.
 *
 * Two drawings of the same steps: a single column for phones, where each box
 * is as wide as the screen and the type renders at its own size, and three
 * across for desktop. Both are plain SVG in the page's own colours. Screen
 * readers get neither; they get the ordered list underneath, which says the
 * same thing in words and names the failure point.
 *
 * SVG text does not wrap, so labels are broken into lines here by a
 * character budget set safely under what each box holds.
 */

function wrap(label: string, budget: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of label.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > budget && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

type Layout = {
  width: number;
  columns: number;
  gapX: number;
  gapY: number;
  pad: number;
  font: number;
  lead: number;
  budget: number;
};

// Each width is the room inside the card at that size, so the drawing is
// shown at its own scale and the type at its own size: 375px less the page
// gutters and the card's padding on a phone, the reading column less the
// card's padding on desktop.
const PHONE: Layout = {
  width: 309,
  columns: 1,
  gapX: 0,
  gapY: 26,
  pad: 13,
  font: 15,
  lead: 20,
  budget: 31,
};

const DESKTOP: Layout = {
  width: 686,
  columns: 3,
  gapX: 40,
  gapY: 34,
  pad: 13,
  font: 14,
  lead: 19,
  budget: 22,
};

const TAG = 19;
const HEAD = 7;

function Drawing({
  diagram,
  failLabel,
  layout,
  className,
}: {
  diagram: Diagram;
  failLabel: string;
  layout: Layout;
  className: string;
}) {
  const { width, columns, gapX, gapY, pad, font, lead, budget } = layout;
  const boxWidth = (width - gapX * (columns - 1)) / columns;

  const boxes = diagram.steps.map((step, index) => {
    const lines = wrap(step.label, budget);
    return {
      ...step,
      lines,
      column: index % columns,
      row: Math.floor(index / columns),
      height: pad * 2 + lines.length * lead + (step.fail ? TAG : 0),
    };
  });

  const rowCount = Math.ceil(boxes.length / columns);
  const rowHeights = Array.from({ length: rowCount }, (_, row) =>
    Math.max(...boxes.filter((b) => b.row === row).map((b) => b.height)),
  );
  const rowTops = rowHeights.map((_, row) =>
    rowHeights.slice(0, row).reduce((sum, h) => sum + h + gapY, 0),
  );
  const height = rowTops[rowCount - 1] + rowHeights[rowCount - 1];

  const placed = boxes.map((box) => ({
    ...box,
    x: box.column * (boxWidth + gapX),
    y: rowTops[box.row],
    // Every box in a row is as tall as the tallest, so arrows meet level.
    h: rowHeights[box.row],
  }));

  const stroke = "var(--color-text)";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {placed.slice(0, -1).map((from, index) => {
        const to = placed[index + 1];
        if (to.row === from.row) {
          const y = from.y + from.h / 2;
          const x1 = from.x + boxWidth;
          const x2 = to.x;
          return (
            <g key={`a${index}`}>
              <line
                x1={x1}
                y1={y}
                x2={x2 - HEAD}
                y2={y}
                stroke={stroke}
                strokeWidth={1.5}
              />
              <polygon
                points={`${x2},${y} ${x2 - HEAD},${y - 4.5} ${x2 - HEAD},${y + 4.5}`}
                fill={stroke}
              />
            </g>
          );
        }
        // Down to the next row: out of the bottom, across, into the top.
        const x1 = from.x + boxWidth / 2;
        const x2 = to.x + boxWidth / 2;
        const y1 = from.y + from.h;
        const y2 = to.y;
        const mid = y1 + (y2 - y1) / 2;
        return (
          <g key={`a${index}`}>
            <polyline
              points={`${x1},${y1} ${x1},${mid} ${x2},${mid} ${x2},${y2 - HEAD}`}
              fill="none"
              stroke={stroke}
              strokeWidth={1.5}
            />
            <polygon
              points={`${x2},${y2} ${x2 - 4.5},${y2 - HEAD} ${x2 + 4.5},${y2 - HEAD}`}
              fill={stroke}
            />
          </g>
        );
      })}

      {placed.map((box) => (
        <g key={box.label} data-step="">
          <rect
            x={box.fail ? box.x + 1.5 : box.x + 0.75}
            y={box.fail ? box.y + 1.5 : box.y + 0.75}
            width={boxWidth - (box.fail ? 3 : 1.5)}
            height={box.h - (box.fail ? 3 : 1.5)}
            rx={8}
            fill={box.fail ? "var(--color-surface)" : "var(--color-bg)"}
            stroke={stroke}
            strokeWidth={box.fail ? 3 : 1.5}
          />
          {box.fail ? (
            <text
              x={box.x + pad}
              y={box.y + pad + 9}
              fontSize={12}
              fontWeight={600}
              letterSpacing="0.08em"
              fill={stroke}
            >
              {failLabel.toUpperCase()}
            </text>
          ) : null}
          <text
            x={box.x + pad}
            y={box.y + pad + (box.fail ? TAG : 0)}
            fontSize={font}
            fontWeight={box.fail ? 600 : 400}
            fill={stroke}
          >
            {box.lines.map((line, index) => (
              <tspan key={line} x={box.x + pad} dy={index === 0 ? font : lead}>
                {line}
              </tspan>
            ))}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function LetterDiagram({
  diagram,
  failLabel,
}: {
  diagram: Diagram;
  failLabel: string;
}) {
  return (
    <figure className="mt-lg rounded-lg border border-border p-sm lg:p-md">
      <figcaption className="caption">{diagram.title}</figcaption>
      <Drawing
        diagram={diagram}
        failLabel={failLabel}
        layout={PHONE}
        className="mt-sm h-auto w-full max-w-[26rem] lg:hidden"
      />
      <Drawing
        diagram={diagram}
        failLabel={failLabel}
        layout={DESKTOP}
        className="mt-sm hidden h-auto w-full lg:block"
      />
      <ol className="sr-only">
        {diagram.steps.map((step) => (
          <li key={step.label}>
            {step.label}
            {step.fail ? ` (${failLabel})` : null}
          </li>
        ))}
      </ol>
    </figure>
  );
}
