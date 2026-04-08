import type { Handler } from '@netlify/functions'
import { extractFromXml } from '@extractus/feed-extractor'

import type { ExtractedFeed } from '../types/feed-extractor'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  const feedUrl = event.queryStringParameters?.url ?? ''
  if (!feedUrl) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing url query parameter' }),
    }
  }

  try {
    let parsed: URL
    try {
      parsed = new URL(feedUrl)
    } catch {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid url query parameter' }),
      }
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Only http/https URLs are supported' }),
      }
    }

    // Fetch in the function, then parse the XML string. This avoids `request`-based
    // fetching inside rss-parser (more reliable in serverless + better errors).
    const res = await fetch(parsed.toString(), {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'EditorialReader/1.0',
        Accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.1',
      },
    })
    if (!res.ok) {
      const snippet = (await res.text()).slice(0, 500)
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: `Upstream returned ${res.status} ${res.statusText}`,
          upstream: parsed.hostname,
          contentType: res.headers.get('content-type'),
          snippet,
        }),
      }
    }

    const contentType = res.headers.get('content-type') ?? ''
    const bodyText = await res.text()

    // Many news sites return HTML/paywall pages to bots; surface that clearly.
    const looksLikeXml =
      contentType.includes('xml') || bodyText.trimStart().startsWith('<?xml') || bodyText.trimStart().startsWith('<rss')
    if (!looksLikeXml) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Upstream did not return RSS/XML',
          upstream: parsed.hostname,
          contentType,
          snippet: bodyText.slice(0, 500),
        }),
      }
    }

    let extracted: ExtractedFeed
    try {
      extracted = extractFromXml(bodyText, {
        // Keep as much text as possible; we'll do our own excerpting.
        descriptionMaxLen: 0,
        useISODateFormat: true,
      }) as unknown as ExtractedFeed
    } catch (e) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: e instanceof Error ? e.message : 'Unable to parse XML',
          upstream: parsed.hostname,
          contentType,
          snippet: bodyText.slice(0, 500),
        }),
      }
    }

    // Normalize to the same shape the frontend expects from rss-parser.
    const title = (extracted.title && extracted.title.trim()) || parsed.hostname
    const items = (extracted.entries ?? []).map((en, index) => {
      const description = en.description ?? ''
      return {
        title: en.title ?? 'Untitled',
        link: en.link ?? '',
        pubDate: en.published ?? undefined,
        isoDate: en.published ?? undefined,
        guid: en.id ?? `${parsed.toString()}::${index}`,
        description,
        contentSnippet: description,
        content: description,
        'content:encoded': description,
      }
    })

    const payload = { title, items }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  } catch (e) {
    console.error('rss function error', e)
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: e instanceof Error ? e.message : 'Failed to fetch or parse feed',
      }),
    }
  }
}

