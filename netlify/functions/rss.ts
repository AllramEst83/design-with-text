import Parser from 'rss-parser'

import type { Handler } from '@netlify/functions'

const parser = new Parser({
  timeout: 20000,
  headers: {
    'User-Agent': 'EditorialReader/1.0',
  },
})

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
    const feed = await parser.parseURL(feedUrl)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feed),
    }
  } catch (e) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: e instanceof Error ? e.message : 'Failed to fetch or parse feed',
      }),
    }
  }
}

