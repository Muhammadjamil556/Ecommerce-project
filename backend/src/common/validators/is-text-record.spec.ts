import { isTextRecord } from './is-text-record.decorator.js';

const limits = { maxEntries: 2, maxKeyLength: 5, maxValueLength: 5 };

describe('isTextRecord', () => {
  it('accepts text values and an empty object', () => {
    expect(isTextRecord({ Color: 'Black' }, limits)).toBe(true);
    expect(isTextRecord({}, limits)).toBe(true);
  });

  it.each([
    ['null', null],
    ['an array', ['a']],
    ['a number value', { a: 1 }],
    ['a nested object', { a: { b: 'c' } }],
    ['too many entries', { a: 'a', b: 'b', c: 'c' }],
    ['a long key', { abcdef: 'a' }],
    ['a long value', { a: 'abcdef' }],
    ['a blank value', { a: ' ' }],
    ['an unsafe key', JSON.parse('{"__proto__":"a"}')],
  ])('rejects %s', (_name, value) => {
    expect(isTextRecord(value, limits)).toBe(false);
  });
});
