import { AppError, ErrorCode } from '@/errors'

import { withTimeout } from './async'
import logger from './logger'
import { makeUrl, removeTrailingSlash } from './url'

export type Headers = Record<string, string>
export type Body = string | FormData | URLSearchParams

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Headers
  body?: Body
  timeout?: number
}

export interface HttpClientOptions {
  headers?: Headers
  timeout?: number
}

export class HttpClient {
  private baseUrl: string
  private defaultOptions: Required<HttpClientOptions>

  constructor(baseUrl: string, defaultOptions: HttpClientOptions = {}) {
    this.baseUrl = removeTrailingSlash(baseUrl)
    this.defaultOptions = {
      headers: defaultOptions.headers ?? {},
      timeout: defaultOptions.timeout ?? 10000,
    }
  }

  private async request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = makeUrl(this.baseUrl, path)
    const timeout = options.timeout ?? this.defaultOptions.timeout

    const config: RequestInit = {
      method: options.method || 'GET',
      headers: {
        ...this.defaultOptions.headers,
        ...options.headers,
      },
    }

    if (options.body) {
      config.body = options.body
    }

    const response = await withTimeout(
      async () => fetch(url, config),
      timeout,
    )

    if (!response.ok) {
      logger.error(`API request failed: ${response.status} ${response.statusText} - ${url}`)

      throw new AppError(ErrorCode.InternalError)
    }

    return response.json() as Promise<T>
  }

  async get<T = any>(path: string, headers?: Headers): Promise<T> {
    return this.request<T>(path, { method: 'GET', headers })
  }

  async post<T = any>(path: string, body?: Body, headers?: Headers): Promise<T> {
    return this.request<T>(path, { method: 'POST', body, headers })
  }

  async put<T = any>(path: string, body?: Body, headers?: Headers): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body, headers })
  }

  async delete<T = any>(path: string, headers?: Headers): Promise<T> {
    return this.request<T>(path, { method: 'DELETE', headers })
  }
}
