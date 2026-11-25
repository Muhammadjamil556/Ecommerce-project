import { z } from 'zod'
import { requiredText } from '@/lib/formRules'

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_BYTES = 10 * 1024 * 1024

export const LICENSES = [
  'Own photo',
  'Used with permission',
  'CC0 1.0',
  'CC BY 2.0',
  'CC BY 4.0',
  'CC BY-SA 2.0',
  'CC BY-SA 4.0',
]

export const imageSchema = z.object({
  altText: requiredText('a description', 200),
  credit: requiredText('who made the photo', 200),
  license: z.string().min(1, 'Choose a license'),
  sourceUrl: z
    .string()
    .trim()
    .max(500, 'Use at most 500 characters')
    .refine(
      (text) => text === '' || isHttpsUrl(text),
      'Enter an address that starts with https://',
    ),
})

/** The browser's FileList of one file input. The API checks the real contents. */
export const newImageSchema = imageSchema.extend({
  file: z
    .custom()
    .refine((files) => files?.length === 1, 'Choose a photo')
    .refine(
      (files) => !files?.[0] || IMAGE_TYPES.includes(files[0].type),
      'Choose a JPEG, PNG or WebP photo',
    )
    .refine(
      (files) => !files?.[0] || files[0].size <= MAX_FILE_BYTES,
      'Choose a photo of at most 10 MB',
    ),
})

function isHttpsUrl(text) {
  return URL.canParse(text) && new URL(text).protocol === 'https:'
}

export function toImageForm(image) {
  return {
    altText: image?.alt ?? '',
    credit: image?.credit ?? '',
    license: image?.license ?? '',
    sourceUrl: image?.sourceUrl ?? '',
  }
}

/** For an edit: a blank source is sent as null, which clears it. */
export function toImagePayload({ altText, credit, license, sourceUrl }) {
  return { altText, credit, license, sourceUrl: sourceUrl || null }
}

/** For an upload: a blank source is left out. */
export function toImageDetails(values) {
  const { sourceUrl, ...details } = toImagePayload(values)
  return sourceUrl ? { ...details, sourceUrl } : details
}
