"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft, ChevronRight, type LucideIcon } from "lucide-react";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { TONE_STYLES } from "@/components/admin/ModuleCard";
import { ADMIN_MODULE_GROUPS, type ModuleTone } from "@/lib/adminNavigation";

type AdminPageShellProps = {
  /** Module id from adminNavigation; supplies the default title, icon, colour and breadcrumb. */
  moduleId: string;
  title?: string;
  description?: ReactNode;
  icon?: LucideIcon;
  /** Buttons shown on the right of the page header. */
  actions?: ReactNode;
  /** For sub-pages: the parent page, shown as an extra breadcrumb step (e.g. Research › Upload). */
  parent?: { label: string; href: string };
  children: ReactNode;
};

function lookup(moduleId: string) {
  for (const group of ADMIN_MODULE_GROUPS) {
    const item = group.modules.find((m) => m.id === moduleId);
    if (item) return { module: item, group };
  }
  return null;
}

/**
 * Standard frame for every admin page: the dashboard's top bar, a breadcrumb
 * back to the dashboard and a page header that matches the module's card.
 */
export default function AdminPageShell({ moduleId, title, description, icon, actions, parent, children }: AdminPageShellProps) {
  const { data: session } = useSession();
  const found = lookup(moduleId);
  const Icon = icon ?? found?.module.icon;
  const tone: ModuleTone = found?.group.tone ?? "brand";

  return (
    <div className="min-h-screen bg-canvas">
      <AdminTopBar name={session?.user?.name} email={session?.user?.email} image={session?.user?.image} />

      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pt-6 text-sm">
          <Link href="/" className="inline-flex items-center gap-1.5 font-medium text-muted transition hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          {found && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-subtle" />
              <span className="text-subtle">{found.group.title}</span>
            </>
          )}
          {parent && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-subtle" />
              <Link href={parent.href} className="font-medium text-muted transition hover:text-ink">
                {parent.label}
              </Link>
            </>
          )}
        </nav>

        <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {Icon && (
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${TONE_STYLES[tone].tile}`}
              >
                <Icon className="h-6 w-6" strokeWidth={1.8} />
              </span>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">{title ?? found?.module.title}</h1>
              <p className="mt-0.5 text-sm text-muted">{description ?? found?.module.description}</p>
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>

        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
