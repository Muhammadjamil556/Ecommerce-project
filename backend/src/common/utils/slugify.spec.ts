import { slugify } from './slugify.js';

describe('slugify', () => {
  it.each([
    ['Nikon Z8', 'nikon-z8'],
    ['NIKKOR Z 24-70mm f/4 S', 'nikkor-z-24-70mm-f-4-s'],
    ['  Café & Co.  ', 'cafe-co'],
    ['کیمرہ', ''],
  ])('turns "%s" into "%s"', (text, slug) => {
    expect(slugify(text)).toBe(slug);
  });
});
