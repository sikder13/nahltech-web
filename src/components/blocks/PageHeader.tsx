/**
 * Top of every hub and utility page: the h1, the intro, and the ornamental
 * gold rule between them.
 *
 * `intro` accepts an array because the services hub leads with two
 * paragraphs. Every other page passes a single string and renders exactly as
 * it did — the alternative was a second header component whose only
 * difference was a `<p>`.
 */
export function PageHeader({
  title,
  intro,
  eyebrow,
}: {
  title: string;
  intro?: string | readonly string[];
  eyebrow?: string;
}) {
  const paragraphs =
    intro === undefined ? [] : Array.isArray(intro) ? intro : [intro];
  return (
    <div className="mx-auto max-w-(--container-page) px-sm pt-2xl pb-xl">
      {eyebrow ? (
        <p className="text-sm font-semibold text-text-muted">{eyebrow}</p>
      ) : null}
      <h1 className="mt-2xs max-w-prose text-section text-balance text-text">
        {title}
      </h1>
      <span className="mt-md heading-rule" aria-hidden="true" />
      {paragraphs.map((paragraph, index) => (
        <p
          key={paragraph.slice(0, 40)}
          /* The first sits under the rule; the rest space off each other. */
          className={`max-w-prose text-lg text-text-muted ${index === 0 ? "mt-md" : "mt-sm"}`}
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}
