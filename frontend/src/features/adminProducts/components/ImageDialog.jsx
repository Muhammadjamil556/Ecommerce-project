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
import { pickChanges } from '@/lib/pickChanges'
import { updateImage, uploadImage } from '../adminProductsSlice'
import {
  IMAGE_TYPES,
  LICENSES,
  imageSchema,
  newImageSchema,
  toImageDetails,
  toImageForm,
  toImagePayload,
} from '../schemas/imageSchema'

/** Uploads a photo, or edits the details of the given one. */
export function ImageDialog({ productId, image, opener, onClose }) {
  const dispatch = useDispatch()
  const [apiError, setApiError] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(image ? imageSchema : newImageSchema),
    defaultValues: toImageForm(image),
  })
  // Keeps a license that is not in the list, such as one set through the API.
  const licenses =
    image && !LICENSES.includes(image.license)
      ? [image.license, ...LICENSES]
      : LICENSES

  async function onSubmit(values) {
    setApiError(null)
    try {
      if (image) {
        const before = toImagePayload(toImageForm(image))
        const changes = pickChanges(before, toImagePayload(values))
        if (Object.keys(changes).length > 0) {
          await dispatch(
            updateImage({ productId, id: image.id, changes }),
          ).unwrap()
        }
      } else {
        await dispatch(
          uploadImage({
            productId,
            file: values.file[0],
            details: toImageDetails(values),
          }),
        ).unwrap()
      }
      onClose()
    } catch (error) {
      setApiError(error)
    }
  }

  return (
    <Dialog
      open
      // An upload that has started should not be closed by accident.
      onOpenChange={(isOpen) => !isOpen && !isSubmitting && onClose()}
    >
      <DialogContent
        className="max-h-[90svh] overflow-y-auto sm:max-w-lg"
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          opener?.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle>{image ? 'Edit photo' : 'Add photo'}</DialogTitle>
          <DialogDescription>
            Use only your own photos, or photos you are allowed to use.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <ApiErrorAlert error={apiError} />
          {!image && (
            <FormField
              label="Photo"
              type="file"
              accept={IMAGE_TYPES.join(',')}
              hint="JPEG, PNG or WebP, at most 10 MB. It is made smaller, and hidden data such as the location is removed."
              error={errors.file}
              {...register('file')}
            />
          )}
          <FormField
            label="Description"
            hint="For people who cannot see the photo, such as: Nikon Z8 from the front."
            error={errors.altText}
            {...register('altText')}
          />
          <FormField
            label="Credit"
            hint="Who made the photo."
            error={errors.credit}
            {...register('credit')}
          />
          <FormField
            label="License"
            as={NativeSelect}
            className="w-full"
            error={errors.license}
            {...register('license')}
          >
            <NativeSelectOption value="">Choose a license</NativeSelectOption>
            {licenses.map((license) => (
              <NativeSelectOption key={license} value={license}>
                {license}
              </NativeSelectOption>
            ))}
          </FormField>
          <FormField
            label="Source address"
            type="url"
            hint="Where the photo came from. Optional."
            error={errors.sourceUrl}
            {...register('sourceUrl')}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save photo'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
