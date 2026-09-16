/**
 * The one fetch helper for every backend call through the API gateway. Ported from the admin
 * console's client.ts, which already knows this backend's quirk: its exception filters return
 * `new ObjectResult(message)`, so an error body is a bare quoted string rather than
 * `{ message: "..." }`.
 *
 * Every call carries the access token as a bearer — the gateway validates it and injects the
 * downstream `X-User-Id`, so callers never send identity headers themselves. IdentityServer's own
 * endpoints don't go through here (see src/lib/auth.ts).
 */
import { getAccessToken } from "./auth";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string | number | undefined>;
};

async function parseErrorBody(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) return response.statusText || `Request failed with status ${response.status}`;
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed === "string") return parsed;
    return text;
  } catch {
    return text;
  }
}

function withQuery(path: string, query?: RequestOptions["query"]): string {
  if (!query) return path;
  const params = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
  return params ? `${path}?${params}` : path;
}

export async function request<T>(baseUrl: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, query, ...rest } = options;
  const token = await getAccessToken();

  const response = await fetch(`${baseUrl}${withQuery(path, query)}`, {
    ...rest,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorBody(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}
