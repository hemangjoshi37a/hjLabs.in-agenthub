import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Diff as DiffIcon, ArrowRight } from 'lucide-react'
import { api } from '../api'
import { shortHash } from '../lib/utils'

function DiffLine({ line }: { line: string }) {
  if (line.startsWith('+++') || line.startsWith('---')) {
    return <div className="text-muted text-xs px-3 py-0.5">{line}</div>
  }
  if (line.startsWith('@@')) {
    return (
      <div className="text-chan text-xs px-3 py-0.5 bg-chan/5 border-y border-chan/10">{line}</div>
    )
  }
  if (line.startsWith('+')) {
    return (
      <div className="text-msg text-xs px-3 py-0.5 bg-msg/5 whitespace-pre-wrap break-all">{line}</div>
    )
  }
  if (line.startsWith('-')) {
    return (
      <div className="text-danger text-xs px-3 py-0.5 bg-danger/5 whitespace-pre-wrap break-all">{line}</div>
    )
  }
  if (line.startsWith('diff ') || line.startsWith('index ') || line.startsWith('new file')) {
    return <div className="text-hash text-xs px-3 py-0.5 font-semibold">{line}</div>
  }
  return <div className="text-tx/70 text-xs px-3 py-0.5 whitespace-pre-wrap break-all">{line}</div>
}

export default function Diff() {
  const [params, setParams] = useSearchParams()
  const [hashA, setHashA] = useState(params.get('a') ?? '')
  const [hashB, setHashB] = useState(params.get('b') ?? '')
  const [applied, setApplied] = useState<{ a: string; b: string } | null>(
    params.get('a') && params.get('b') ? { a: params.get('a')!, b: params.get('b')! } : null
  )

  const { data: diff, isLoading, error } = useQuery({
    queryKey: ['diff', applied?.a, applied?.b],
    queryFn: () => api.diff(applied!.a, applied!.b),
    enabled: Boolean(applied?.a && applied?.b),
    retry: false,
  })

  const handleCompare = () => {
    const a = hashA.trim()
    const b = hashB.trim()
    if (!a || !b) return
    setApplied({ a, b })
    setParams({ a, b })
  }

  const lines = diff?.split('\n') ?? []

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-tx">Diff</h1>
        <p className="text-xs text-muted mt-0.5">Compare any two commits</p>
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-3 mb-8">
        <input
          type="text"
          placeholder="Commit hash A…"
          value={hashA}
          onChange={(e) => setHashA(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
          className="flex-1 bg-surface border border-border rounded px-3 py-2 text-sm text-tx placeholder-muted focus:outline-none focus:border-border-2 font-mono"
        />
        <ArrowRight size={16} className="text-muted shrink-0" />
        <input
          type="text"
          placeholder="Commit hash B…"
          value={hashB}
          onChange={(e) => setHashB(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
          className="flex-1 bg-surface border border-border rounded px-3 py-2 text-sm text-tx placeholder-muted focus:outline-none focus:border-border-2 font-mono"
        />
        <button
          onClick={handleCompare}
          disabled={!hashA.trim() || !hashB.trim()}
          className="px-5 py-2 bg-surface border border-border rounded text-sm text-tx hover:border-border-2 transition-colors disabled:opacity-40 flex items-center gap-2"
        >
          <DiffIcon size={14} />
          Compare
        </button>
      </div>

      {/* Hint */}
      {!applied && (
        <div className="text-muted text-sm italic py-8 text-center">
          Enter two commit hashes above to see the diff
        </div>
      )}

      {isLoading && <div className="text-muted text-sm py-4">Loading diff…</div>}

      {error && (
        <div className="text-danger text-sm py-4">
          {(error as Error).message}
        </div>
      )}

      {diff !== undefined && (
        <>
          <div className="flex items-center gap-3 mb-4 text-xs text-muted">
            <span>
              <Link to={`/commits/${applied!.a}`} className="text-hash hover:underline font-mono">
                {shortHash(applied!.a)}
              </Link>
            </span>
            <ArrowRight size={12} />
            <span>
              <Link to={`/commits/${applied!.b}`} className="text-hash hover:underline font-mono">
                {shortHash(applied!.b)}
              </Link>
            </span>
          </div>

          {lines.length === 0 || (lines.length === 1 && lines[0] === '') ? (
            <div className="text-muted text-sm italic py-4">No differences</div>
          ) : (
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="divide-y divide-border/30">
                {lines.map((line, i) => (
                  <DiffLine key={i} line={line} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
