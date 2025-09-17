import { makeUrl, removeTrailingSlash } from './url'

export type Headers = Record<string, string>
export type Body = string | FormData | URLSearchParams

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Headers
  body?: Body
}

export class ApiClient {
  private baseUrl: string
  private defaultHeaders: Headers

  constructor(baseUrl: string, defaultHeaders: Headers = {}) {
    this.baseUrl = removeTrailingSlash(baseUrl)
    this.defaultHeaders = defaultHeaders
  }

  private async request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = makeUrl(this.baseUrl, path)

    const config: RequestInit = {
      method: options.method || 'GET',
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    }

    if (options.body) {
      config.body = options.body
    }

    const response = await fetch(url, config)

    return response.json()
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
