// Requests go to /api, which vite.config.ts proxies to the FastAPI server.
const BASE_URL = '/api'

async function request<T>(
  method: string,
  path: string,
  options: { signal?: AbortSignal; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    signal: options.signal,
    headers: {
      Accept: 'application/json',
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    // FastAPI puts the reason in a `detail` field; fall back to the status line.
    let detail = `${response.status} ${response.statusText}`
    try {
      const errorBody = (await response.json()) as { detail?: string }
      if (errorBody.detail) detail = errorBody.detail
    } catch {
      // Body was not JSON -- keep the status line.
    }
    throw new Error(`${method} ${path} failed: ${detail}`)
  }

  return (await response.json()) as T
}

export function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  return request<T>('GET', path, { signal })
}

export function postJson<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  return request<T>('POST', path, { body, signal })
}

export function patchJson<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  return request<T>('PATCH', path, { body, signal })
}
