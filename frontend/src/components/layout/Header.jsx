import { ShoppingBag } from 'lucide-react'
import { Link } from 'react-router'
import { HeaderNav } from './HeaderNav'

export function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <ShoppingBag className="size-5" aria-hidden="true" />
          Ecommerce
        </Link>
        <HeaderNav />
      </div>
    </header>
  )
}
