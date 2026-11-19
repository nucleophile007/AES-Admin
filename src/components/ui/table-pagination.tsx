"use client"

interface TablePaginationProps {
  currentPage: number
  pageSize: number
  totalItems: number
  itemLabel: string
  onPageChange: (nextPage: number) => void
}

export default function TablePagination({
  currentPage,
  pageSize,
  totalItems,
  itemLabel,
  onPageChange,
}: TablePaginationProps) {
  if (totalItems <= pageSize) return null

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">
        Showing {startItem}-{endItem} of {totalItems} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink-soft shadow-card transition hover:bg-canvas hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm font-medium text-ink-soft">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink-soft shadow-card transition hover:bg-canvas hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}
