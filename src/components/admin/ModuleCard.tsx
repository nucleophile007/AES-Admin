import Link from "next/link";
import { ArrowUpRight, Download, GripVertical } from "lucide-react";
import type { AdminModule, ModuleTone } from "@/lib/adminNavigation";

/** Literal class strings so Tailwind can see them. */
export const TONE_STYLES: Record<ModuleTone, { tile: string; dot: string; hoverBorder: string }> = {
  brand: {
    tile: "bg-brand-50 text-brand-700 ring-brand-100",
    dot: "bg-brand-500",
    hoverBorder: "hover:border-brand-200",
  },
  emerald: {
    tile: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    dot: "bg-emerald-500",
    hoverBorder: "hover:border-emerald-200",
  },
  violet: {
    tile: "bg-violet-50 text-violet-700 ring-violet-100",
    dot: "bg-violet-500",
    hoverBorder: "hover:border-violet-200",
  },
  amber: {
    tile: "bg-gold-50 text-gold-700 ring-gold-100",
    dot: "bg-gold-500",
    hoverBorder: "hover:border-gold-200",
  },
  slate: {
    tile: "bg-slate-50 text-slate-700 ring-slate-200",
    dot: "bg-slate-500",
    hoverBorder: "hover:border-slate-300",
  },
};

export type ModuleBadge = { count: number; label: string };

type ModuleCardProps = {
  module: AdminModule;
  tone: ModuleTone;
  badge?: ModuleBadge;
  /** Customize mode: render as a non-clickable, draggable tile. */
  editing?: boolean;
  /** The floating copy that follows the pointer while dragging. */
  overlay?: boolean;
};

export default function ModuleCard({ module, tone, badge, editing, overlay }: ModuleCardProps) {
  const styles = TONE_STYLES[tone];
  const Icon = module.icon;
  const showBadge = badge && badge.count > 0;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${styles.tile}`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </span>

        {editing ? (
          <span className="flex items-center gap-2">
            {showBadge && (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-100">
                {badge.count}
              </span>
            )}
            <GripVertical className="h-4 w-4 text-subtle transition-colors group-hover:text-ink" />
          </span>
        ) : showBadge ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-100">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            {badge.count} {badge.label}
          </span>
        ) : module.external ? (
          <Download className="h-4 w-4 text-subtle transition-colors group-hover:text-ink" />
        ) : (
          <ArrowUpRight className="h-4 w-4 text-subtle transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
        )}
      </div>

      <h3 className="mt-4 text-[15px] font-semibold leading-snug text-ink">{module.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{module.description}</p>

      <div className="mt-auto flex items-center gap-2 pt-5">
        <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
        <span className="text-xs font-medium text-muted">{module.tag}</span>
      </div>
    </>
  );

  if (editing) {
    return (
      <div
        className={`group relative flex h-full select-none flex-col rounded-card border bg-surface p-5 transition-[border-color,box-shadow] duration-200 ${
          overlay
            ? "rotate-[1.5deg] cursor-grabbing border-brand-300 shadow-pop ring-4 ring-brand-100/70"
            : "cursor-grab border-line shadow-card hover:border-brand-200 hover:shadow-card-hover"
        }`}
      >
        {content}
      </div>
    );
  }

  const className = `group relative flex h-full flex-col rounded-card border border-line bg-surface p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover ${styles.hoverBorder}`;

  if (module.external) {
    return (
      <a href={module.href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={module.href} className={className}>
      {content}
    </Link>
  );
}
