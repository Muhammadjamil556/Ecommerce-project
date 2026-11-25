import { describe, expect, it } from 'vitest'
import {
  categorySchema,
  toCategoryForm,
  toCategoryPayload,
} from './categorySchema'

const valid = { ...toCategoryForm(), name: ' Bags ' }

describe('categorySchema', () => {
  it('leaves a blank slug to the API', () => {
    expect(toCategoryPayload(categorySchema.parse(valid))).toEqual({
      name: 'Bags',
      description: '',
      sortOrder: 0,
      isActive: true,
    })
  })

  it.each([
    ['name', ' '],
    ['slug', 'Bad Slug'],
    ['slug', 'a--b'],
    ['sortOrder', '-1'],
    ['sortOrder', '1.5'],
    ['sortOrder', '10001'],
    ['sortOrder', ''],
  ])('rejects %s "%s"', (field, value) => {
    const result = categorySchema.safeParse({ ...valid, [field]: value })
    expect(result.error.issues[0].path).toEqual([field])
  })
})
