const MAX_PAGE = 10_000

/** Reads a page number from the address. Values that make no sense become 1. */
export function readPage(searchParams) {
  const page = Number(searchParams.get('page'))
  return Number.isInteger(page) && page >= 1 && page <= MAX_PAGE ? page : 1
}

export function readSearch(searchParams) {
  return searchParams.get('search')?.trim().slice(0, 100) || undefined
}

/** Applies filter changes and goes back to page 1. Blank values are removed. */
export function changeFilters(searchParams, changes) {
  const next = new URLSearchParams(searchParams)
  for (const [key, value] of Object.entries({ page: '', ...changes })) {
    if (value) next.set(key, value)
    else next.delete(key)
  }
  return next
}
