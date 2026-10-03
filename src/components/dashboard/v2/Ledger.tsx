import { Fragment } from "react";

import type { LedgerConfig } from "@/lib/dashboards/v2/schema";

/**
 * A figure cell: money, a count, a percentage, or a signed day count such as
 * "-1" (a case that shipped a day early). Figures never break across lines
 * and set their column flush right; words wrap.
 */
const FIGURE = /^-?[$\d.,%]+$/;

/**
 * One illustrative log card: a titled table with its label, an optional
 * closing total row, and the note that says the figures are invented.
 *
 * Word cells wrap and figures never break; a wide ledger tightens its phone
 * gutters (config dense) instead of scrolling sideways. Without the flag the
 * class strings are byte-identical to what shipped, which the Mursix golden
 * gate proves.
 */
export function Ledger({
  ledger,
  flagLabel,
}: {
  ledger: LedgerConfig;
  flagLabel: string;
}) {
  // Ledger column gutter below the sm breakpoint.
  const gap = ledger.dense ? "pe-3xs" : "pe-2xs";
  return (
    <figure
      className={
        ledger.tight
          ? "mt-lg rounded-lg border border-divider p-2xs pt-sm sm:p-md"
          : "mt-lg rounded-lg border border-divider p-md"
      }
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-sm gap-y-2xs">
        <h4 className="text-sm font-semibold text-text">{ledger.title}</h4>
        <span className="rounded-sm border border-dashed border-text px-[0.5em] py-[0.22em] text-[0.66rem] leading-none font-semibold tracking-[0.08em] text-text">
          {ledger.label}
        </span>
      </div>
      <div
        className="mt-sm overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label={ledger.title}
      >
        <table className="w-full border-collapse text-xs tabular-nums sm:text-sm">
          <thead>
            <tr className="border-b border-border text-start text-text">
              {ledger.columns.map((c, col) => (
                <th
                  key={c}
                  scope="col"
                  className={`py-2xs ${gap} font-semibold last:pe-0 sm:pe-sm ${ledger.rows.every((r) => FIGURE.test(r.cells[col] ?? "")) ? "text-end" : "text-start"}`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ledger.rows.map((row) => (
              <Fragment key={row.cells.join("|")}>
                <tr
                  className={`${row.flag ? "bg-surface font-semibold text-text" : "border-b border-divider text-text-muted"}`}
                >
                  {row.cells.map((cell, i) => (
                    <td
                      key={`${i}-${cell}`}
                      // Figures never break across lines; words may,
                      // so five columns still fit a 390px screen.
                      className={`py-2xs ${gap} last:pe-0 sm:pe-sm ${FIGURE.test(cell) ? "text-end whitespace-nowrap" : ""}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
                {row.flag ? (
                  /* The reason sits under its row, full width, so the
                   outlier is explained without a sideways scroll. */
                  <tr className="border-b border-divider bg-surface text-text">
                    <td
                      colSpan={row.cells.length}
                      className="pe-sm pb-2xs text-xs"
                    >
                      <span className="me-2xs rounded-sm bg-text px-[0.4em] py-[0.1em] text-[0.66rem] font-semibold tracking-[0.08em] text-bg">
                        {flagLabel}
                      </span>
                      {row.flag}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
          {ledger.total ? (
            <tfoot>
              <tr className="border-t border-border font-semibold text-text">
                <td
                  colSpan={
                    ledger.columns.length - (ledger.total.cells?.length ?? 1)
                  }
                  className={`py-2xs ${gap} last:pe-0 sm:pe-sm`}
                >
                  {ledger.total.label}
                </td>
                {ledger.total.cells ? (
                  ledger.total.cells.map((cell, i) => (
                    <td
                      key={i}
                      className={`py-2xs ${gap} text-end whitespace-nowrap last:pe-0 sm:pe-sm`}
                    >
                      {cell}
                    </td>
                  ))
                ) : (
                  <td
                    className={`py-2xs ${gap} text-end whitespace-nowrap last:pe-0 sm:pe-sm`}
                  >
                    {ledger.total.value}
                  </td>
                )}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
      <figcaption className="mt-sm text-xs text-text-muted">
        {ledger.note}
      </figcaption>
    </figure>
  );
}
