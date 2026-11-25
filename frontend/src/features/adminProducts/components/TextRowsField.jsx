import { useFieldArray } from 'react-hook-form'
import { FormField } from '@/components/common/FormField'
import { Button } from '@/components/ui/button'

/** Editable name and value rows, such as Weight: 910 g. */
export function TextRowsField({
  legend,
  name,
  addLabel,
  control,
  register,
  errors,
}) {
  const { fields, append, remove } = useFieldArray({ control, name })
  const listError = errors?.root?.message ?? errors?.message

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">{legend}</legend>
      {listError && <p className="text-sm text-destructive">{listError}</p>}
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-start"
        >
          <FormField
            label={`Name ${index + 1}`}
            error={errors?.[index]?.name}
            {...register(`${name}.${index}.name`)}
          />
          <FormField
            label={`Value ${index + 1}`}
            error={errors?.[index]?.value}
            {...register(`${name}.${index}.value`)}
          />
          <Button
            type="button"
            variant="outline"
            className="sm:mt-5.5"
            aria-label={`Remove row ${index + 1}`}
            onClick={() => remove(index)}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => append({ name: '', value: '' })}
      >
        {addLabel}
      </Button>
    </fieldset>
  )
}
