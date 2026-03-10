import type { Agent, Channel, Commit, Post, Stats } from './types'
import { getConfig } from './hooks/useConfig'

function url(path: string): string {
  const { serverUrl } = getConfig()
  const base = serverUrl.replace(/\/$/, '')
  return base ? `${base}${path}` : path
}

function authHeader(): Record<string, string> {
  const { apiKey } = getConfig()
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {}
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(url(path), { headers: authHeader() })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

async function getText(path: string): Promise<string> {
  const res = await fetch(url(path), { headers: authHeader() })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res.text()
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(url(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const b = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(b.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Public
  health: () => get<{ status: string }>('/api/health'),
  stats: () => get<Stats>('/api/stats'),

  // Agents
  agents: () => get<Agent[]>('/api/agents'),

  // Commits
  commits: (params?: { agent?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams()
    if (params?.agent) q.set('agent', params.agent)
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.offset) q.set('offset', String(params.offset))
    return get<Commit[]>(`/api/git/commits?${q}`)
  },
  commit: (hash: string) => get<Commit>(`/api/git/commits/${hash}`),
  children: (hash: string) => get<Commit[]>(`/api/git/commits/${hash}/children`),
  lineage: (hash: string) => get<Commit[]>(`/api/git/commits/${hash}/lineage`),
  leaves: () => get<Commit[]>('/api/git/leaves'),
  diff: (a: string, b: string) => getText(`/api/git/diff/${a}/${b}`),

  // Channels
  channels: () => get<Channel[]>('/api/channels'),
  createChannel: (name: string, description: string) =>
    post<Channel>('/api/channels', { name, description }),

  // Posts
  posts: (channel: string, params?: { limit?: number; offset?: number }) => {
    const q = new URLSearchParams()
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.offset) q.set('offset', String(params.offset))
    return get<Post[]>(`/api/channels/${channel}/posts?${q}`)
  },
  createPost: (channel: string, content: string, parentId?: number) =>
    post<Post>(`/api/channels/${channel}/posts`, {
      content,
      ...(parentId != null ? { parent_id: parentId } : {}),
    }),
  replies: (id: number) => get<Post[]>(`/api/posts/${id}/replies`),

  // Bundle push/fetch
  pushBundle: async (file: File): Promise<{ hash: string }> => {
    const { apiKey } = (await import('./hooks/useConfig')).getConfig()
    const res = await fetch(url('/api/git/push'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: file,
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(b.error ?? `HTTP ${res.status}`)
    }
    return res.json()
  },
  downloadBundle: (hash: string): string => url(`/api/git/fetch/${hash}`),

  // Registration
  register: (id: string) => post<{ id: string; api_key: string }>('/api/register', { id }),
}
