import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useSearchParams } from 'react-router'
import { LoadError } from '@/components/common/LoadError'
import { PageButtons } from '@/components/common/PageButtons'
import { PageLoader } from '@/components/common/PageLoader'
import { SearchForm } from '@/components/common/SearchForm'
import { Button } from '@/components/ui/button'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  fetchCategories,
  selectAdminCategories,
} from '@/features/adminCategories/adminCategoriesSlice'
import { formatPrice } from '@/lib/money'
import { changeFilters } from '@/lib/searchParams'
import { fetchProducts, selectAdminProductList } from '../adminProductsSlice'
import { StatusBadge } from '../components/StatusBadge'
import { readProductFilters } from '../productFilters'
import { STATUS_LABELS } from '../productStatus'

export function AdminProductsPage() {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const { items, meta, status, error } = useSelector(selectAdminProductList)
  const categories = useSelector(selectAdminCategories).items ?? []
  // Text, so the effect runs only when a filter really changes.
  const query = searchParams.toString()
  const filters = readProductFilters(searchParams)

  useEffect(() => {
    dispatch(fetchProducts(readProductFilters(new URLSearchParams(query))))
  }, [dispatch, query])

  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  /** The filters live in the address, so a filtered list can be reloaded or shared. */
  function setFilters(changes) {
    setSearchParams(changeFilters(searchParams, changes))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <Button asChild>
          <Link to="/admin/products/new">New product</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <SearchForm
          label="Search products"
          value={filters.search}
          onSearch={(search) => setFilters({ search })}
        />
        <NativeSelect
          aria-label="Status"
          value={filters.status ?? ''}
          onChange={(event) => setFilters({ status: event.target.value })}
        >
          <NativeSelectOption value="">All statuses</NativeSelectOption>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <NativeSelectOption key={value} value={value}>
              {label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Category"
          value={filters.category ?? ''}
          onChange={(event) => setFilters({ category: event.target.value })}
        >
          <NativeSelectOption value="">All categories</NativeSelectOption>
          {categories.map((category) => (
            <NativeSelectOption key={category.id} value={category.slug}>
              {category.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {status === 'failed' && (
        <LoadError
          error={error}
          onRetry={() => dispatch(fetchProducts(filters))}
        />
      )}
      {!items && status !== 'failed' && <PageLoader />}
      {items && status !== 'failed' && (
        <div
          aria-busy={status === 'loading'}
          className={status === 'loading' ? 'opacity-60' : undefined}
        >
          <p role="status" className="mb-2 text-sm text-muted-foreground">
            {meta.total === 1 ? '1 product' : `${meta.total} products`}
          </p>
          {items.length === 0 ? (
            <p>
              No products found here.{' '}
              <Link to="/admin/products" className="underline">
                Show all products
              </Link>
            </p>
          ) : (
            <ProductTable items={items} />
          )}
        </div>
      )}
      {items?.length > 0 && status !== 'failed' && (
        <PageButtons
          meta={meta}
          onChange={(page) => setFilters({ page: String(page) })}
        />
      )}
    </div>
  )
}

function ProductTable({ items }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Availability</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((product) => (
          <TableRow key={product.id}>
            <TableCell>
              <Link
                to={`/admin/products/${product.id}`}
                className="font-medium underline underline-offset-4"
              >
                {product.name}
              </Link>
            </TableCell>
            <TableCell>{product.category.name}</TableCell>
            <TableCell>{priceText(product)}</TableCell>
            <TableCell>
              {product.isInStock ? 'In stock' : 'Out of stock'}
            </TableCell>
            <TableCell>
              <StatusBadge status={product.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function priceText({ minPriceMinor, maxPriceMinor }) {
  if (minPriceMinor === null) return 'No active variant'
  if (minPriceMinor === maxPriceMinor) return formatPrice(minPriceMinor)
  return `${formatPrice(minPriceMinor)} – ${formatPrice(maxPriceMinor)}`
}
