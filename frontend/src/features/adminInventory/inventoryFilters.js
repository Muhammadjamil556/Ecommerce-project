import { readPage, readSearch } from '@/lib/searchParams'

/** Reads the filters from the address. Values that make no sense are ignored. */
export function readInventoryFilters(searchParams) {
  return {
    search: readSearch(searchParams),
    low: searchParams.get('low') === 'true' ? true : undefined,
    page: readPage(searchParams),
  }
}
