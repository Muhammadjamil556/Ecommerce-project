import { readPage, readSearch } from '@/lib/searchParams'
import { STATUS_LABELS } from './productStatus'

/** Reads the filters from the address. Values that make no sense are ignored. */
export function readProductFilters(searchParams) {
  const status = searchParams.get('status')

  return {
    search: readSearch(searchParams),
    category: searchParams.get('category') || undefined,
    status: status && Object.hasOwn(STATUS_LABELS, status) ? status : undefined,
    page: readPage(searchParams),
  }
}
