import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

/**
 * Shared building blocks for admin pages, styled with the tokens in globals.css
 * so every page matches the dashboard. Prefer these over one-off Tailwind.
 */

export const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

/* ---------- Buttons ---------- */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "success" | "danger" | "dangerOutline";
/** `icon` / `iconSm` are square, icon-only buttons (edit, delete, reorder…). */
export type ButtonSize = "sm" | "md" | "icon" | "iconSm";

// Icons never shrink inside buttons; each size sets one icon size for every icon it contains.
const BUTTON_BASE =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 [&_svg]:shrink-0";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand-700 text-white shadow-card hover:bg-brand-800 focus-visible:ring-brand-100",
  secondary:
    "border border-line bg-surface text-ink-soft shadow-card hover:bg-canvas hover:text-ink focus-visible:ring-brand-100",
  ghost: "text-ink-soft hover:bg-canvas hover:text-ink focus-visible:ring-brand-100",
  success: "bg-emerald-600 text-white shadow-card hover:bg-emerald-700 focus-visible:ring-emerald-100",
  danger: "bg-rose-600 text-white shadow-card hover:bg-rose-700 focus-visible:ring-rose-100",
  dangerOutline:
    "border border-rose-200 bg-surface text-rose-700 shadow-card hover:border-rose-300 hover:bg-rose-50 focus-visible:ring-rose-100",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs [&_svg]:size-4",
  md: "h-10 px-4 text-sm [&_svg]:size-4",
  icon: "h-9 w-9 [&_svg]:size-[18px]",
  iconSm: "h-8 w-8 [&_svg]:size-4",
};

/** Class string for a button-looking element (works on <button>, <Link> and <a>). */
export const buttonClass = (variant: ButtonVariant = "secondary", size: ButtonSize = "md", extra?: string) =>
  cx(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], extra);

/* ---------- Form fields ---------- */

export const inputClass =
  "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100";

export const selectClass = cx(inputClass, "appearance-none pr-9");

/* ---------- Surfaces ---------- */

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-card border border-line bg-surface shadow-card", className)}>{children}</div>;
}

export function PanelHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ---------- Badges ---------- */

export type BadgeTone = "brand" | "emerald" | "amber" | "rose" | "violet" | "slate";

const BADGE_TONES: Record<BadgeTone, string> = {
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-gold-50 text-gold-700 ring-gold-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  slate: "bg-surface-muted text-ink-soft ring-line",
};

export function Badge({
  tone = "slate",
  icon: Icon,
  dot,
  children,
  className,
}: {
  tone?: BadgeTone;
  icon?: LucideIcon;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        BADGE_TONES[tone],
        className
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      {dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80" />}
      <span className="truncate">{children}</span>
    </span>
  );
}

/* ---------- Stats ---------- */

export function MiniStat({
  label,
  value,
  hint,
  icon: Icon,
  tone = "slate",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: LucideIcon;
  tone?: BadgeTone;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-card border border-line bg-surface p-4 shadow-card">
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink tabular-nums">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-subtle">{hint}</p>}
      </div>
      <span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset", BADGE_TONES[tone])}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
      </span>
    </div>
  );
}

/* ---------- Segmented filter ---------- */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; count?: number }>;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex h-10 shrink-0 items-center gap-1 rounded-lg border border-line bg-surface-muted p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cx(
              "inline-flex h-full items-center gap-1.5 rounded-md px-3 text-sm font-medium transition",
              active ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink"
            )}
          >
            {option.label}
            {typeof option.count === "number" && (
              <span className={cx("text-xs tabular-nums", active ? "text-muted" : "text-subtle")}>{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- States ---------- */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-subtle ring-1 ring-inset ring-line">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-sm text-muted">
      <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      {label}
    </div>
  );
}
