// Prices travel as whole paisa, because decimals cannot hold money exactly.
const PAISA_PER_RUPEE = 100
const MAX_PAISA = 2_147_483_647 // largest price the database can store

/** 99999900 becomes "Rs 999,999". */
export function formatPrice(paisa) {
  return `Rs ${(paisa / PAISA_PER_RUPEE).toLocaleString('en-US', {
    minimumFractionDigits: paisa % PAISA_PER_RUPEE === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

/** Text for a price input: 99999900 becomes "999999". */
export function toPriceInput(paisa) {
  const rupees = Math.floor(paisa / PAISA_PER_RUPEE)
  const rest = paisa % PAISA_PER_RUPEE
  return rest === 0 ? `${rupees}` : `${rupees}.${`${rest}`.padStart(2, '0')}`
}

/** "999,999.50" becomes 99999950. Returns null when it is not a valid price. */
export function parsePrice(text) {
  const match = text
    .trim()
    .replaceAll(',', '')
    .match(/^(\d{1,8})(?:\.(\d{1,2}))?$/)
  if (!match) return null

  const [, rupees, rest = ''] = match
  const paisa = Number(rupees) * PAISA_PER_RUPEE + Number(rest.padEnd(2, '0'))
  return paisa >= 1 && paisa <= MAX_PAISA ? paisa : null
}
