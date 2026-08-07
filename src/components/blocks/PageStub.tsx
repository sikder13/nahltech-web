/**
 * Structural placeholder for a page whose copy has not been approved yet.
 *
 * Per CLAUDE.md rule 12 the layout ships before the words do: the heading is
 * real, everything else is an explicit marker. No invented claims, prices or
 * statistics reach a page through this component.
 */
export function PageStub({
  title,
  placeholder,
}: {
  title: string;
  placeholder: string;
}) {
  return (
    <div className="mx-auto max-w-(--container-page) px-sm py-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-balance text-text">
        {title}
      </h1>
      <p className="mt-md text-text-muted">{placeholder}</p>
    </div>
  );
}
