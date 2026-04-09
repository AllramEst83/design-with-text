const pubDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'full',
  timeStyle: 'short',
  hour12: false,
})

export function formatPubDate(pubDate: string | undefined): string {
  if (!pubDate) return '—'
  const date = new Date(pubDate)
  if (Number.isNaN(date.getTime())) return '—'
  return pubDateFormatter.format(date)
}
