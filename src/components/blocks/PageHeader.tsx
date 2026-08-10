/**
 * Top of every hub and utility page: the h1, a single intro line, and the
 * ornamental gold rule between them.
 */
export function PageHeader({
  title,
  intro,
  eyebrow,
}: {
  title: string;
  intro?: string;
  eyebrow?: string;
}) {
  return (
    <div className="mx-auto max-w-(--container-page) px-sm pt-2xl pb-xl">
      {eyebrow ? (
        <p className="text-sm font-semibold text-text-muted">{eyebrow}</p>
      ) : null}
      <h1 className="mt-2xs max-w-prose text-4xl font-bold tracking-tight text-balance text-text">
        {title}
      </h1>
      <span className="mt-md heading-rule" aria-hidden="true" />
      {intro ? (
        <p className="mt-md max-w-prose text-lg text-text-muted">{intro}</p>
      ) : null}
    </div>
  );
}
