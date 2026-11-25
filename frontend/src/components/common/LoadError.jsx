import { Button } from '@/components/ui/button'
import { ApiErrorAlert } from './ApiErrorAlert'

/** Shown when a screen could not load its data. */
export function LoadError({ error, onRetry }) {
  return (
    <div className="space-y-4">
      <ApiErrorAlert error={error} />
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
