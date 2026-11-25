import { Button } from '@/components/ui/button'

/** Previous and next buttons for a list with "meta" from the API. */
export function PageButtons({ meta, onChange }) {
  if (meta.totalPages <= 1) return null

  return (
    <nav
      aria-label="Pages"
      className="flex items-center justify-between gap-4 text-sm"
    >
      <Button
        variant="outline"
        disabled={meta.page <= 1}
        onClick={() => onChange(meta.page - 1)}
      >
        Previous
      </Button>
      <span>
        Page {meta.page} of {meta.totalPages}
      </span>
      <Button
        variant="outline"
        disabled={meta.page >= meta.totalPages}
        onClick={() => onChange(meta.page + 1)}
      >
        Next
      </Button>
    </nav>
  )
}
