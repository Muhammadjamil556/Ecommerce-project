import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import { createProduct } from '../adminProductsSlice'
import { CategoriesGate } from '../components/CategoriesGate'
import { ProductForm } from '../components/ProductForm'

export function AdminNewProductPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  async function handleSave(values) {
    const product = await dispatch(createProduct(values)).unwrap()
    await navigate(`/admin/products/${product.id}`)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">New product</h1>
      <p className="text-muted-foreground">
        New products are drafts. Customers see them after you add a variant and
        publish.
      </p>
      <CategoriesGate>
        {(categories) => (
          <ProductForm categories={categories} onSave={handleSave} />
        )}
      </CategoriesGate>
    </div>
  )
}
