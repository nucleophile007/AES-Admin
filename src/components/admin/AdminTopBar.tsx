"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

type AdminTopBarProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function initials(name?: string | null, email?: string | null) {
  const source = (name || email || "A").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function AdminTopBar({ name, email, image }: AdminTopBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-brand-900 font-display text-base font-extrabold text-gold-400 shadow-card">
            A
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-gold-400" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-[15px] font-bold tracking-tight text-ink">Acharya</span>
            <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Admin Console</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-line bg-surface-muted px-3 py-1.5 text-xs font-medium text-ink-soft md:inline-flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            All systems online
          </span>

          <div className="flex items-center gap-3 border-l border-line pl-3">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-surface" referrerPolicy="no-referrer" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
                {initials(name, email)}
              </span>
            )}
            <span className="hidden max-w-[200px] leading-tight sm:block">
              <span className="block truncate text-sm font-semibold text-ink">{name || "Admin"}</span>
              {email && <span className="block truncate text-xs text-muted">{email}</span>}
            </span>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-xs font-medium text-ink-soft shadow-card transition hover:bg-canvas hover:text-ink"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
