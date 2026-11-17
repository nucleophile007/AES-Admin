import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: number | null;
  hint: string;
  href: string;
  icon: LucideIcon;
  /** Highlights the card when something is waiting on the admin. */
  attention?: boolean;
};

const numberFormat = new Intl.NumberFormat("en-US");

export default function StatCard({ label, value, hint, href, icon: Icon, attention }: StatCardProps) {
  const needsAction = attention && typeof value === "number" && value > 0;

  return (
    <Link
      href={href}
      className="group flex items-start justify-between gap-4 rounded-card border border-line bg-surface p-5 shadow-card transition-all duration-200 hover:border-line-strong hover:shadow-card-hover"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="mt-2 font-display text-3xl font-bold tracking-tight text-ink tabular-nums">
          {value === null ? "—" : numberFormat.format(value)}
        </p>
        <p className={`mt-1 text-xs font-medium ${needsAction ? "text-rose-600" : "text-subtle"}`}>
          {value === null ? "Unavailable right now" : hint}
        </p>
      </div>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset transition-colors ${
          needsAction
            ? "bg-rose-50 text-rose-600 ring-rose-100"
            : "bg-surface-muted text-ink-soft ring-line group-hover:bg-brand-50 group-hover:text-brand-700 group-hover:ring-brand-100"
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.9} />
      </span>
    </Link>
  );
}
