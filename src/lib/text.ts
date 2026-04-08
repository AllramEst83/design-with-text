/** Strip tags for excerpts and Pretext measurement. */
export function stripHtml(s: string): string {
  if (!s) return ''
  const t = s.replace(/<[^>]+>/g, ' ')
  return t.replace(/\s+/g, ' ').trim()
}
