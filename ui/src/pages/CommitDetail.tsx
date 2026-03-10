import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, GitCommit, ChevronRight, Download, Diff as DiffIcon } from 'lucide-react'
import { api } from '../api'
import { HashBadge } from '../components/HashBadge'
import { timeAgo, shortHash, formatDate } from '../lib/utils'

export default function CommitDetail() {
  const { hash } = useParams<{ hash: string }>()
  if (!hash) return null

  return <CommitView hash={hash} />
}

function CommitView({ hash }: { hash: string }) {
  const navigate = useNavigate()

  const { data: commit, isLoading, error } = useQuery({
    queryKey: ['commit', hash],
    queryFn: () => api.commit(hash),
  })

  const { data: children } = useQuery({
    queryKey: ['children', hash],
    queryFn: () => api.children(hash),
    enabled: Boolean(commit),
  })

  const { data: lineage } = useQuery({
    queryKey: ['lineage', hash],
    queryFn: () => api.lineage(hash),
    enabled: Boolean(commit),
  })

  const { data: diff, isLoading: diffLoading } = useQuery({
    queryKey: ['diff', commit?.parent_hash, hash],
    queryFn: () => api.diff(commit!.parent_hash, hash),
    enabled: Boolean(commit?.parent_hash),
  })

  if (isLoading) return <div className="p-8 text-muted">Loading…</div>
  if (error || !commit) return <div className="p-8 text-danger">Commit not found</div>

  const bundleUrl = api.downloadBundle(hash)

  return (
    <div className="p-8 max-w-4xl">
      {/* Back */}
      <Link
        to="/commits"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-tx mb-6 transition-colors"
      >
        <ArrowLeft size={12} />
        All commits
      </Link>

      {/* Header */}
      <div className="bg-surface border border-border rounded-lg p-5 mb-6">
        <div className="flex items-start gap-3">
          <GitCommit size={18} className="text-hash mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <HashBadge hash={hash} full className="mb-2 block" />
            <p className="text-tx text-base mb-3">{commit.message}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
              <span>
                Agent:{' '}
                <Link to={`/commits?agent=${commit.agent_id}`} className="text-agent hover:underline">
                  {commit.agent_id || '(seed)'}
                </Link>
              </span>
              <span title={formatDate(commit.created_at)}>{timeAgo(commit.created_at)}</span>
              {commit.parent_hash ? (
                <span className="flex items-center gap-1">
                  Parent: <HashBadge hash={commit.parent_hash} />
                </span>
              ) : (
                <span className="text-muted italic">Root commit</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            <a
              href={bundleUrl}
              download={`${shortHash(hash)}.bundle`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-bg border border-border rounded text-xs text-muted hover:text-tx hover:border-border-2 transition-colors"
              title="Download git bundle"
            >
              <Download size={12} />
              Bundle
            </a>
            <button
              onClick={() => navigate(`/diff?a=${commit.parent_hash ?? ''}&b=${hash}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-bg border border-border rounded text-xs text-muted hover:text-tx hover:border-border-2 transition-colors"
              title="Open in diff tool"
              disabled={!commit.parent_hash}
            >
              <DiffIcon size={12} />
              Diff
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Children */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <h2 className="text-xs text-muted uppercase tracking-widest mb-3">
            Children ({children?.length ?? 0})
          </h2>
          {!children?.length ? (
            <p className="text-muted text-xs italic">
              No children — this is a frontier commit
            </p>
          ) : (
            <div className="space-y-1">
              {children.map((c) => (
                <Link
                  key={c.hash}
                  to={`/commits/${c.hash}`}
                  className="flex items-center gap-2 p-1.5 rounded hover:bg-s2 transition-colors"
                >
                  <ChevronRight size={12} className="text-muted shrink-0" />
                  <code className="text-hash text-xs">{shortHash(c.hash)}</code>
                  <span className="text-msg text-xs truncate">{c.message}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Lineage */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <h2 className="text-xs text-muted uppercase tracking-widest mb-3">
            Lineage (ancestors)
          </h2>
          {!lineage?.length ? (
            <p className="text-muted text-xs italic">No ancestors</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {lineage.map((c, i) => (
                <Link
                  key={c.hash}
                  to={`/commits/${c.hash}`}
                  className="flex items-center gap-2 p-1.5 rounded hover:bg-s2 transition-colors"
                >
                  <span className="text-muted text-xs w-5 text-right shrink-0">{i}</span>
                  <code className="text-hash text-xs">{shortHash(c.hash)}</code>
                  <span className="text-msg text-xs truncate">{c.message}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Diff */}
      {commit.parent_hash && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-xs text-muted uppercase tracking-widest flex items-center gap-2">
              Diff vs parent{' '}
              <HashBadge hash={commit.parent_hash} />
            </h2>
          </div>
          {diffLoading ? (
            <div className="p-4 text-muted text-sm">Loading diff…</div>
          ) : !diff ? (
            <div className="p-4 text-muted text-sm italic">No diff available</div>
          ) : (
            <DiffViewer diff={diff} />
          )}
        </div>
      )}
    </div>
  )
}

function DiffViewer({ diff }: { diff: string }) {
  const lines = diff.split('\n')

  return (
    <pre className="text-xs overflow-x-auto p-4 leading-5 max-h-[600px] overflow-y-auto">
      {lines.map((line, i) => {
        let cls = 'text-tx/70'
        if (line.startsWith('+++') || line.startsWith('---')) {
          cls = 'text-muted font-bold'
        } else if (line.startsWith('+')) {
          cls = 'text-msg bg-msg/5 block'
        } else if (line.startsWith('-')) {
          cls = 'text-danger bg-danger/5 block'
        } else if (line.startsWith('@@')) {
          cls = 'text-chan'
        } else if (line.startsWith('diff ') || line.startsWith('index ')) {
          cls = 'text-muted'
        }
        return (
          <span key={i} className={cls}>
            {line + '\n'}
          </span>
        )
      })}
    </pre>
  )
}
