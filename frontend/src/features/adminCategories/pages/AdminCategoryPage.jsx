import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiErrorAlert } from '@/components/common/ApiErrorAlert'
import { FormCheckbox } from '@/components/common/FormCheckbox'
import { FormField } from '@/components/common/FormField'
import { LoadError } from '@/components/common/LoadError'
import { NotFoundPage } from '@/components/common/NotFoundPage'
import { PageLoader } from '@/components/common/PageLoader'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { pickChanges } from '@/lib/pickChanges'
import {
  createCategory,
  fetchCategories,
  selectAdminCategories,
  updateCategory,
} from '../adminCategoriesSlice'
import {
  categorySchema,
  toCategoryForm,
  toCategoryPayload,
} from '../schemas/categorySchema'

/** Creates a category, or edits the one in the address. */
export function AdminCategoryPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { items, status, error } = useSelector(selectAdminCategories)

  useEffect(() => {
    if (id) dispatch(fetchCategories())
  }, [dispatch, id])

  if (!id) return <CategoryForm />
  if (status === 'failed') {
    return (
      <LoadError error={error} onRetry={() => dispatch(fetchCategories())} />
    )
  }

  // Wait for fresh data, so the form never starts from an old copy.
  if (status !== 'succeeded') return <PageLoader />

  const category = items.find((item) => item.id === id)
  if (!category) return <NotFoundPage />
  return <CategoryForm key={id} category={category} />
}

function CategoryForm({ category }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [apiError, setApiError] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: toCategoryForm(category),
  })

  async function onSubmit(values) {
    setApiError(null)
    const payload = toCategoryPayload(values)
    try {
      if (category) {
        const before = toCategoryPayload(toCategoryForm(category))
        const changes = pickChanges(before, payload)
        if (Object.keys(changes).length > 0) {
          await dispatch(updateCategory({ id: category.id, changes })).unwrap()
        }
      } else {
        await dispatch(createCategory(payload)).unwrap()
      }
      await navigate('/admin/categories')
    } catch (error) {
      setApiError(error)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        {category ? 'Edit category' : 'New category'}
      </h1>
      <ApiErrorAlert error={apiError} />
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Name" error={errors.name} {...register('name')} />
        <FormField
          label="Slug"
          hint={
            category
              ? 'Part of the web address. Changing it breaks old links.'
              : 'Part of the web address. Leave blank to make it from the name.'
          }
          error={errors.slug}
          {...register('slug')}
        />
        <FormField
          label="Description"
          as={Textarea}
          error={errors.description}
          {...register('description')}
        />
        <FormField
          label="Order"
          inputMode="numeric"
          hint="Lower numbers come first."
          error={errors.sortOrder}
          {...register('sortOrder')}
        />
        <FormCheckbox
          label="Active"
          hint="When off, customers do not see this category or its products."
          {...register('isActive')}
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save'}
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/categories">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
