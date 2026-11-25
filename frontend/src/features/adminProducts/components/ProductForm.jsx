import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { ApiErrorAlert } from '@/components/common/ApiErrorAlert'
import { FormField } from '@/components/common/FormField'
import { Button } from '@/components/ui/button'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { pickChanges } from '@/lib/pickChanges'
import {
  productSchema,
  toProductForm,
  toProductPayload,
} from '../schemas/productSchema'
import { TextRowsField } from './TextRowsField'

/**
 * Creates a product, or edits the given one. onSave receives the new values, or only
 * the changed ones when editing, and returns the saved product.
 */
export function ProductForm({ product, categories, onSave }) {
  const [apiError, setApiError] = useState(null)
  const [isSaved, setIsSaved] = useState(false)
  // What the form started from. Not "product", which may contain newer changes by
  // someone else that this form would then overwrite.
  const [baseline, setBaseline] = useState(product)
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: toProductForm(product),
  })

  async function onSubmit(values) {
    setApiError(null)
    setIsSaved(false)
    const payload = toProductPayload(values)
    const changes = product
      ? pickChanges(toProductPayload(toProductForm(baseline)), payload)
      : payload
    try {
      const saved =
        Object.keys(changes).length > 0 ? await onSave(changes) : baseline
      if (product) {
        setBaseline(saved)
        reset(toProductForm(saved))
        setIsSaved(true)
      }
    } catch (error) {
      setApiError(error)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <ApiErrorAlert error={apiError} />
      <FormField label="Name" error={errors.name} {...register('name')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Category"
          as={NativeSelect}
          className="w-full"
          error={errors.categoryId}
          {...register('categoryId')}
        >
          <NativeSelectOption value="">Choose a category</NativeSelectOption>
          {categories.map((category) => (
            <NativeSelectOption key={category.id} value={category.id}>
              {category.name}
            </NativeSelectOption>
          ))}
        </FormField>
        <FormField label="Brand" error={errors.brand} {...register('brand')} />
      </div>
      <FormField
        label="Slug"
        hint={
          product
            ? 'Part of the web address. Changing it breaks old links.'
            : 'Part of the web address. Leave blank to make it from the name.'
        }
        error={errors.slug}
        {...register('slug')}
      />
      <FormField
        label="Description"
        as={Textarea}
        rows={5}
        error={errors.description}
        {...register('description')}
      />
      <TextRowsField
        legend="Specifications"
        name="specifications"
        addLabel="Add specification"
        control={control}
        register={register}
        errors={errors.specifications}
      />
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isSubmitting || (Boolean(product) && !isDirty)}
        >
          {isSubmitting ? 'Saving…' : product ? 'Save changes' : 'Create draft'}
        </Button>
        <p role="status" className="text-sm text-muted-foreground">
          {isSaved && !isDirty ? 'Saved.' : ''}
        </p>
      </div>
    </form>
  )
}
