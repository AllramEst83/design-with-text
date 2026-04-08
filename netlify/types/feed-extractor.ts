export interface ExtractedEntry {
  id?: string
  title?: string
  link?: string
  description?: string
  published?: string
}

export interface ExtractedFeed {
  title?: string
  link?: string
  description?: string
  language?: string
  published?: string
  entries?: ExtractedEntry[]
}

