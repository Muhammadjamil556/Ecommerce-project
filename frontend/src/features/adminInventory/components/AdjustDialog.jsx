import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { ApiErrorAlert } from '@/components/common/ApiErrorAlert'
import { FormField } from '@/components/common/FormField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { adjustStock } from '../adminInventorySlice'
import { adjustSchema, toAdjustPayload } from '../schemas/stockSchemas'
import { REASON_LABELS } from '../stockReasons'

/** Without an answer, the change may or may not have been saved. */
function withUnknownOutcome(error) {
  if (error.code !== 'TIMEOUT' && error.code !== 'NETWORK_ERROR') return error
  return {
    ...error,
    message: `${error.message} Check the stock history before trying again, because the change may have been saved.`,
  }
}

export function AdjustDialog({ item, opener, onSaved, onClose }) {
  const dispatch = useDispatch()
  const [apiError, setApiError] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(adjustSchema),
    defaultValues: { direction: 'add', amount: '', reason: '', note: '' },
  })

  async function onSubmit(values) {
    setApiError(null)
    try {
      await dispatch(
        adjustStock({
          variantId: item.variantId,
          values: toAdjustPayload(values),
        }),
      ).unwrap()
      onSaved?.()
      onClose()
    } catch (error) {
      setApiError(withUnknownOutcome(error))
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(isOpen) => !isOpen && !isSubmitting && onClose()}
    >
      <DialogContent
        className="max-h-[90svh] overflow-y-auto sm:max-w-md"
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          opener?.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle>Change stock</DialogTitle>
          <DialogDescription>
            {item.productName}, {item.variantName}. In stock now:{' '}
            {item.quantity}
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <ApiErrorAlert error={apiError} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Change"
              as={NativeSelect}
              className="w-full"
              error={errors.direction}
              {...register('direction')}
            >
              <NativeSelectOption value="add">Add</NativeSelectOption>
              <NativeSelectOption value="remove">Remove</NativeSelectOption>
            </FormField>
            <FormField
              label="Amount"
              inputMode="numeric"
              error={errors.amount}
              {...register('amount')}
            />
          </div>
          <FormField
            label="Reason"
            as={NativeSelect}
            className="w-full"
            error={errors.reason}
            {...register('reason')}
          >
            <NativeSelectOption value="">Choose a reason</NativeSelectOption>
            {Object.entries(REASON_LABELS).map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </FormField>
          <FormField
            label="Note"
            as={Textarea}
            hint="Optional, such as a delivery number."
            error={errors.note}
            {...register('note')}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save change'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
