import { useId } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** Label, input and error message. Use with React Hook Form: {...register('email')} */
export function FormField({ label, error, hint, ...inputProps }) {
  const id = useId()
  const messageId = `${id}-message`
  const message = error?.message ?? hint

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={message ? messageId : undefined}
        {...inputProps}
      />
      {message && (
        <p
          id={messageId}
          className={
            error ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'
          }
        >
          {message}
        </p>
      )}
    </div>
  )
}
