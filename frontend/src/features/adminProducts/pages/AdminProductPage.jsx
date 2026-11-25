import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router'
import { LoadError } from '@/components/common/LoadError'
import { NotFoundPage } from '@/components/common/NotFoundPage'
import { PageLoader } from '@/components/common/PageLoader'
import {
  fetchProduct,
  selectAdminProduct,
  updateProduct,
} from '../adminProductsSlice'
import { CategoriesGate } from '../components/CategoriesGate'
import { ImagesPanel } from '../components/ImagesPanel'
import { ProductForm } from '../components/ProductForm'
import { ProductStatusPanel } from '../components/ProductStatusPanel'
import { VariantsPanel } from '../components/VariantsPanel'

export function AdminProductPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { product, status, error } = useSelector(selectAdminProduct)

  useEffect(() => {
    dispatch(fetchProduct(id))
  }, [dispatch, id])

  if (status === 'failed') {
    // 400: the address does not contain a valid ID.
    if (error.status === 404 || error.status === 400) return <NotFoundPage />
    return (
      <LoadError error={error} onRetry={() => dispatch(fetchProduct(id))} />
    )
  }
  // Wait for fresh data, so the form never starts from an old copy.
  if (status !== 'succeeded' || product?.id !== id) return <PageLoader />

  function handleSave(changes) {
    return dispatch(updateProduct({ id, changes })).unwrap()
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="space-y-3">
        <Link to="/admin/products" className="text-sm underline">
          All products
        </Link>
        <h1 className="text-3xl font-bold tracking-tight wrap-break-word">
          {product.name}
        </h1>
        <ProductStatusPanel product={product} />
      </div>
      <VariantsPanel product={product} />
      <ImagesPanel product={product} />
      <section aria-labelledby="details-heading" className="space-y-4">
        <h2 id="details-heading" className="text-xl font-semibold">
          Details
        </h2>
        <CategoriesGate>
          {(categories) => (
            <ProductForm
              key={id}
              product={product}
              categories={categories}
              onSave={handleSave}
            />
          )}
        </CategoriesGate>
      </section>
    </div>
  )
}
