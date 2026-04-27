import type { LHMResponse } from './types'

export class ConnectionError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly isTimeout?: boolean
  ) {
    super(message)
    this.name = 'ConnectionError'
  }
}

export interface FetchResult {
  data: LHMResponse
  latencyMs: number
}

/**
 * 从 LHM 服务端拉取数据，自带超时控制。
 * 成功返回 { data, latencyMs }，失败抛出 ConnectionError。
 */
export async function fetchLHMData(
  baseUrl: string,
  timeoutMs: number = 5000
): Promise<FetchResult> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  const t0 = performance.now()

  try {
    const res = await fetch(`${baseUrl}/data.json`, {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' },
    })

    if (!res.ok) {
      throw new ConnectionError(
        `Server responded with ${res.status}`,
        res.status
      )
    }

    const json: LHMResponse = await res.json()
    const latencyMs = Math.round(performance.now() - t0)

    return { data: json, latencyMs }
  } catch (err: any) {
    if (err instanceof ConnectionError) throw err

    if (err.name === 'AbortError') {
      throw new ConnectionError('Request timed out', undefined, true)
    }

    throw new ConnectionError(
      err.message || 'Network error'
    )
  } finally {
    clearTimeout(timeoutId)
  }
}
