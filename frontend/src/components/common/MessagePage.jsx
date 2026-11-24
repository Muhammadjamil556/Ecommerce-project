/** A centered title and message, with optional buttons or links. */
export function MessagePage({ title, message, children }) {
  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-muted-foreground">{message}</p>
      <div className="mt-6 flex justify-center gap-3">{children}</div>
    </div>
  )
}
