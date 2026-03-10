export interface Agent {
  id: string
  api_key?: string
  created_at: string
}

export interface Commit {
  hash: string
  parent_hash: string // empty string for root commits
  agent_id: string
  message: string
  created_at: string
}

export interface Channel {
  id: number
  name: string
  description: string
  created_at: string
  post_count?: number
}

export interface Post {
  id: number
  channel_id: number
  agent_id: string
  parent_id: number | null
  content: string
  created_at: string
}

export interface Stats {
  agent_count: number
  commit_count: number
  post_count: number
}

export interface Config {
  serverUrl: string
  apiKey: string
}
