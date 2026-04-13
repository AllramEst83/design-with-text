export interface FeedItem {
  id: string
  title: string
  link: string
  pubDate?: string
  excerpt: string
  contentHtml: string
  feedUrl: string
  feedTitle: string
  fullArticleHtml?: string
  viewedAtMs?: number
  extractionStatus?: 'success' | 'failed'
}

export interface LoadedFeed {
  url: string
  title: string
  items: FeedItem[]
}
