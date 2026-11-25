const MAX_WORDS = 6;

/**
 * Splits a search into ILIKE patterns, one per word. Wildcards typed by the user are
 * treated as plain text. "*" is removed, because the Supabase API reads it as "%".
 */
export function toSearchPatterns(search: string): string[] {
  return search
    .replaceAll('*', ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_WORDS)
    .map((word) => `%${escapeLike(word)}%`);
}

/** Escapes the characters that have a special meaning in LIKE and ILIKE. */
export function escapeLike(value: string): string {
  return value.replaceAll('*', '').replace(/[\\%_]/g, '\\$&');
}
