import { Button } from '@/components/ui/button'

/** Shown when a page crashes while rendering. */
export function ErrorPage() {
  return (
    <main className="px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-muted-foreground">Please reload the page.</p>
      <Button className="mt-6" onClick={() => window.location.reload()}>
        Reload
      </Button>
    </main>
  )
}
