import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "@/components/admin/ui";

type Tone = "brand" | "emerald" | "rose" | "amber";

const TONE_TILE: Record<Tone, string> = {
  brand: "text-brand-700",
  emerald: "text-emerald-600",
  rose: "text-rose-600",
  amber: "text-gold-600",
};

const TONE_DOT: Record<Tone, string> = {
  brand: "bg-brand-400",
  emerald: "bg-emerald-400",
  rose: "bg-rose-400",
  amber: "bg-gold-400",
};

type AuthScreenProps = {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  /** Extra classes for the icon, e.g. "animate-spin" for loading states. */
  iconClassName?: string;
  tone?: Tone;
  /** "admin" pages talk about the console; "account" pages (activation) are seen by students, parents and teachers. */
  audience?: "admin" | "account";
  /** Short status label shown in the header strip, e.g. "Secure sign-in". */
  eyebrow?: string;
  children?: ReactNode;
  footer?: ReactNode;
};

/**
 * Full-screen frame for pages outside the admin shell: sign-in, access denied,
 * account activation and "not found". One card: navy brand header, white body,
 * with the page icon sitting on the seam between the two.
 */
export default function AuthScreen({
  title,
  description,
  icon: Icon,
  iconClassName,
  tone = "brand",
  audience = "admin",
  eyebrow,
  children,
  footer,
}: AuthScreenProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-12">
      {/* quiet dot pattern, fading out toward the edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgb(16 24 40 / 0.10) 1px, transparent 0)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(60% 55% at 50% 45%, black, transparent 85%)",
          WebkitMaskImage: "radial-gradient(60% 55% at 50% 45%, black, transparent 85%)",
        }}
      />

      <div className="relative w-full max-w-[440px]">
        <div className="overflow-hidden rounded-[22px] bg-surface shadow-pop ring-1 ring-line">
          {/* Brand header */}
          <div className="relative overflow-hidden bg-brand-950 px-6 pb-14 pt-6 text-white sm:px-7">
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_100%_0%,rgba(59,95,219,0.55),transparent_65%),radial-gradient(50%_90%_at_0%_100%,rgba(244,190,74,0.14),transparent_70%)]" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
                backgroundSize: "26px 26px",
                maskImage: "linear-gradient(to left, black, transparent 80%)",
                WebkitMaskImage: "linear-gradient(to left, black, transparent 80%)",
              }}
            />
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/80 to-transparent" />

            <div className="relative flex items-center justify-between gap-4">
              <span className="flex items-center gap-3">
                <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 font-display text-lg font-extrabold text-gold-400 ring-1 ring-inset ring-white/15">
                  A
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-brand-950 bg-gold-400" />
                </span>
                <span className="leading-tight">
                  <span className="block font-display text-[15px] font-bold tracking-tight">Acharya</span>
                  <span className="block whitespace-nowrap text-[10.5px] font-medium uppercase tracking-[0.16em] text-brand-200">
                    {audience === "admin" ? "Admin Console" : "Educational Services"}
                  </span>
                </span>
              </span>
              {eyebrow && (
                <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-brand-100 ring-1 ring-inset ring-white/15">
                  <span className={cx("h-1.5 w-1.5 rounded-full", TONE_DOT[tone])} />
                  {eyebrow}
                </span>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="relative px-6 pb-7 sm:px-7">
            {Icon ? (
              <span className={cx("-mt-8 mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface shadow-card-hover ring-1 ring-line", TONE_TILE[tone])}>
                <Icon className={cx("h-7 w-7", iconClassName)} strokeWidth={1.75} />
              </span>
            ) : (
              <div className="h-7" />
            )}
            <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">{title}</h1>
            {description && <div className="mt-2 text-[15px] leading-relaxed text-muted">{description}</div>}

            {children && <div className="mt-7">{children}</div>}

            {footer && <div className="mt-6 border-t border-line pt-5 text-xs leading-relaxed text-subtle">{footer}</div>}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-subtle">© {new Date().getFullYear()} Acharya Educational Services</p>
      </div>
    </div>
  );
}
