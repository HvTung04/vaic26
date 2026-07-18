import { env } from '@/config/env';
import { clearToken, getToken } from './authToken';

/**
 * Thin fetch wrapper around the G.A.R.Y FastAPI backend (`/api/v1`).
 *
 * Responsibilities:
 *  - prefix the base URL and attach the Bearer JWT,
 *  - JSON-encode bodies (and pass through FormData untouched for uploads),
 *  - normalize both error shapes the backend emits — the contract's
 *    `{"error": {"code", "message"}}` and FastAPI's default `{"detail": ...}` —
 *    into a single {@link ApiError},
 *  - deep-convert snake_case response keys to camelCase so callers can map to
 *    the frontend's camelCase domain types.
 */

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  query?: Query;
  /** JSON body — ignored when `formData` is set. */
  body?: unknown;
  /** multipart/form-data body for file uploads. */
  formData?: FormData;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${env.apiBaseUrl}${path}`, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

const snakeToCamel = (key: string): string =>
  key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/** Recursively camelCase object keys; values (incl. node ids like `L6-t1-B01`) are untouched. */
export function camelizeKeys<T = unknown>(input: unknown): T {
  if (Array.isArray(input)) return input.map((v) => camelizeKeys(v)) as T;
  if (input !== null && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      out[snakeToCamel(key)] = camelizeKeys(value);
    }
    return out as T;
  }
  return input as T;
}

async function toApiError(response: Response): Promise<ApiError> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return new ApiError(response.status, 'http_error', response.statusText || 'Request failed');
  }
  const p = payload as Record<string, unknown>;
  // Contract shape: { error: { code, message, details? } }
  if (p && typeof p.error === 'object' && p.error !== null) {
    const e = p.error as Record<string, unknown>;
    return new ApiError(
      response.status,
      String(e.code ?? 'error'),
      String(e.message ?? 'Đã xảy ra lỗi'),
      e.details,
    );
  }
  // FastAPI default: { detail: string | [{msg, loc}] }
  const detail = p?.detail;
  const message =
    typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? (detail[0] as { msg?: string })?.msg ?? 'Dữ liệu không hợp lệ'
        : 'Đã xảy ra lỗi';
  return new ApiError(response.status, 'http_error', message, detail);
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData; // browser sets multipart boundary
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const response = await fetch(buildUrl(path, options.query), {
    method,
    headers,
    body,
    signal: options.signal,
  });

  if (response.status === 401) {
    // Token missing/expired — drop it so the UI can redirect to login.
    clearToken();
  }

  if (!response.ok) throw await toApiError(response);

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  return camelizeKeys<T>(JSON.parse(text));
}

export const http = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) =>
    request<T>('GET', path, { query, signal }),
  post: <T>(path: string, body?: unknown, query?: Query) =>
    request<T>('POST', path, { body, query }),
  postForm: <T>(path: string, formData: FormData) =>
    request<T>('POST', path, { formData }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  del: <T>(path: string) => request<T>('DELETE', path),
};
