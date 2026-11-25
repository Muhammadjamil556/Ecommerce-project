import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { ApiErrorAlert } from '@/components/common/ApiErrorAlert'
import { ConfirmButton } from '@/components/common/ConfirmButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { deleteImage, reorderImages } from '../adminProductsSlice'
import { ImageDialog } from './ImageDialog'

export function ImagesPanel({ product }) {
  const dispatch = useDispatch()
  // null: closed. { image: undefined }: adding. "opener" gets the focus back.
  const [dialog, setDialog] = useState(null)
  const [apiError, setApiError] = useState(null)
  const [isBusy, setIsBusy] = useState(false)
  const { id: productId, images } = product

  async function run(action) {
    setApiError(null)
    setIsBusy(true)
    try {
      await dispatch(action).unwrap()
    } catch (error) {
      setApiError(error)
    } finally {
      setIsBusy(false)
    }
  }

  function makeMain(image) {
    const others = images.filter(({ id }) => id !== image.id)
    const imageIds = [image, ...others].map(({ id }) => id)
    return run(reorderImages({ productId, imageIds }))
  }

  return (
    <section aria-labelledby="photos-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="photos-heading" className="text-xl font-semibold">
          Photos
        </h2>
        <Button
          variant="outline"
          onClick={(event) =>
            setDialog({ image: undefined, opener: event.currentTarget })
          }
        >
          Add photo
        </Button>
      </div>
      <ApiErrorAlert error={apiError} />

      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">No photos yet.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {images.map((image, index) => (
            <li key={image.id} className="space-y-2 rounded-lg border p-3">
              <img
                src={image.url}
                alt={image.alt}
                width={image.width}
                height={image.height}
                loading="lazy"
                className="aspect-square w-full rounded-md bg-muted object-contain"
              />
              <p className="text-sm wrap-break-word">
                {index === 0 && <Badge className="mr-2">Main photo</Badge>}
                {image.alt}
              </p>
              <p className="text-xs text-muted-foreground wrap-break-word">
                {image.credit}, {image.license}
              </p>
              <div className="flex flex-wrap gap-2">
                {index > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isBusy}
                    aria-label={`Make main: ${image.alt}`}
                    onClick={() => makeMain(image)}
                  >
                    Make main
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  aria-label={`Edit photo: ${image.alt}`}
                  onClick={(event) =>
                    setDialog({ image, opener: event.currentTarget })
                  }
                >
                  Edit
                </Button>
                <ConfirmButton
                  size="sm"
                  disabled={isBusy}
                  aria-label={`Delete photo: ${image.alt}`}
                  title="Delete this photo?"
                  description="This cannot be undone."
                  confirmLabel="Delete"
                  onConfirm={() =>
                    run(deleteImage({ productId, id: image.id }))
                  }
                >
                  Delete
                </ConfirmButton>
              </div>
            </li>
          ))}
        </ul>
      )}
      {dialog && (
        <ImageDialog
          productId={productId}
          image={dialog.image}
          opener={dialog.opener}
          onClose={() => setDialog(null)}
        />
      )}
    </section>
  )
}
