import { STATUS_LABELS } from './productStatus'

const MAX_PAGE = 10_000

/** Reads the filters from the address. Values that make no sense are ignored. */
export function readProductFilters(searchParams) {
  const text = (key) => searchParams.get(key)?.trim() || undefined
  const page = Number(searchParams.get('page'))
  const status = text('status')

  return {
    search: text('search')?.slice(0, 100),
    category: text('category'),
    status: status && Object.hasOwn(STATUS_LABELS, status) ? status : undefined,
    page: Number.isInteger(page) && page >= 1 && page <= MAX_PAGE ? page : 1,
  }
}
