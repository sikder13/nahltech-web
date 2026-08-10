import type { ReactNode } from "react";

const control =
  "w-full rounded-md border bg-bg px-xs py-2xs text-sm text-text " +
  "placeholder:text-text-muted focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 focus-visible:outline-focus";

/**
 * Wraps a control with its label and error text.
 *
 * The label is a real <label for>, the error carries `role="alert"` so it is
 * announced when it appears, and the control points at the error through
 * aria-describedby. Errors are never signalled by colour alone — the message
 * is text.
 */
export function Field({
  id,
  label,
  error,
  required = false,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-text">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-text-muted">
            {" *"}
          </span>
        ) : null}
      </label>
      <div className="mt-3xs">{children}</div>
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-3xs text-sm font-medium text-text"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function inputClasses(hasError: boolean): string {
  return `${control} ${hasError ? "border-text" : "border-border"}`;
}
