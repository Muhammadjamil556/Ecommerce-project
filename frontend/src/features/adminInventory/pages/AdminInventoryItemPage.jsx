import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router'
import { LoadError } from '@/components/common/LoadError'
import { NotFoundPage } from '@/components/common/NotFoundPage'
import { PageLoader } from '@/components/common/PageLoader'
import { Button } from '@/components/ui/button'
import {
  fetchInventoryItem,
  fetchMovements,
  selectInventoryItem,
  selectMovements,
} from '../adminInventorySlice'
import { AdjustDialog } from '../components/AdjustDialog'
import { StockBadge } from '../components/StockBadge'
import { StockHistory } from '../components/StockHistory'
import { ThresholdForm } from '../components/ThresholdForm'

/** The stock and history of one variant. */
export function AdminInventoryItemPage() {
  const { variantId } = useParams()
  const dispatch = useDispatch()
  const { item, status, error } = useSelector(selectInventoryItem)
  const history = useSelector(selectMovements)
  const [opener, setOpener] = useState(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    dispatch(fetchInventoryItem(variantId))
  }, [dispatch, variantId])

  useEffect(() => {
    dispatch(fetchMovements({ variantId, page }))
  }, [dispatch, variantId, page])

  function showNewestHistory() {
    if (page === 1) dispatch(fetchMovements({ variantId, page }))
    else setPage(1)
  }

  if (status === 'failed') {
    // 400: the address does not contain a valid ID.
    if (error.status === 404 || error.status === 400) return <NotFoundPage />
    return (
      <LoadError
        error={error}
        onRetry={() => {
          dispatch(fetchInventoryItem(variantId))
          dispatch(fetchMovements({ variantId, page }))
        }}
      />
    )
  }
  if (status !== 'succeeded' || item?.variantId !== variantId) {
    return <PageLoader />
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link to="/admin/inventory" className="text-sm underline">
          All stock
        </Link>
        <h1 className="text-3xl font-bold tracking-tight wrap-break-word">
          {item.productName}, {item.variantName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {item.sku} ·{' '}
          <Link
            to={`/admin/products/${item.productId}`}
            className="underline underline-offset-4"
          >
            Edit product
          </Link>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <p>
            In stock: <strong>{item.quantity}</strong>
          </p>
          <StockBadge item={item} />
          <Button onClick={(event) => setOpener(event.currentTarget)}>
            Change stock
          </Button>
        </div>
      </div>

      <ThresholdForm key={variantId} item={item} />

      <section aria-labelledby="history-heading" className="space-y-4">
        <h2 id="history-heading" className="text-xl font-semibold">
          History
        </h2>
        <StockHistory
          history={history}
          onRetry={() => dispatch(fetchMovements({ variantId, page }))}
          onPageChange={setPage}
        />
      </section>

      {opener && (
        <AdjustDialog
          item={item}
          opener={opener}
          onSaved={showNewestHistory}
          onClose={() => setOpener(null)}
        />
      )}
    </div>
  )
}
