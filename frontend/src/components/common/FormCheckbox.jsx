import { useId } from 'react'
import { Label } from '@/components/ui/label'

/** Use with React Hook Form: {...register('isActive')} */
export function FormCheckbox({ label, hint, ...inputProps }) {
  const id = useId()

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="checkbox"
          className="size-4 accent-primary"
          aria-describedby={hint ? `${id}-hint` : undefined}
          {...inputProps}
        />
        <Label htmlFor={id}>{label}</Label>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  )
}
