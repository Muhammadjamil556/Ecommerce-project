import { describe, expect, it } from 'vitest'
import { readProductFilters } from './productFilters'

const read = (query) => readProductFilters(new URLSearchParams(query))

describe('readProductFilters', () => {
  it('reads valid filters', () => {
    expect(read('search=+z8+&status=draft&category=cameras&page=2')).toEqual({
      search: 'z8',
      status: 'draft',
      category: 'cameras',
      page: 2,
    })
  })

  it.each(['page=0', 'page=abc', 'page=1.5', 'page=99999', ''])(
    'uses page 1 for "%s"',
    (query) => {
      expect(read(query).page).toBe(1)
    },
  )

  it.each(['status=sold', 'status=toString', 'status='])(
    'ignores "%s"',
    (query) => {
      expect(read(query).status).toBeUndefined()
    },
  )
})
