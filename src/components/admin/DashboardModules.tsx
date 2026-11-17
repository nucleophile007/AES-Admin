"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, LayoutGrid, Pencil, Plus, RotateCcw, Search, Trash2, X } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ADMIN_MODULE_GROUPS, type AdminModule, type ModuleTone } from "@/lib/adminNavigation";
import ModuleCard, { TONE_STYLES, type ModuleBadge } from "@/components/admin/ModuleCard";

/* ---------- Layout model ---------- */

type Section = {
  id: string;
  title: string;
  description?: string;
  tone: ModuleTone;
  /** Created by the admin (can be deleted). Built-in sections can only be renamed. */
  custom?: boolean;
  moduleIds: string[];
};

type DashboardState = {
  sections: Section[];
  collapsed: string[];
};

const MODULES_BY_ID = new Map<string, AdminModule>(
  ADMIN_MODULE_GROUPS.flatMap((g) => g.modules.map((m) => [m.id, m] as const))
);
/** Where each module lives by default. */
const DEFAULT_SECTION_OF = new Map<string, string>(
  ADMIN_MODULE_GROUPS.flatMap((g) => g.modules.map((m) => [m.id, g.id] as const))
);
const BUILT_IN = new Map(ADMIN_MODULE_GROUPS.map((g) => [g.id, g]));
const TOTAL_MODULES = MODULES_BY_ID.size;
const MAX_TITLE = 60;

const DEFAULT_STATE: DashboardState = {
  sections: ADMIN_MODULE_GROUPS.map((g) => ({
    id: g.id,
    title: g.title,
    description: g.description,
    tone: g.tone,
    moduleIds: g.modules.map((m) => m.id),
  })),
  collapsed: [],
};

const sameState = (a: DashboardState, b: DashboardState) => JSON.stringify(a) === JSON.stringify(b);

/** Put each module back in its default section (or the first one if that is gone). */
function placeInDefault(sections: Section[], moduleId: string): Section[] {
  const home = DEFAULT_SECTION_OF.get(moduleId);
  const targetId = sections.some((s) => s.id === home) ? home : sections[0]?.id;
  return sections.map((s) => (s.id === targetId ? { ...s, moduleIds: [...s.moduleIds, moduleId] } : s));
}

/**
 * Accept saved data only for things that still exist. Built-in sections that
 * are missing get added back, and modules added to the app later land in
 * their default section.
 */
function sanitizeState(saved: unknown): DashboardState {
  const raw = (saved && typeof saved === "object" ? saved : {}) as { sections?: unknown; collapsed?: unknown };
  const placed = new Set<string>();
  const seen = new Set<string>();
  let sections: Section[] = [];

  if (Array.isArray(raw.sections)) {
    for (const item of raw.sections) {
      if (!item || typeof item !== "object") continue;
      const s = item as Record<string, unknown>;
      const id = typeof s.id === "string" ? s.id : "";
      const builtIn = BUILT_IN.get(id);
      const isCustom = id.startsWith("custom-");
      if (!id || seen.has(id) || (!builtIn && !isCustom)) continue;
      seen.add(id);

      const title =
        typeof s.title === "string" && s.title.trim()
          ? s.title.trim().slice(0, MAX_TITLE)
          : builtIn?.title ?? "Untitled section";
      const moduleIds = (Array.isArray(s.moduleIds) ? s.moduleIds : []).filter(
        (m): m is string => typeof m === "string" && MODULES_BY_ID.has(m) && !placed.has(m) && (placed.add(m), true)
      );

      sections.push(
        builtIn
          ? { id, title, description: builtIn.description, tone: builtIn.tone, moduleIds }
          : { id, title, tone: "slate", custom: true, moduleIds }
      );
    }
  }

  for (const g of ADMIN_MODULE_GROUPS) {
    if (!seen.has(g.id)) sections.push({ id: g.id, title: g.title, description: g.description, tone: g.tone, moduleIds: [] });
  }
  for (const id of MODULES_BY_ID.keys()) {
    if (!placed.has(id)) sections = placeInDefault(sections, id);
  }

  const ids = new Set(sections.map((s) => s.id));
  const collapsed = Array.isArray(raw.collapsed)
    ? raw.collapsed.filter((c): c is string => typeof c === "string" && ids.has(c))
    : [];

  return { sections, collapsed };
}

