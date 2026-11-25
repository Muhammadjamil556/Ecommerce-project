import { escapeLike, toSearchPatterns } from './search-pattern.js';

describe('toSearchPatterns', () => {
  it('makes one pattern per word', () => {
    expect(toSearchPatterns('  nikon   z8 ')).toEqual(['%nikon%', '%z8%']);
  });

  it('treats wildcards as plain text', () => {
    expect(toSearchPatterns('100%_\\')).toEqual(['%100\\%\\_\\\\%']);
    expect(toSearchPatterns('*')).toEqual([]);
  });

  it('limits the number of words', () => {
    expect(toSearchPatterns('a b c d e f g h')).toHaveLength(6);
  });
});

describe('escapeLike', () => {
  it('removes the wildcard of the Supabase API', () => {
    expect(escapeLike('Nik*')).toBe('Nik');
  });
});
