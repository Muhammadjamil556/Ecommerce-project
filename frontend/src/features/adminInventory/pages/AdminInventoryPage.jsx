import { useEffect, useState } from 'react'
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
import { changeFilters } from '@/lib/searchParams'
import { fetchInventory, selectInventoryList } from '../adminInventorySlice'
import { AdjustDialog } from '../components/AdjustDialog'
import { StockBadge } from '../components/StockBadge'
import { readInventoryFilters } from '../inventoryFilters'

export function AdminInventoryPage() {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const { items, meta, status, error } = useSelector(selectInventoryList)
  const [dialog, setDialog] = useState(null)
  // Text, so the effect runs only when a filter really changes.
  const query = searchParams.toString()
  const filters = readInventoryFilters(searchParams)

  useEffect(() => {
    dispatch(fetchInventory(readInventoryFilters(new URLSearchParams(query))))
  }, [dispatch, query])

  function setFilters(changes) {
    setSearchParams(changeFilters(searchParams, changes))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>

      <div className="flex flex-wrap gap-2">
        <SearchForm
          label="Search inventory"
          value={filters.search}
          onSearch={(search) => setFilters({ search })}
        />
        <NativeSelect
          aria-label="Stock level"
          value={filters.low ? 'true' : ''}
          onChange={(event) => setFilters({ low: event.target.value })}
        >
          <NativeSelectOption value="">All stock</NativeSelectOption>
          <NativeSelectOption value="true">Low or empty</NativeSelectOption>
        </NativeSelect>
      </div>

      {status === 'failed' && (
        <LoadError
          error={error}
          onRetry={() => dispatch(fetchInventory(filters))}
        />
      )}
      {!items && status !== 'failed' && <PageLoader />}
      {items && status !== 'failed' && (
        <div
          aria-busy={status === 'loading'}
          className={status === 'loading' ? 'opacity-60' : undefined}
        >
          <p role="status" className="mb-2 text-sm text-muted-foreground">
            {meta.total === 1 ? '1 variant' : `${meta.total} variants`}
          </p>
          {items.length === 0 ? (
            <p>
              Nothing found here.{' '}
              <Link to="/admin/inventory" className="underline">
                Show all stock
              </Link>
            </p>
          ) : (
            <InventoryTable items={items} onChangeStock={setDialog} />
          )}
        </div>
      )}
      {items?.length > 0 && status !== 'failed' && (
        <PageButtons
          meta={meta}
          onChange={(page) => setFilters({ page: String(page) })}
        />
      )}
      {dialog && (
        <AdjustDialog
          item={dialog.item}
          opener={dialog.opener}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}

function InventoryTable({ items, onChangeStock }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Level</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.variantId}>
            <TableCell>
              <Link
                to={`/admin/inventory/${item.variantId}`}
                className="font-medium underline underline-offset-4"
              >
                {item.productName}, {item.variantName}
              </Link>
            </TableCell>
            <TableCell>{item.sku}</TableCell>
            <TableCell>{item.quantity}</TableCell>
            <TableCell>
              <StockBadge item={item} />
            </TableCell>
            <TableCell className="text-right">
              <Button
                size="sm"
                variant="outline"
                aria-label={`Change stock of ${item.productName}, ${item.variantName}`}
                onClick={(event) =>
                  onChangeStock({ item, opener: event.currentTarget })
                }
              >
                Change
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
