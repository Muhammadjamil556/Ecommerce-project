import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { ApiErrorAlert } from '@/components/common/ApiErrorAlert'
import { FormCheckbox } from '@/components/common/FormCheckbox'
import { FormField } from '@/components/common/FormField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { pickChanges } from '@/lib/pickChanges'
import { createVariant, updateVariant } from '../adminProductsSlice'
import {
  toVariantForm,
  toVariantPayload,
  variantSchema,
} from '../schemas/variantSchema'
import { TextRowsField } from './TextRowsField'

/** Adds a variant, or edits the given one. */
export function VariantDialog({ productId, variant, opener, onClose }) {
  const dispatch = useDispatch()
  const [apiError, setApiError] = useState(null)
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(variantSchema),
    defaultValues: toVariantForm(variant),
  })

  async function onSubmit(values) {
    setApiError(null)
    const payload = toVariantPayload(values)
    try {
      if (variant) {
        const before = toVariantPayload(toVariantForm(variant))
        const changes = pickChanges(before, payload)
        if (Object.keys(changes).length > 0) {
          await dispatch(
            updateVariant({ productId, id: variant.id, changes }),
          ).unwrap()
        }
      } else {
        await dispatch(createVariant({ productId, values: payload })).unwrap()
      }
      onClose()
    } catch (error) {
      setApiError(error)
    }
  }

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="max-h-[90svh] overflow-y-auto sm:max-w-lg"
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          opener?.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle>{variant ? 'Edit variant' : 'Add variant'}</DialogTitle>
          <DialogDescription>
            What the customer buys, such as body only or with a lens.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <ApiErrorAlert error={apiError} />
          <FormField
            label="Variant name"
            error={errors.name}
            {...register('name')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="SKU"
              hint="Your unique code, such as NIK-Z8-BODY."
              error={errors.sku}
              {...register('sku')}
            />
            <FormField
              label="Price (Rs)"
              inputMode="decimal"
              error={errors.price}
              {...register('price')}
            />
          </div>
          <TextRowsField
            legend="Options"
            name="options"
            addLabel="Add option"
            control={control}
            register={register}
            errors={errors.options}
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
            hint="When off, customers cannot see or buy it."
            {...register('isActive')}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save variant'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
