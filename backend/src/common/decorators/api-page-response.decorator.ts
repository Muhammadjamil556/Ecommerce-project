import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

/** Documents a list in Swagger as { "data": [<model>], "meta": { ... } }. */
export function ApiPageResponse(model: Type<unknown>) {
  const integer = { type: 'integer' };

  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        type: 'object',
        required: ['data', 'meta'],
        properties: {
          data: { type: 'array', items: { $ref: getSchemaPath(model) } },
          meta: {
            type: 'object',
            required: ['page', 'limit', 'total', 'totalPages'],
            properties: {
              page: integer,
              limit: integer,
              total: integer,
              totalPages: integer,
            },
          },
        },
      },
    }),
  );
}
