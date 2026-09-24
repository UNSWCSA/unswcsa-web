export type Content = { introduction: string }
export type PublicContent = { content: Content; publishedAt: string | null }
export type DraftState = { revision: number; draft: Content; published: Content; previous: Content | null; publishedAt: string | null }

export class RequestError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/poc/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const value = await response.json()
  if (!response.ok) throw new RequestError(response.status, value.error || '请求失败，请重试。')
  return value as T
}

// Replace this adapter with Workers/GitHub integration in the next PoC stage.
export const contentSource = {
  published: () => request<PublicContent>('published'),
  session: () => request<{ authenticated: boolean }>('session'),
  login: () => request('login', {}),
  logout: () => request('logout', {}),
  draft: () => request<DraftState>('draft'),
  save: (revision: number, introduction: string) => request<DraftState>('draft', { revision, introduction }),
  publish: (revision: number) => request<DraftState>('publish', { revision }),
  restore: (revision: number) => request<DraftState>('restore', { revision }),
}
