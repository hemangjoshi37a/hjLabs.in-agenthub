import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, ChevronDown, Upload, X } from 'lucide-react'
import { api } from '../api'
import { useToast } from '../components/Toast'
import { HashBadge } from '../components/HashBadge'
import { timeAgo } from '../lib/utils'
import type { Commit } from '../types'

const PAGE = 25

export default function Commits() {
  const [agentFilter, setAgentFilter] = useState('')
  const [offset, setOffset] = useState(0)
  const [allCommits, setAllCommits] = useState<Commit[]>([])
  const [applied, setApplied] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['commits', { agent: applied, limit: PAGE, offset }],
    queryFn: async () => {
      const page = await api.commits({ agent: applied || undefined, limit: PAGE, offset })
      if (offset === 0) {
        setAllCommits(page)
      } else {
        setAllCommits((prev: Commit[]) => [...prev, ...page])
      }
      return page
    },
    staleTime: 15_000,
  })

  const { mutate: pushBundle, isPending: pushing } = useMutation({
    mutationFn: (file: File) => api.pushBundle(file),
    onSuccess: (res) => {
      toast(`Bundle pushed: ${res.hash.slice(0, 8)}`, 'success')
      qc.invalidateQueries({ queryKey: ['commits'] })
      qc.invalidateQueries({ queryKey: ['leaves'] })
    },
    onError: (err: Error) => toast(err.message, 'error'),
  })

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.bundle')) {
      toast('Please select a .bundle file', 'error')
      return
    }
    pushBundle(file)
  }

  const hasMore = (data?.length ?? 0) === PAGE

  const handleSearch = () => {
    setOffset(0)
    setApplied(agentFilter.trim())
  }

  const loadMore = () => setOffset((o: number) => o + PAGE)

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-tx">Commits</h1>
          <p className="text-xs text-muted mt-0.5">All commits in the hub</p>
        </div>

        {/* Push bundle */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".bundle"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
              e.target.value = ''
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={pushing}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded text-sm text-muted hover:text-tx hover:border-border-2 transition-colors disabled:opacity-50"
          >
            <Upload size={13} />
            {pushing ? 'Pushing…' : 'Push Bundle'}
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const f = e.dataTransfer.files[0]
          if (f) handleFile(f)
        }}
        className={`mb-6 border-2 border-dashed rounded-lg py-6 text-center text-sm transition-colors ${
          dragOver
            ? 'border-hash/60 bg-hash/5 text-hash'
            : 'border-border text-muted hover:border-border-2 hover:text-tx'
        }`}
      >
        <Upload size={20} className="mx-auto mb-2 opacity-50" />
        Drag &amp; drop a <code>.bundle</code> file here, or click "Push Bundle"
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Filter by agent ID…"
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-surface border border-border rounded pl-8 pr-3 py-1.5 text-sm text-tx placeholder-muted focus:outline-none focus:border-border-2"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-1.5 bg-surface border border-border rounded text-sm text-tx hover:border-border-2 transition-colors"
        >
          Filter
        </button>
        {applied && (
          <button
            onClick={() => {
              setAgentFilter('')
              setOffset(0)
              setApplied('')
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-danger hover:text-danger/80 transition-colors"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[80px_120px_1fr_100px] gap-3 px-2 pb-2 border-b border-border text-xs text-muted uppercase tracking-widest">
        <span>Hash</span>
        <span>Agent</span>
        <span>Message</span>
        <span className="text-right">When</span>
      </div>

      {/* Rows */}
      {isLoading ? (
        <div className="py-8 text-center text-muted text-sm">Loading…</div>
      ) : allCommits.length === 0 ? (
        <div className="py-8 text-center text-muted text-sm italic">No commits found</div>
      ) : (
        <>
          <div className="divide-y divide-border/50">
            {allCommits.map((c) => (
              <CommitRow key={c.hash} commit={c} />
            ))}
          </div>

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={isFetching}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm text-muted hover:text-tx border border-border rounded hover:border-border-2 transition-colors"
            >
              <ChevronDown size={14} />
              {isFetching ? 'Loading…' : 'Load more'}
            </button>
          )}
        </>
      )}
    </div>
  )
}

function CommitRow({ commit: c }: { commit: Commit }) {
  return (
    <Link
      to={`/commits/${c.hash}`}
      className="grid grid-cols-[80px_120px_1fr_100px] gap-3 px-2 py-2.5 hover:bg-surface rounded transition-colors items-center group"
    >
      <HashBadge hash={c.hash} />
      <span className="text-agent text-xs truncate">{c.agent_id || '(seed)'}</span>
      <span className="text-msg text-sm truncate">{c.message}</span>
      <span className="text-muted text-xs text-right">{timeAgo(c.created_at)}</span>
    </Link>
  )
}
