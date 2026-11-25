/** Keeps only the fields that differ, so a save does not overwrite the others. */
export function pickChanges(before, after) {
  return Object.fromEntries(
    Object.entries(after).filter(
      ([key, value]) => toText(value) !== toText(before[key]),
    ),
  )
}

// The order of keys does not matter: the database does not keep it.
function toText(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  return JSON.stringify(
    Object.entries(value).toSorted(([a], [b]) => (a < b ? -1 : 1)),
  )
}
