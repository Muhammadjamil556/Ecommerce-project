import { describe, expect, it } from 'vitest'
import {
  imageSchema,
  newImageSchema,
  toImageDetails,
  toImagePayload,
} from './imageSchema'

const details = {
  altText: ' Front ',
  credit: 'Me',
  license: 'Own photo',
  sourceUrl: '',
}
const file = (type, size) => ({ type, size })
const check = (files) =>
  newImageSchema.safeParse({ ...details, file: files }).error?.issues[0].message

describe('imageSchema', () => {
  it('clears a blank source on edit, and leaves it out on upload', () => {
    const values = imageSchema.parse(details)
    expect(toImagePayload(values).sourceUrl).toBeNull()
    expect(toImageDetails(values)).toEqual({
      altText: 'Front',
      credit: 'Me',
      license: 'Own photo',
    })
  })

  it.each(['javascript:alert(1)', 'http://example.com', 'example.com'])(
    'rejects the source "%s"',
    (sourceUrl) => {
      expect(imageSchema.safeParse({ ...details, sourceUrl }).success).toBe(
        false,
      )
    },
  )
})

describe('newImageSchema', () => {
  it('checks the file', () => {
    expect(check([file('image/jpeg', 100)])).toBeUndefined()
    expect(check([])).toBe('Choose a photo')
    expect(check(undefined)).toBe('Choose a photo')
    expect(check([file('image/svg+xml', 100)])).toBe(
      'Choose a JPEG, PNG or WebP photo',
    )
    expect(check([file('image/png', 11 * 1024 * 1024)])).toBe(
      'Choose a photo of at most 10 MB',
    )
  })
})
