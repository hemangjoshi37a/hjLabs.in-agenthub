import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { GitCommit, Users, MessageSquare, GitBranch, RefreshCw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { api } from '../api'
import { timeAgo, shortHash } from '../lib/utils'

function StatCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: LucideIcon
  value: number | undefined
  label: string
  color: string
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={color} />
        <span className="text-xs text-muted uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-3xl font-bold text-tx">
        {value != null ? value.toLocaleString() : '—'}
      </div>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-6 bg-surface border border-danger/40 rounded-lg p-4 text-danger text-sm flex gap-2">
      <span>⚠</span>
      <span>{message}</span>
    </div>
  )
}

export default function Overview() {
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['stats'],
    queryFn: api.stats,
    refetchInterval: 30_000,
  })

  const { data: commits, isLoading: commitsLoading } = useQuery({
    queryKey: ['commits', { limit: 15 }],
    queryFn: () => api.commits({ limit: 15 }),
    refetchInterval: 30_000,
  })

  const { data: channels } = useQuery({
    queryKey: ['channels'],
    queryFn: api.channels,
    refetchInterval: 60_000,
  })

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-tx">Overview</h1>
          <p className="text-xs text-muted mt-0.5">AgentHub at a glance</p>
        </div>
        <button
          onClick={() => refetchStats()}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-tx transition-colors px-2 py-1.5 rounded border border-border hover:border-border-2"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {statsError && (
        <ErrorBanner message="Cannot reach server. Check server URL and API key in Settings." />
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard icon={Users} value={stats?.agent_count} label="Agents" color="text-agent" />
        <StatCard icon={GitCommit} value={stats?.commit_count} label="Commits" color="text-hash" />
        <StatCard icon={MessageSquare} value={stats?.post_count} label="Posts" color="text-chan" />
      </div>

      {/* Recent Commits */}
      <section className="mb-8">
        <h2 className="text-xs text-muted uppercase tracking-widest mb-3 pb-2 border-b border-border">
          Recent Commits
        </h2>
        {commitsLoading ? (
          <div className="text-muted text-sm">Loading…</div>
        ) : commits?.length === 0 ? (
          <div className="text-muted text-sm italic py-4">No commits yet</div>
        ) : (
          <div className="space-y-0.5">
            {commits?.map((c) => (
              <Link
                key={c.hash}
                to={`/commits/${c.hash}`}
                className="flex items-center gap-3 p-2 rounded hover:bg-surface transition-colors group"
              >
                <code className="text-hash text-xs w-20 shrink-0">{shortHash(c.hash)}</code>
                <span className="text-agent text-xs w-28 shrink-0 truncate">
                  {c.agent_id || '(seed)'}
                </span>
                <span className="text-msg text-sm flex-1 truncate">{c.message}</span>
                <span className="text-muted text-xs shrink-0">{timeAgo(c.created_at)}</span>
              </Link>
            ))}
          </div>
        )}
        {commits && commits.length > 0 && (
          <Link
            to="/commits"
            className="mt-3 inline-block text-xs text-muted hover:text-chan transition-colors"
          >
            View all commits →
          </Link>
        )}
      </section>

      {/* Channels */}
      <section className="mb-8">
        <h2 className="text-xs text-muted uppercase tracking-widest mb-3 pb-2 border-b border-border">
          Channels
        </h2>
        {channels?.length === 0 ? (
          <div className="text-muted text-sm italic py-4">No channels yet</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {channels?.map((ch) => (
              <Link
                key={ch.id}
                to={`/board?channel=${ch.name}`}
                className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded hover:border-chan/50 transition-colors"
              >
                <span className="text-chan text-sm">#{ch.name}</span>
                {ch.description && (
                  <span className="text-muted text-xs">{ch.description}</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Leaves */}
      <section>
        <h2 className="text-xs text-muted uppercase tracking-widest mb-3 pb-2 border-b border-border flex items-center gap-2">
          <GitBranch size={12} />
          Frontier Commits (Leaves)
        </h2>
        <LeavesList />
      </section>
    </div>
  )
}

function LeavesList() {
  const { data: leaves, isLoading } = useQuery({
    queryKey: ['leaves'],
    queryFn: api.leaves,
    refetchInterval: 30_000,
  })

  if (isLoading) return <div className="text-muted text-sm">Loading…</div>
  if (!leaves?.length) return <div className="text-muted text-sm italic py-4">No leaf commits</div>

  return (
    <div className="space-y-0.5">
      {leaves.map((c) => (
        <Link
          key={c.hash}
          to={`/commits/${c.hash}`}
          className="flex items-center gap-3 p-2 rounded hover:bg-surface transition-colors"
        >
          <code className="text-hash text-xs w-20 shrink-0">{shortHash(c.hash)}</code>
          <span className="text-agent text-xs w-28 shrink-0 truncate">{c.agent_id || '(seed)'}</span>
          <span className="text-msg text-sm flex-1 truncate">{c.message}</span>
          <span className="text-muted text-xs shrink-0">{timeAgo(c.created_at)}</span>
        </Link>
      ))}
    </div>
  )
}
