import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import { ApiErrorAlert } from '@/components/common/ApiErrorAlert'
import { ConfirmButton } from '@/components/common/ConfirmButton'
import { Button } from '@/components/ui/button'
import { deleteProduct, updateProduct } from '../adminProductsSlice'
import { StatusBadge } from './StatusBadge'

/** Publishes, archives or deletes the product. The API enforces the rules. */
export function ProductStatusPanel({ product }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [apiError, setApiError] = useState(null)
  const [isBusy, setIsBusy] = useState(false)

  async function run(action) {
    setApiError(null)
    setIsBusy(true)
    try {
      await action()
    } catch (error) {
      setApiError(error)
    } finally {
      setIsBusy(false)
    }
  }

  function setStatus(status) {
    return run(() =>
      dispatch(updateProduct({ id: product.id, changes: { status } })).unwrap(),
    )
  }

  function handleDelete() {
    return run(async () => {
      await dispatch(deleteProduct(product.id)).unwrap()
      await navigate('/admin/products')
    })
  }

  return (
    <section aria-label="Status" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={product.status} />
        {product.status !== 'published' && (
          <Button disabled={isBusy} onClick={() => setStatus('published')}>
            Publish
          </Button>
        )}
        {product.status !== 'draft' && (
          <Button
            variant="outline"
            disabled={isBusy}
            onClick={() => setStatus('draft')}
          >
            Move to draft
          </Button>
        )}
        {product.status === 'published' && (
          <Button
            variant="outline"
            disabled={isBusy}
            onClick={() => setStatus('archived')}
          >
            Archive
          </Button>
        )}
        {product.status === 'draft' && (
          <ConfirmButton
            disabled={isBusy}
            title={`Delete ${product.name}?`}
            description="The product, its variants and their stock are deleted. This cannot be undone."
            confirmLabel="Delete"
            onConfirm={handleDelete}
          >
            Delete draft
          </ConfirmButton>
        )}
      </div>
      <ApiErrorAlert error={apiError} />
    </section>
  )
}
