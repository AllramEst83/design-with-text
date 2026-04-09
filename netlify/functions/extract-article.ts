import type { Handler } from '@netlify/functions'
import { extractFromHtml } from '@extractus/article-extractor'

import { guardOrigin } from './utils/origin-guard'

const FETCH_TIMEOUT_MS = 8000

export const handler: Handler = async (event) => {
  const { isAllowed, corsHeaders } = await guardOrigin(event)

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: isAllowed ? 204 : 403,
      headers: corsHeaders,
      body: '',
    }
  }

  if (!isAllowed) {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Forbidden origin' }),
    }
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  const articleUrl = event.queryStringParameters?.url ?? ''
  if (!articleUrl) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing url query parameter' }),
    }
  }

  let parsed: URL
  try {
    parsed = new URL(articleUrl)
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid url query parameter' }),
    }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Only http/https URLs are supported' }),
    }
  }

  try {
    const res = await fetch(parsed.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'User-Agent': 'EditorialReader/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.1',
      },
    })

    if (!res.ok) {
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({
          error: `Upstream returned ${res.status} ${res.statusText}`,
          upstream: parsed.hostname,
        }),
      }
    }

    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('html') && !contentType.includes('xml')) {
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Upstream did not return HTML',
          upstream: parsed.hostname,
          contentType,
        }),
      }
    }

    const html = await res.text()

    const article = await extractFromHtml(html, parsed.toString())

    if (!article?.content) {
      return {
        statusCode: 204,
        headers: corsHeaders,
        body: '',
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        content: article.content,
        title: article.title ?? null,
        author: article.author ?? null,
        published: article.published ?? null,
      }),
    }
  } catch (e) {
    const isTimeout = e instanceof DOMException && e.name === 'TimeoutError'
    console.error('extract-article error', isTimeout ? 'timeout' : e)
    return {
      statusCode: 502,
      headers: corsHeaders,
      body: JSON.stringify({
        error: isTimeout ? 'Request timed out' : (e instanceof Error ? e.message : 'Extraction failed'),
      }),
    }
  }
}
