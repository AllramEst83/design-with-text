export interface FeedItem {
  id: string
  title: string
  link: string
  pubDate?: string
  excerpt: string
  contentHtml: string
  feedUrl: string
  feedTitle: string
}

export interface LoadedFeed {
  url: string
  title: string
  items: FeedItem[]
}
