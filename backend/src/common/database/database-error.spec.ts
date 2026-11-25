import { toHttpError } from './database-error.js';

describe('toHttpError', () => {
  it.each([
    ['23505', 409, 'Slug used'],
    ['23503', 409, 'Still in use'],
    ['23514', 400, 'A value is not allowed.'],
    ['23502', 400, 'A value is not allowed.'],
  ])('turns %s into %i', (code, status, message) => {
    const error = toHttpError({ code, message: 'secret detail' }, 'Saving', {
      duplicate: 'Slug used',
      reference: 'Still in use',
    });
    expect(error).toMatchObject({ status, message });
  });

  it('leaves unexpected errors as a 500', () => {
    const error = toHttpError({ code: '42501', message: 'denied' }, 'Saving');
    expect(error).not.toHaveProperty('status');
    expect(error.message).toBe('Saving failed: denied');
  });
});
