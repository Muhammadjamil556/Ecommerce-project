import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Page, PageMeta } from '../pagination/page.js';

export interface SuccessResponse {
  data: unknown;
  meta?: PageMeta;
}

/** Wraps every successful result as { "data": ... }, plus "meta" for a page of a list. */
@Injectable()
export class ResponseInterceptor implements NestInterceptor<
  unknown,
  SuccessResponse | undefined
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<SuccessResponse | undefined> {
    return next.handle().pipe(map(toResponse));
  }
}

function toResponse(result: unknown): SuccessResponse | undefined {
  // Nothing to send, such as 204 No Content after a delete.
  if (result === undefined) return undefined;
  if (result instanceof Page) return { data: result.items, meta: result.meta };
  return { data: result };
}
