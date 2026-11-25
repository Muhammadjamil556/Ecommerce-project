const formatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** Shows an API date in the reader's own time zone. */
export function formatDate(isoDate) {
  return formatter.format(new Date(isoDate))
}
