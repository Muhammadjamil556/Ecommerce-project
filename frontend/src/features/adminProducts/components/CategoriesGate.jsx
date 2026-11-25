import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router'
import { LoadError } from '@/components/common/LoadError'
import { PageLoader } from '@/components/common/PageLoader'
import {
  fetchCategories,
  selectAdminCategories,
} from '@/features/adminCategories/adminCategoriesSlice'

/** Loads the categories before showing a form that needs them. */
export function CategoriesGate({ children }) {
  const dispatch = useDispatch()
  const { items, status, error } = useSelector(selectAdminCategories)

  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  if (items?.length > 0) return children(items)
  if (status === 'failed') {
    return (
      <LoadError error={error} onRetry={() => dispatch(fetchCategories())} />
    )
  }
  if (items && status === 'succeeded') {
    return (
      <p>
        A product needs a category.{' '}
        <Link to="/admin/categories/new" className="underline">
          Create a category first
        </Link>
      </p>
    )
  }
  return <PageLoader />
}
