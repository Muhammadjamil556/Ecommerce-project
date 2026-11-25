import { HttpStatus, Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

interface Options {
  isArray?: boolean;
  status?: HttpStatus;
}

/** Documents a response in Swagger as { "data": <model> }. */
export function ApiDataResponse(
  model: Type<unknown>,
  { isArray = false, status = HttpStatus.OK }: Options = {},
) {
  const reference = { $ref: getSchemaPath(model) };

  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status,
      schema: {
        type: 'object',
        required: ['data'],
        properties: {
          data: isArray ? { type: 'array', items: reference } : reference,
        },
      },
    }),
  );
}
