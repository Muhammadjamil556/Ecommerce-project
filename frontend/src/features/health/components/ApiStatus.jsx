import { useEffect } from 'react'
import { CircleCheck, CircleX, LoaderCircle } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '@/components/ui/button'
import { fetchHealth, selectHealth } from '../healthSlice'

export function ApiStatus() {
  const dispatch = useDispatch()
  const { data, status, error } = useSelector(selectHealth)

  useEffect(() => {
    dispatch(fetchHealth())
  }, [dispatch])

  return (
    <section
      aria-labelledby="api-status-heading"
      className="rounded-xl border bg-card p-6 text-card-foreground"
    >
      <h2 id="api-status-heading" className="text-lg font-semibold">
        Backend status
      </h2>

      <div aria-live="polite" className="mt-3 flex items-center gap-2">
        {(status === 'idle' || status === 'loading') && (
          <>
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            <p>Checking the API…</p>
          </>
        )}
        {status === 'succeeded' && (
          <>
            <CircleCheck className="size-5 text-green-700" aria-hidden="true" />
            <p>Connected. Running for {data.uptimeSeconds} seconds.</p>
          </>
        )}
        {status === 'failed' && (
          <>
            <CircleX className="size-5 text-destructive" aria-hidden="true" />
            <p>{error.message}</p>
          </>
        )}
      </div>

      <Button
        variant="outline"
        className="mt-4"
        disabled={status === 'loading'}
        onClick={() => dispatch(fetchHealth())}
      >
        Check again
      </Button>
    </section>
  )
}
