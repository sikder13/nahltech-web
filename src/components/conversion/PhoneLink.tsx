import { Icon } from "@/components/ui/Icon";

/**
 * Click-to-call link. The visible number is the label; the tel: href is the
 * machine-readable form and must stay in sync with the NAP in lib/routes.ts.
 */
export function PhoneLink({
  label,
  href,
  className = "",
}: {
  label: string;
  href: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-2xs text-sm font-medium text-text link-accent ${className}`.trim()}
    >
      <Icon name="phone" className="size-4" />
      {label}
    </a>
  );
}
