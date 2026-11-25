import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router'
import { ApiErrorAlert } from '@/components/common/ApiErrorAlert'
import { ConfirmButton } from '@/components/common/ConfirmButton'
import { LoadError } from '@/components/common/LoadError'
import { PageLoader } from '@/components/common/PageLoader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  deleteCategory,
  fetchCategories,
  selectAdminCategories,
} from '../adminCategoriesSlice'

export function AdminCategoriesPage() {
  const dispatch = useDispatch()
  const { items, status, error } = useSelector(selectAdminCategories)
  const [deleteError, setDeleteError] = useState(null)

  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  async function handleDelete(id) {
    setDeleteError(null)
    try {
      await dispatch(deleteCategory(id)).unwrap()
    } catch (apiError) {
      setDeleteError(apiError)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <Button asChild>
          <Link to="/admin/categories/new">New category</Link>
        </Button>
      </div>

      <ApiErrorAlert error={deleteError} />

      {status === 'failed' && (
        <LoadError error={error} onRetry={() => dispatch(fetchCategories())} />
      )}
      {!items && status !== 'failed' && <PageLoader />}
      {items?.length === 0 && <p>No categories yet.</p>}
      {items?.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Visible</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <Link
                    to={`/admin/categories/${category.id}`}
                    className="font-medium underline underline-offset-4"
                  >
                    {category.name}
                  </Link>
                </TableCell>
                <TableCell>{category.slug}</TableCell>
                <TableCell>{category.sortOrder}</TableCell>
                <TableCell>
                  <Badge variant={category.isActive ? 'default' : 'secondary'}>
                    {category.isActive ? 'Active' : 'Hidden'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <ConfirmButton
                    size="sm"
                    aria-label={`Delete ${category.name}`}
                    title={`Delete ${category.name}?`}
                    description="This cannot be undone. A category with products cannot be deleted."
                    confirmLabel="Delete"
                    onConfirm={() => handleDelete(category.id)}
                  >
                    Delete
                  </ConfirmButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
