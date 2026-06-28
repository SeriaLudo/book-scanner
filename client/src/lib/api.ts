const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8787';

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  token: string | null;
  body?: unknown;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions): Promise<T> {
  if (!options.token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${options.token}`,
      ...(options.body === undefined ? {} : {'Content-Type': 'application/json'}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? `Request failed with status ${response.status}`);
  }

  return payload as T;
}
