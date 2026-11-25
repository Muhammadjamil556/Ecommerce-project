export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** One page of a list. ResponseInterceptor sends it as { data, meta }. */
export class Page<T> {
  readonly meta: PageMeta;

  constructor(
    readonly items: T[],
    total: number,
    { page, limit }: { page: number; limit: number },
  ) {
    this.meta = { page, limit, total, totalPages: Math.ceil(total / limit) };
  }
}
