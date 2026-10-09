import type { LetterMorning } from "@/lib/letter-pages/schema";

/**
 * A static picture of what the owner would see on a working morning: a text
 * thread, a board, a checklist or a table, drawn with the page's own cards.
 *
 * Every name in one is invented, and the label under it says so. Nothing
 * here is interactive and nothing is fetched.
 */

/** A check mark drawn with two borders. No icon, no image. */
export function CheckMark() {
  return (
    <span
      aria-hidden="true"
      className="mt-[0.3em] mr-[0.15em] ml-[0.25em] inline-block h-[0.8em] w-[0.42em] shrink-0 rotate-45 border-r-2 border-b-2 border-text"
    />
  );
}

/** A level bar: the item that is holding things up. */
function HoldMark() {
  return (
    <span
      aria-hidden="true"
      className="mt-[0.62em] inline-block h-[3px] w-[0.82em] shrink-0 bg-text"
    />
  );
}

const card = "rounded-lg border border-border bg-bg";

function Thread({
  morning,
}: {
  morning: Extract<LetterMorning, { kind: "thread" }>;
}) {
  return (
    <div className={`${card} mx-auto max-w-[26rem] p-sm`}>
      <ol className="flex flex-col gap-sm">
        {morning.bubbles.map((bubble) => {
          const dark = bubble.tone === "dark";
          return (
            <li
              key={bubble.text}
              className={`flex max-w-[86%] flex-col ${dark ? "items-end self-end" : "items-start self-start"}`}
            >
              <p
                className={`rounded-2xl px-sm py-xs text-base ${dark ? "bg-text text-bg" : "bg-surface text-text"}`}
              >
                {bubble.text}
              </p>
              <p className="mt-3xs px-2xs text-xs text-text-muted">
                {bubble.meta}
              </p>
            </li>
          );
        })}
      </ol>
      <p className="mt-sm text-center text-sm text-text-muted">
        {morning.caption}
      </p>
    </div>
  );
}

function Board({
  morning,
}: {
  morning: Extract<LetterMorning, { kind: "board" }>;
}) {
  return (
    <div className={`${card} p-sm`}>
      <div className="grid gap-sm sm:grid-cols-2 lg:grid-cols-4">
        {morning.columns.map((column, index) => (
          <div key={column}>
            <p className="border-b border-divider pb-2xs caption">{column}</p>
            <ul className="mt-xs space-y-xs">
              {morning.cards
                .filter((item) => item.column === index)
                .map((item) => (
                  <li
                    key={item.text}
                    className="rounded-md border border-border p-xs text-sm text-text"
                  >
                    {item.text}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-sm border-t border-divider pt-xs text-sm font-semibold text-text">
        {morning.footer}
      </p>
    </div>
  );
}

function Checklist({
  morning,
}: {
  morning: Extract<LetterMorning, { kind: "checklist" }>;
}) {
  return (
    <div className={`${card} mx-auto max-w-[30rem] p-sm`}>
      <p className="font-semibold text-text">{morning.title}</p>
      <ul className="mt-xs">
        {morning.rows.map((row) => (
          <li
            key={row.text}
            className={`flex items-start gap-xs border-t border-divider py-xs text-base text-text ${row.hold ? "font-semibold" : ""}`}
          >
            {row.hold ? <HoldMark /> : <CheckMark />}
            {row.text}
          </li>
        ))}
      </ul>
      <p className="border-t-2 border-text pt-xs text-base font-semibold text-text">
        {morning.footer}
      </p>
    </div>
  );
}

function Table({
  morning,
}: {
  morning: Extract<LetterMorning, { kind: "table" }>;
}) {
  return (
    <div className={`${card} p-sm`}>
      <table className="w-full text-start text-sm text-text">
        <caption className="pb-xs text-start text-base font-semibold text-text">
          {morning.title}
        </caption>
        {/* On a phone the header row is read out by each cell instead. */}
        <thead className="sr-only sm:not-sr-only">
          <tr>
            {morning.columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="border-b border-text py-2xs pe-xs text-start caption"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {morning.rows.map((row) => (
            <tr
              key={row.join("|")}
              className="block border-t border-divider py-xs sm:table-row sm:py-0"
            >
              {row.map((cell, index) => (
                <td
                  key={morning.columns[index]}
                  className={`block sm:table-cell sm:border-t sm:border-divider sm:py-2xs sm:pe-xs sm:align-top ${index === 0 ? "font-semibold" : ""}`}
                >
                  <span className="text-text-muted sm:hidden">
                    {morning.columns[index]}:{" "}
                  </span>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-xs border-t-2 border-text pt-xs text-base font-semibold text-text">
        {morning.footer}
      </p>
    </div>
  );
}

export function LetterIllustration({
  morning,
  label,
}: {
  morning: LetterMorning;
  label: string;
}) {
  return (
    <figure className="mt-lg">
      {morning.kind === "thread" ? <Thread morning={morning} /> : null}
      {morning.kind === "board" ? <Board morning={morning} /> : null}
      {morning.kind === "checklist" ? <Checklist morning={morning} /> : null}
      {morning.kind === "table" ? <Table morning={morning} /> : null}
      <figcaption className="mt-xs text-sm text-text-muted">{label}</figcaption>
    </figure>
  );
}
