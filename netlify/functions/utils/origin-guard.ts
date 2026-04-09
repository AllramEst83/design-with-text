import type { HandlerEvent } from '@netlify/functions'
import { resolve } from 'node:path'

let hasLoadedDotenv = false
let cachedOriginEnvRaw: string | null = null
let cachedApprovedOrigins: Set<string> | null = null

async function loadDotenvOnce(): Promise<void> {
  if (hasLoadedDotenv) return
  hasLoadedDotenv = true

  try {
    const { config } = await import('dotenv')
    config({ path: resolve(process.cwd(), '.env') })
    config({ path: resolve(process.cwd(), 'netlify/.env') })
    //log allowed origins
    console.log('Allowed origins:', process.env.APPROVED_ORIGINS)
  } catch {
    console.error('Failed to load .env file')
  }
}

function normalizeOrigin(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  try {
    return new URL(trimmed).origin
  } catch {
    return null
  }
}

function getHeader(headers: HandlerEvent['headers'], key: string): string | null {
  const value = headers[key] ?? headers[key.toLowerCase()] ?? headers[key.toUpperCase()]
  return typeof value === 'string' ? value : null
}

function getRequestOrigin(event: HandlerEvent): string | null {
  const originHeader = getHeader(event.headers, 'origin')
  const normalizedOrigin = originHeader ? normalizeOrigin(originHeader) : null
  if (normalizedOrigin) return normalizedOrigin

  // Browsers can omit Origin for same-origin GET requests.
  const host = getHeader(event.headers, 'x-forwarded-host') ?? getHeader(event.headers, 'host')
  const proto =
    getHeader(event.headers, 'x-forwarded-proto')
    ?? (host && (host.includes('localhost') || host.startsWith('127.0.0.1')) ? 'http' : 'https')
  const hostOrigin = host ? normalizeOrigin(`${proto}://${host}`) : null
  if (hostOrigin) return hostOrigin

  // Final fallback for local runtimes where only rawUrl is consistently present.
  const rawUrl = 'rawUrl' in event && typeof event.rawUrl === 'string' ? event.rawUrl : null
  if (!rawUrl) return null
  return normalizeOrigin(rawUrl)
}

function getApprovedOrigins(): Set<string> {
  const raw = process.env.APPROVED_ORIGINS ?? ''
  if (cachedApprovedOrigins && cachedOriginEnvRaw === raw) {
    return cachedApprovedOrigins
  }

  const origins = new Set(
    raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(normalizeOrigin)
    .filter((o): o is string => Boolean(o)),
  )

  cachedOriginEnvRaw = raw
  cachedApprovedOrigins = origins
  return origins
}

function buildCorsHeaders(origin: string | null, isAllowed: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }

  if (isAllowed && origin) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

export interface OriginGuardResult {
  isAllowed: boolean
  origin: string | null
  corsHeaders: Record<string, string>
}

export async function guardOrigin(event: HandlerEvent): Promise<OriginGuardResult> {
  await loadDotenvOnce()

  const origin = getRequestOrigin(event)
  const approvedOrigins = getApprovedOrigins()
  const isAllowed = origin !== null && approvedOrigins.has(origin)

  return {
    isAllowed,
    origin,
    corsHeaders: buildCorsHeaders(origin, isAllowed),
  }
}
