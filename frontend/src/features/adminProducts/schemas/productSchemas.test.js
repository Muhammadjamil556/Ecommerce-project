import { describe, expect, it } from 'vitest'
import { productSchema, toProductForm, toProductPayload } from './productSchema'
import { toVariantForm, toVariantPayload, variantSchema } from './variantSchema'

const product = {
  ...toProductForm(),
  categoryId: 'id',
  name: 'Z8',
  brand: 'Nikon',
}
const variant = { ...toVariantForm(), sku: 'z8-body', name: 'Body', price: '1' }

function firstIssue(schema, values) {
  const { path, message } = schema.safeParse(values).error.issues[0]
  return [path.join('.'), message]
}

describe('productSchema', () => {
  it('turns rows into an object and ignores blank rows', () => {
    const values = productSchema.parse({
      ...product,
      specifications: [
        { name: ' Weight ', value: ' 910 g ' },
        { name: '', value: '  ' },
      ],
    })
    expect(toProductPayload(values)).toEqual({
      categoryId: 'id',
      name: 'Z8',
      brand: 'Nikon',
      description: '',
      specifications: { Weight: '910 g' },
    })
  })

  it.each([
    [[{ name: 'A', value: '' }], '0.value'],
    [[{ name: '', value: 'x' }], '0.name'],
    [[{ name: '__proto__', value: 'x' }], '0.name'],
    [
      [
        { name: 'A', value: '1' },
        { name: ' A', value: '2' },
      ],
      '1.name',
    ],
  ])('rejects the rows %j', (specifications, path) => {
    expect(firstIssue(productSchema, { ...product, specifications })[0]).toBe(
      `specifications.${path}`,
    )
  })

  it('requires a category', () => {
    expect(firstIssue(productSchema, { ...product, categoryId: '' })).toEqual([
      'categoryId',
      'Choose a category',
    ])
  })

  it('accepts the longest slug the API can make', () => {
    const slug = 'a'.repeat(180)
    expect(productSchema.safeParse({ ...product, slug }).success).toBe(true)
  })
})

describe('variantSchema', () => {
  it('converts rupees to paisa and the SKU to uppercase', () => {
    const values = variantSchema.parse({ ...variant, price: '45,000.50' })
    expect(toVariantPayload(values)).toEqual({
      sku: 'Z8-BODY',
      name: 'Body',
      priceMinor: 4500050,
      options: {},
      sortOrder: 0,
      isActive: true,
    })
  })

  it.each([
    ['price', '0'],
    ['price', 'free'],
    ['sku', 'bad sku'],
    ['sku', ''],
    ['name', ''],
  ])('rejects %s "%s"', (field, value) => {
    expect(firstIssue(variantSchema, { ...variant, [field]: value })[0]).toBe(
      field,
    )
  })
})
