/**
 * Bot trap shared by the contact form, the newsletter form and the chat
 * widget's consent form.
 *
 * NOT the `website` column on the `leads` table. The names are similar on
 * purpose — a bot scanning for a plausible field finds one — but this value is
 * never stored anywhere. Do not "fix" the mismatch by wiring it to `website`.
 *
 * Hidden from assistive technology with `aria-hidden` and removed from the tab
 * order with `tabIndex={-1}`, so a keyboard or screen-reader user can neither
 * reach it nor be told it exists. It is positioned off-screen rather than
 * `display: none`, because some bots skip fields that are outright hidden.
 */
export function Honeypot() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-[-9999px] h-px w-px overflow-hidden"
    >
      <input
        type="text"
        name="website_url"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  );
}
