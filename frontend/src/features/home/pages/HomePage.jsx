import { ApiStatus } from '@/features/health/components/ApiStatus'

export function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome to the store
        </h1>
        <p className="mt-2 text-muted-foreground">
          The store is being built. Products will appear here in a later phase.
        </p>
      </div>
      <ApiStatus />
    </div>
  )
}
