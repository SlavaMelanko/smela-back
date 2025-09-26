import type { Hono } from 'hono'

export const doRequest = (
  app: Hono,
  url: string,
  method: string = 'GET',
  body?: any,
  headers?: Record<string, string>,
) =>
  app.request(url, {
    method,
    ...(headers && { headers }),
    ...(body !== undefined && { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  })

export const post = (
  app: Hono,
  url: string,
  body?: any,
  headers: Record<string, string> = { 'Content-Type': 'application/json' },
) =>
  doRequest(app, url, 'POST', body, headers)

export const get = (
  app: Hono,
  url: string,
  headers?: Record<string, string>,
) =>
  doRequest(app, url, 'GET', undefined, headers)
