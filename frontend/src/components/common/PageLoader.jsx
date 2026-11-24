import { LoaderCircle } from 'lucide-react'

export function PageLoader() {
  return (
    <div role="status" className="flex justify-center py-24">
      <LoaderCircle className="size-8 animate-spin" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}
