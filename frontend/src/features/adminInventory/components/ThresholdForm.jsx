import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { ApiErrorAlert } from '@/components/common/ApiErrorAlert'
import { FormField } from '@/components/common/FormField'
import { Button } from '@/components/ui/button'
import { updateThreshold } from '../adminInventorySlice'
import { thresholdSchema } from '../schemas/stockSchemas'

export function ThresholdForm({ item }) {
  const dispatch = useDispatch()
  const [apiError, setApiError] = useState(null)
  const [isSaved, setIsSaved] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(thresholdSchema),
    defaultValues: { lowStockThreshold: String(item.lowStockThreshold) },
  })

  async function onSubmit(values) {
    setApiError(null)
    setIsSaved(false)
    try {
      await dispatch(
        updateThreshold({
          variantId: item.variantId,
          lowStockThreshold: Number(values.lowStockThreshold),
        }),
      ).unwrap()
      reset(values)
      setIsSaved(true)
    } catch (error) {
      setApiError(error)
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-xs space-y-3"
    >
      <ApiErrorAlert error={apiError} />
      <FormField
        label="Low stock level"
        inputMode="numeric"
        hint="Stock at or below this counts as low."
        error={errors.lowStockThreshold}
        {...register('lowStockThreshold')}
      />
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          variant="outline"
          disabled={isSubmitting || !isDirty}
        >
          {isSubmitting ? 'Saving…' : 'Save level'}
        </Button>
        <p role="status" className="text-sm text-muted-foreground">
          {isSaved && !isDirty ? 'Saved.' : ''}
        </p>
      </div>
    </form>
  )
}