/**
 * Prefer whatever is under the pointer (a card first, else the section it is in),
 * so wide or empty sections are easy to drop into. Keyboard drags have no pointer
 * and fall back to the closest corners.
 */
const collisionDetection: CollisionDetection = (args) => {
  const underPointer = pointerWithin(args);
  return underPointer.length > 0 ? underPointer : closestCorners(args);
};

function findSection(sections: Section[], id: string): string | undefined {
  if (sections.some((s) => s.id === id)) return id;
  return sections.find((s) => s.moduleIds.includes(id))?.id;
}

/* ---------- Draggable card ---------- */

function SortableModule({
  id,
  tone,
  badge,
  editing,
}: {
  id: string;
  tone: ModuleTone;
  badge?: ModuleBadge;
  editing: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !editing,
  });
  const item = MODULES_BY_ID.get(id)!;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`h-full ${editing ? "touch-none" : ""} ${isDragging ? "opacity-35" : ""}`}
      {...(editing ? { ...attributes, ...listeners, "aria-label": `Move ${item.title}` } : {})}
    >
      <ModuleCard module={item} tone={tone} badge={badge} editing={editing} />
    </div>
  );
}

/* ---------- Section pieces ---------- */

function SectionTitleInput({
  title,
  autoFocus,
  onCommit,
}: {
  title: string;
  autoFocus?: boolean;
  onCommit: (title: string) => void;
}) {
  const [draft, setDraft] = useState(title);
  useEffect(() => setDraft(title), [title]);

  const commit = () => {
    const next = draft.trim().slice(0, MAX_TITLE);
    if (next && next !== title) onCommit(next);
    else setDraft(title);
  };

  // The input sits on top of an invisible copy of its text, so it grows to fit exactly.
  const fieldText = "px-2 py-1 pr-7 text-sm font-semibold uppercase tracking-[0.08em]";

  return (
    <label className="group/title relative inline-grid min-w-0 max-w-[min(100%,26rem)] items-center">
      <span className="sr-only">Section name</span>
      <span aria-hidden className={`invisible col-start-1 row-start-1 overflow-hidden whitespace-pre border ${fieldText}`}>
        {draft || " "}
      </span>
      <input
        value={draft}
        autoFocus={autoFocus}
        maxLength={MAX_TITLE}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => autoFocus && e.currentTarget.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(title);
            requestAnimationFrame(() => (e.target as HTMLInputElement).blur());
          }
        }}
        className={`col-start-1 row-start-1 w-full min-w-[6rem] rounded-md border border-dashed border-line-strong !bg-surface text-ink-soft outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100 ${fieldText}`}
      />
      <Pencil className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-subtle group-focus-within/title:hidden" />
    </label>
  );
}

