import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { ApiErrorAlert } from '@/components/common/ApiErrorAlert'
import { ConfirmButton } from '@/components/common/ConfirmButton'
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
import { formatPrice } from '@/lib/money'
import { deleteVariant } from '../adminProductsSlice'
import { VariantDialog } from './VariantDialog'

export function VariantsPanel({ product }) {
  const dispatch = useDispatch()
  // null: closed. { variant: undefined }: adding a new one. "opener" is the button
  // that gets the keyboard focus back.
  const [dialog, setDialog] = useState(null)
  const [apiError, setApiError] = useState(null)

  async function handleDelete(id) {
    setApiError(null)
    try {
      await dispatch(deleteVariant({ productId: product.id, id })).unwrap()
    } catch (error) {
      setApiError(error)
    }
  }

  return (
    <section aria-labelledby="variants-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="variants-heading" className="text-xl font-semibold">
          Variants
        </h2>
        <Button
          variant="outline"
          onClick={(event) =>
            setDialog({ variant: undefined, opener: event.currentTarget })
          }
        >
          Add variant
        </Button>
      </div>
      <ApiErrorAlert error={apiError} />

      {product.variants.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No variants yet. Add at least one before publishing.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Variant</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Visible</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {product.variants.map((variant) => (
              <TableRow key={variant.id}>
                <TableCell className="font-medium">{variant.name}</TableCell>
                <TableCell>{variant.sku}</TableCell>
                <TableCell>{formatPrice(variant.priceMinor)}</TableCell>
                <TableCell>{variant.quantity}</TableCell>
                <TableCell>
                  <Badge variant={variant.isActive ? 'default' : 'secondary'}>
                    {variant.isActive ? 'Active' : 'Hidden'}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label={`Edit ${variant.name}`}
                    onClick={(event) =>
                      setDialog({ variant, opener: event.currentTarget })
                    }
                  >
                    Edit
                  </Button>
                  <ConfirmButton
                    size="sm"
                    aria-label={`Delete ${variant.name}`}
                    title={`Delete ${variant.name}?`}
                    description="The variant and its stock are deleted. This cannot be undone."
                    confirmLabel="Delete"
                    onConfirm={() => handleDelete(variant.id)}
                  >
                    Delete
                  </ConfirmButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {dialog && (
        <VariantDialog
          productId={product.id}
          variant={dialog.variant}
          opener={dialog.opener}
          onClose={() => setDialog(null)}
        />
      )}
    </section>
  )
}
