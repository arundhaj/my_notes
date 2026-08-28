// Requests go to /api, which vite.config.ts proxies to the FastAPI server.
const BASE_URL = '/api'

export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    signal,
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    // FastAPI puts the reason in a `detail` field; fall back to the status line.
    let detail = `${response.status} ${response.statusText}`
    try {
      const body = (await response.json()) as { detail?: string }
      if (body.detail) detail = body.detail
    } catch {
      // Body was not JSON -- keep the status line.
    }
    throw new Error(`GET ${path} failed: ${detail}`)
  }

  return (await response.json()) as T
}
