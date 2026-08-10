/**
 * Shown by a hub that has no children yet.
 *
 * A hub with nothing published renders this panel instead of an empty grid —
 * an empty grid reads as a broken page, and the internal-linking rules in
 * ARCH-1 §5 mean a hub must never look like a dead end.
 */
export function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface p-xl text-center">
      <p className="text-sm text-text-muted">{label}</p>
    </div>
  );
}
