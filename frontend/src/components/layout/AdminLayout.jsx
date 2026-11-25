import { NavLink, Outlet } from 'react-router'

const LINKS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/inventory', label: 'Inventory' },
]

export function AdminLayout() {
  return (
    <div className="grid gap-6 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-8">
      <nav aria-label="Admin" className="flex flex-wrap gap-1 md:flex-col">
        {LINKS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted aria-[current=page]:bg-muted"
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
