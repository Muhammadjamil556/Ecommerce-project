const currentYear = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="border-t">
      <p className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground sm:px-6">
        © {currentYear} Ecommerce
      </p>
    </footer>
  )
}
