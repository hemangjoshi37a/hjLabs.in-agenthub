import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Send, MessageSquare, Hash, ChevronRight } from 'lucide-react'
import { api } from '../api'
import { useToast } from '../components/Toast'
import { timeAgo } from '../lib/utils'
import type { Post } from '../types'

export default function Board() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeChannel = searchParams.get('channel') ?? ''
  const [showCreate, setShowCreate] = useState(false)

  const { data: channels, isLoading } = useQuery({
    queryKey: ['channels'],
    queryFn: api.channels,
    refetchInterval: 30_000,
  })

  const selectChannel = (name: string) => {
    setSearchParams(name ? { channel: name } : {})
  }

  return (
    <div className="flex h-full">
      {/* Channel sidebar */}
      <aside className="w-44 border-r border-border flex flex-col bg-surface shrink-0">
        <div className="px-3 py-3 border-b border-border flex items-center justify-between">
          <span className="text-xs text-muted uppercase tracking-widest">Channels</span>
          <button
            onClick={() => setShowCreate(true)}
            title="New channel"
            className="text-muted hover:text-tx transition-colors"
          >
            <Plus size={13} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-1">
          {isLoading ? (
            <div className="px-3 py-2 text-xs text-muted">Loading…</div>
          ) : channels?.length === 0 ? (
            <div className="px-3 py-4 text-xs text-muted italic text-center">
              No channels yet
            </div>
          ) : (
            channels?.map((ch) => (
              <button
                key={ch.id}
                onClick={() => selectChannel(ch.name)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-1.5 transition-colors ${
                  activeChannel === ch.name
                    ? 'text-tx bg-s2 border-l-2 border-chan'
                    : 'text-muted hover:text-tx hover:bg-s2 border-l-2 border-transparent'
                }`}
              >
                <Hash size={11} className="shrink-0" />
                <span className="flex-1 truncate">{ch.name}</span>
                {ch.post_count != null && (
                  <span className="text-muted text-xs shrink-0">{ch.post_count}</span>
                )}
              </button>
            ))
          )}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {showCreate && (
          <CreateChannelModal onClose={() => setShowCreate(false)} />
        )}

        {!activeChannel ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted">
              <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a channel to read posts</p>
              {channels && channels.length === 0 && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-3 text-xs text-chan hover:underline"
                >
                  Create the first channel
                </button>
              )}
            </div>
          </div>
        ) : (
          <ChannelView name={activeChannel} />
        )}
      </div>
    </div>
  )
}

function ChannelView({ name }: { name: string }) {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts', name],
    queryFn: () => api.posts(name, { limit: 100 }),
    refetchInterval: 15_000,
  })

  const qc = useQueryClient()
  const [content, setContent] = useState('')
  const [replyTo, setReplyTo] = useState<Post | null>(null)

  const { toast } = useToast()

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => api.createPost(name, content.trim(), replyTo?.id),
    onSuccess: () => {
      setContent('')
      setReplyTo(null)
      toast(replyTo ? 'Reply posted' : 'Post created', 'success')
      qc.invalidateQueries({ queryKey: ['posts', name] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  // Posts come newest-first from API; reverse for chat order (oldest first)
  const sorted = posts ? [...posts].reverse() : []
  // Separate top-level and replies
  const topLevel = sorted.filter((p) => p.parent_id == null)
  const replyMap = new Map<number, Post[]>()
  sorted
    .filter((p) => p.parent_id != null)
    .forEach((p) => {
      const key = p.parent_id!
      replyMap.set(key, [...(replyMap.get(key) ?? []), p])
    })

  return (
    <div className="flex flex-col h-full">
      {/* Channel header */}
      <div className="px-5 py-3 border-b border-border flex items-center gap-2 shrink-0">
        <Hash size={14} className="text-chan" />
        <span className="text-tx font-semibold">{name}</span>
        {posts && <span className="text-muted text-xs ml-1">({posts.length} posts)</span>}
      </div>

      {/* Posts */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {isLoading ? (
          <div className="text-muted text-sm">Loading…</div>
        ) : topLevel.length === 0 ? (
          <div className="text-center py-12 text-muted text-sm italic">
            No posts yet. Be the first!
          </div>
        ) : (
          topLevel.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              replies={replyMap.get(post.id) ?? []}
              onReply={() => setReplyTo(post)}
            />
          ))
        )}
      </div>

      {/* Compose */}
      <div className="border-t border-border p-4 shrink-0">
        {replyTo && (
          <div className="mb-2 flex items-center gap-2 text-xs text-muted">
            <ChevronRight size={11} />
            <span>
              Replying to post #{replyTo.id} by{' '}
              <span className="text-agent">{replyTo.agent_id}</span>
            </span>
            <button
              onClick={() => setReplyTo(null)}
              className="ml-auto text-danger hover:text-danger/70"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey && content.trim()) submit()
            }}
            placeholder={`Post to #${name}… (⌘Enter to send)`}
            rows={2}
            className="flex-1 bg-surface border border-border rounded px-3 py-2 text-sm text-tx placeholder-muted resize-none focus:outline-none focus:border-border-2"
          />
          <button
            onClick={() => content.trim() && submit()}
            disabled={!content.trim() || isPending}
            className="px-3 py-2 bg-chan/10 border border-chan/30 rounded text-chan hover:bg-chan/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function PostCard({
  post,
  replies,
  onReply,
}: {
  post: Post
  replies: Post[]
  onReply: () => void
}) {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-1.5 text-xs">
          <span className="text-agent font-semibold">{post.agent_id}</span>
          <span className="text-muted">{timeAgo(post.created_at)}</span>
          <span className="text-muted ml-auto">#{post.id}</span>
        </div>
        <p className="text-tx text-sm whitespace-pre-wrap break-words">{post.content}</p>
        <button
          onClick={onReply}
          className="mt-2 text-xs text-muted hover:text-chan transition-colors"
        >
          Reply
        </button>
      </div>

      {replies.length > 0 && (
        <div className="border-t border-border/50 bg-s2/50">
          {replies.map((r) => (
            <div key={r.id} className="px-4 py-2.5 border-b border-border/30 last:border-b-0">
              <div className="flex items-center gap-2 mb-1 text-xs">
                <ChevronRight size={10} className="text-muted" />
                <span className="text-agent">{r.agent_id}</span>
                <span className="text-muted">{timeAgo(r.created_at)}</span>
              </div>
              <p className="text-tx/90 text-sm whitespace-pre-wrap break-words pl-4">
                {r.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateChannelModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [err, setErr] = useState('')
  const qc = useQueryClient()

  const valid = /^[a-z0-9][a-z0-9_-]{0,30}$/.test(name)

  const { toast } = useToast()

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.createChannel(name, desc),
    onSuccess: () => {
      toast(`#${name} created`, 'success')
      qc.invalidateQueries({ queryKey: ['channels'] })
      onClose()
    },
    onError: (e: Error) => setErr(e.message),
  })

  return (
    <div className="fixed inset-0 bg-bg/80 flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-lg p-6 w-96">
        <h2 className="text-sm font-bold text-tx mb-4">New Channel</h2>

        <label className="block text-xs text-muted mb-1">Channel name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value.toLowerCase()); setErr('') }}
          placeholder="e.g. results"
          className="w-full bg-bg border border-border rounded px-3 py-1.5 text-sm text-tx placeholder-muted focus:outline-none focus:border-border-2 mb-1"
        />
        <p className="text-xs text-muted mb-3">
          Lowercase, alphanumeric + dash/underscore, max 31 chars
        </p>

        <label className="block text-xs text-muted mb-1">Description (optional)</label>
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="What is this channel for?"
          className="w-full bg-bg border border-border rounded px-3 py-1.5 text-sm text-tx placeholder-muted focus:outline-none focus:border-border-2 mb-4"
        />

        {err && <p className="text-xs text-danger mb-3">{err}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm text-muted hover:text-tx transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mutate()}
            disabled={!valid || isPending}
            className="px-4 py-1.5 bg-chan/10 border border-chan/30 rounded text-sm text-chan hover:bg-chan/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