function SectionBlock({
  section,
  editing,
  collapsed,
  autoFocusTitle,
  count,
  onToggle,
  onRename,
  onDelete,
  children,
}: {
  section: Section;
  editing: boolean;
  collapsed: boolean;
  autoFocusTitle: boolean;
  count: number;
  onToggle: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  children: ReactNode;
}) {
  // The whole section accepts drops, so a collapsed section can still receive cards.
  const { setNodeRef, isOver } = useDroppable({ id: section.id, disabled: !editing });
  const tone = TONE_STYLES[section.tone];

  return (
    <section ref={setNodeRef} aria-labelledby={`group-${section.id}`} className="scroll-mt-24">
      <div className="mb-4 flex min-h-9 items-center gap-2.5 border-b border-line pb-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-controls={`group-body-${section.id}`}
          title={collapsed ? "Expand section" : "Collapse section"}
          className="-ml-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-subtle transition hover:bg-surface hover:text-ink"
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`} />
        </button>
        <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />

        <h3 id={`group-${section.id}`} className={editing ? "sr-only" : "text-sm font-semibold uppercase tracking-[0.08em] text-ink-soft"}>
          {section.title}
        </h3>
        {editing && <SectionTitleInput title={section.title} autoFocus={autoFocusTitle} onCommit={onRename} />}

        {/* The built-in subtitle only describes the original name, so hide it once renamed. */}
        {!editing && section.description && BUILT_IN.get(section.id)?.title === section.title && (
          <p className="hidden truncate text-sm text-muted md:block">{section.description}</p>
        )}
        {editing && section.custom && <span className="hidden text-xs text-subtle sm:inline">Custom section</span>}

        <span className="ml-auto shrink-0 text-xs font-medium text-subtle">{count}</span>
        {editing && section.custom && (
          <button
            type="button"
            onClick={onDelete}
            title={count ? "Delete section (its cards go back to their original sections)" : "Delete section"}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-subtle transition hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete section {section.title}</span>
          </button>
        )}
      </div>

      <div id={`group-body-${section.id}`}>
        {collapsed ? (
          <button
            type="button"
            onClick={onToggle}
            className={`flex w-full items-center gap-3 rounded-card border border-dashed px-4 py-3 text-left text-sm transition ${
              editing && isOver
                ? "border-brand-300 bg-brand-50/60 text-brand-700"
                : "border-line-strong bg-surface/60 text-muted hover:border-line-strong hover:bg-surface hover:text-ink"
            }`}
          >
            <span className="flex -space-x-1.5">
              {section.moduleIds.slice(0, 5).map((id) => {
                const Icon = MODULES_BY_ID.get(id)!.icon;
                return (
                  <span key={id} className={`flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-canvas ${tone.tile}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                );
              })}
            </span>
            <span>
              {count === 0 ? "Empty section" : `${count} ${count === 1 ? "module" : "modules"} hidden`}
              <span className="text-subtle"> · {editing && isOver ? "Drop to add here" : "Show"}</span>
            </span>
          </button>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function SectionGrid({ editing, isEmpty, children }: { editing: boolean; isEmpty: boolean; children: ReactNode }) {
  return (
    <div
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
        editing ? "rounded-card border border-dashed border-line-strong bg-surface-muted/70 p-3" : ""
      }`}
    >
      {children}
      {editing && isEmpty && (
        <div className="col-span-full flex min-h-[148px] flex-col items-center justify-center gap-1 rounded-lg text-sm text-muted">
          <span>Drag cards here</span>
          <span className="text-xs text-subtle">from any other section</span>
        </div>
      )}
    </div>
  );
}

/* ---------- Dashboard grid ---------- */

type DashboardModulesProps = {
  /** Keyed by module id, e.g. { "transaction-receipts": { count: 3, label: "pending" } } */
  badges?: Record<string, ModuleBadge>;
  /** localStorage key for this admin's arrangement. */
  storageKey: string;
};

export default function DashboardModules({ badges = {}, storageKey }: DashboardModulesProps) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<DashboardState>(DEFAULT_STATE);
  const [editing, setEditing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [newSectionId, setNewSectionId] = useState<string | null>(null);
  const snapshotRef = useRef<DashboardState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load this admin's saved arrangement (browser only).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setState(sanitizeState(JSON.parse(raw)));
    } catch {
      /* storage unavailable or corrupt: keep the default */
    }
    setLoaded(true);
  }, [storageKey]);

  // Persist after every change (not mid-drag, not before the saved copy is loaded).
  useEffect(() => {
    if (!loaded || activeId) return;
    try {
      if (sameState(state, DEFAULT_STATE)) window.localStorage.removeItem(storageKey);
      else window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, activeId, loaded, storageKey]);

  // "/" focuses the search, Escape leaves customize mode.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (typing) return;
      if (event.key === "/" && !editing) {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === "Escape" && editing && !activeId) setEditing(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const collapsedSet = useMemo(() => new Set(state.collapsed), [state.collapsed]);
  const q = editing ? "" : query.trim().toLowerCase();

  const visible = useMemo(() => {
    return state.sections
      .map((section) => {
        const ids = q
          ? section.moduleIds.filter((id) => {
              const m = MODULES_BY_ID.get(id)!;
              return [m.title, m.description, m.tag, section.title, ...(m.keywords ?? [])]
                .join(" ")
                .toLowerCase()
                .includes(q);
            })
          : section.moduleIds;
        return { section, ids };
      })
      .filter(({ ids }) => editing || ids.length > 0);
  }, [state.sections, q, editing]);

  const customized = !sameState(state, DEFAULT_STATE);
  const activeSection = activeId ? state.sections.find((s) => s.moduleIds.includes(activeId)) : undefined;
  const allCollapsed = state.sections.length > 0 && state.sections.every((s) => collapsedSet.has(s.id));

  /* ----- section actions ----- */

  const toggleSection = (id: string) =>
    setState((prev) => ({
      ...prev,
      collapsed: prev.collapsed.includes(id) ? prev.collapsed.filter((c) => c !== id) : [...prev.collapsed, id],
    }));

  const toggleAll = () =>
    setState((prev) => ({ ...prev, collapsed: allCollapsed ? [] : prev.sections.map((s) => s.id) }));

  const renameSection = (id: string, title: string) =>
    setState((prev) => ({ ...prev, sections: prev.sections.map((s) => (s.id === id ? { ...s, title } : s)) }));

  const addSection = () => {
    const id = `custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    setState((prev) => ({
      ...prev,
      sections: [...prev.sections, { id, title: "New section", tone: "slate", custom: true, moduleIds: [] }],
    }));
    setNewSectionId(id);
    requestAnimationFrame(() =>
      document.getElementById(`group-body-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
    );
  };

  const deleteSection = (id: string) =>
    setState((prev) => {
      const doomed = prev.sections.find((s) => s.id === id);
      if (!doomed?.custom) return prev;
      let sections = prev.sections.filter((s) => s.id !== id);
      for (const moduleId of doomed.moduleIds) sections = placeInDefault(sections, moduleId);
      return { sections, collapsed: prev.collapsed.filter((c) => c !== id) };
    });

  /* ----- drag handlers ----- */

  const onDragStart = ({ active }: DragStartEvent) => {
    snapshotRef.current = state;
    setActiveId(String(active.id));
  };

  // Moving into another section happens while hovering, so cards make room live.
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const activeKey = String(active.id);
    const overKey = String(over.id);

    setState((prev) => {
      const from = findSection(prev.sections, activeKey);
      const to = findSection(prev.sections, overKey);
      if (!from || !to || from === to) return prev;

      return {
        ...prev,
        sections: prev.sections.map((s) => {
          if (s.id === from) return { ...s, moduleIds: s.moduleIds.filter((id) => id !== activeKey) };
          if (s.id === to) {
            const target = s.moduleIds.filter((id) => id !== activeKey);
            const overIndex = target.indexOf(overKey);
            target.splice(overIndex >= 0 ? overIndex : target.length, 0, activeKey);
            return { ...s, moduleIds: target };
          }
          return s;
        }),
      };
    });
  };

  // Reordering inside the final section is applied on drop.
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const activeKey = String(active.id);
    if (over) {
      const overKey = String(over.id);
      setState((prev) => {
        const sectionId = findSection(prev.sections, activeKey);
        if (!sectionId || sectionId !== findSection(prev.sections, overKey)) return prev;
        return {
          ...prev,
          sections: prev.sections.map((s) => {
            if (s.id !== sectionId) return s;
            const oldIndex = s.moduleIds.indexOf(activeKey);
            const newIndex = s.moduleIds.indexOf(overKey);
            if (newIndex < 0 || oldIndex === newIndex) return s;
            return { ...s, moduleIds: arrayMove(s.moduleIds, oldIndex, newIndex) };
          }),
        };
      });
    }
    snapshotRef.current = null;
    setActiveId(null);
  };

  const onDragCancel = () => {
    if (snapshotRef.current) setState(snapshotRef.current);
    snapshotRef.current = null;
    setActiveId(null);
  };

  const startEditing = () => {
    setQuery("");
    setEditing(true);
  };

  const finishEditing = () => {
    setEditing(false);
    setNewSectionId(null);
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Workspace</h2>
          <p className="text-sm text-muted">
            {TOTAL_MODULES} modules across {state.sections.length} sections
            {customized && !editing && <span className="text-subtle"> · your layout</span>}
          </p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          {!editing && (
            <label className="relative block w-full sm:w-72">
              <span className="sr-only">Search modules</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setQuery("");
                }}
                placeholder="Search modules…"
                className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-10 text-sm shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100 [&::-webkit-search-cancel-button]:hidden"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-subtle hover:bg-canvas hover:text-ink"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-line bg-surface-muted px-1.5 font-mono text-[11px] text-subtle sm:block">
                  /
                </kbd>
              )}
            </label>
          )}

          <button
            type="button"
            onClick={toggleAll}
            title={allCollapsed ? "Expand all sections" : "Collapse all sections"}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft shadow-card transition hover:bg-canvas hover:text-ink"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${allCollapsed ? "-rotate-90" : ""}`} />
            <span className="sr-only">{allCollapsed ? "Expand all sections" : "Collapse all sections"}</span>
          </button>

          {editing ? (
            <>
              <button
                type="button"
                onClick={() => setState(DEFAULT_STATE)}
                disabled={!customized}
                title="Restore the original sections, names and card positions"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3.5 text-sm font-medium text-ink-soft shadow-card transition hover:bg-canvas hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
              <button
                type="button"
                onClick={finishEditing}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white shadow-card transition hover:bg-brand-800"
              >
                <Check className="h-4 w-4" />
                Done
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-line bg-surface px-3.5 text-sm font-medium text-ink-soft shadow-card transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Customize</span>
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          <LayoutGrid className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Rename a section by editing its name, drag cards between sections, or add your own section at the bottom.
            Changes save automatically in this browser.
          </p>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="mt-6 space-y-8">
          {visible.map(({ section, ids }) => {
            // Searching always shows matches, even inside collapsed sections.
            const collapsed = !q && collapsedSet.has(section.id);
            return (
              <SectionBlock
                key={section.id}
                section={section}
                editing={editing}
                collapsed={collapsed}
                autoFocusTitle={section.id === newSectionId}
                count={ids.length}
                onToggle={() => toggleSection(section.id)}
                onRename={(title) => renameSection(section.id, title)}
                onDelete={() => deleteSection(section.id)}
              >
                <SortableContext id={section.id} items={collapsed ? [] : ids} strategy={rectSortingStrategy}>
                  <SectionGrid editing={editing} isEmpty={ids.length === 0}>
                    {ids.map((id) => (
                      <SortableModule key={id} id={id} tone={section.tone} badge={badges[id]} editing={editing} />
                    ))}
                  </SectionGrid>
                </SortableContext>
              </SectionBlock>
            );
          })}

          {editing && (
            <button
              type="button"
              onClick={addSection}
              className="flex w-full items-center justify-center gap-2 rounded-card border-2 border-dashed border-line-strong py-6 text-sm font-medium text-muted transition hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700"
            >
              <Plus className="h-4 w-4" />
              Add section
            </button>
          )}

          {visible.length === 0 && (
            <div className="rounded-card border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
              <p className="text-sm font-medium text-ink">No modules match “{query}”</p>
              <p className="mt-1 text-sm text-muted">Try a different name, like “students” or “receipts”.</p>
            </div>
          )}
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
          {activeId ? (
            <ModuleCard
              module={MODULES_BY_ID.get(activeId)!}
              tone={activeSection?.tone ?? "brand"}
              badge={badges[activeId]}
              editing
              overlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
