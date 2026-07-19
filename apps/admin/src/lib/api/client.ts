// Shared fetch helper for the four effective-happiness services. Calls go straight
// from the browser to each service's own port — there's no proxy/BFF for this
// internal tool, so CORS must be enabled on each service (see the CORS section
// of the admin app plan for the backend-side change).

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// None of these services verify identity today — they just read plain custom
// headers (X-Customer-Id / X-User-Id) with no auth check behind them. The admin
// console sends this fixed synthetic id so backend code that expects the header
// to be present still works; it is not a real authenticated identity.
export const ADMIN_IDENTITY = 'admin-console'

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  /** Extra headers, e.g. { 'X-Customer-Id': consumerId } for endpoints that need a specific identity. */
  headers?: Record<string, string>
}

async function parseErrorBody(response: Response): Promise<string> {
  const text = await response.text()
  if (!text) return response.statusText || `Request failed with status ${response.status}`
  try {
    // The backend's exception filters return `new ObjectResult(message)` — the
    // JSON body is a bare quoted string, not an object like { message: "..." }.
    const parsed = JSON.parse(text)
    if (typeof parsed === 'string') return parsed
    return text
  } catch {
    return text
  }
}

export async function request<T>(baseUrl: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options

  const response = await fetch(`${baseUrl}${path}`, {
    ...rest,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorBody(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  return text ? (JSON.parse(text) as T) : (undefined as T)
}

export function withAdminIdentity(headers?: Record<string, string>): Record<string, string> {
  return {
    'X-Customer-Id': ADMIN_IDENTITY,
    'X-User-Id': ADMIN_IDENTITY,
    ...headers,
  }
}

function requireEnv(key: string, fallback: string): string {
  const value = (import.meta.env as Record<string, string | undefined>)[key]
  return value ?? fallback
}

export const SERVICE_CATALOG_URL = requireEnv('VITE_SERVICE_CATALOG_URL', 'http://localhost:5062')
export const SERVICE_REQUEST_ORCHESTRATOR_URL = requireEnv(
  'VITE_SERVICE_REQUEST_ORCHESTRATOR_URL',
  'http://localhost:5063',
)
export const PROVIDER_REGISTRY_URL = requireEnv('VITE_PROVIDER_REGISTRY_URL', 'http://localhost:5064')
export const CONSUMERS_URL = requireEnv('VITE_CONSUMERS_URL', 'http://localhost:5065')
