import { describe, expect, it } from 'vitest'
import { changeFilters } from './searchParams'

describe('changeFilters', () => {
  const change = (query, changes) =>
    changeFilters(new URLSearchParams(query), changes).toString()

  it('goes back to page 1 and keeps other filters', () => {
    expect(change('status=draft&page=3', { search: 'z8' })).toBe(
      'status=draft&search=z8',
    )
  })

  it('removes blank filters', () => {
    expect(change('search=z8&low=true', { search: '' })).toBe('low=true')
  })

  it('can change the page', () => {
    expect(change('search=z8', { page: '2' })).toBe('search=z8&page=2')
  })
})
