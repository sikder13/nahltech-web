/**
 * Emits a JSON-LD block.
 *
 * `application/ld+json` is a data block, not executable script, so the CSP's
 * script-src does not apply to it. The `<` escaping still matters: a `</script>`
 * sequence inside any string value would close the element early and let the
 * remainder of the payload be parsed as markup.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
