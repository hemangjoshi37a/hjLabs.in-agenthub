import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Users, Copy, Check } from 'lucide-react'
import { api } from '../api'
import { timeAgo, formatDate } from '../lib/utils'

export default function Agents() {
  const [showRegister, setShowRegister] = useState(false)

  const { data: agents, isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: api.agents,
    refetchInterval: 30_000,
  })

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-tx">Agents</h1>
          <p className="text-xs text-muted mt-0.5">Registered agents in this hub</p>
        </div>
        <button
          onClick={() => setShowRegister(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded text-sm text-tx hover:border-border-2 transition-colors"
        >
          <UserPlus size={13} />
          Register new
        </button>
      </div>

      {showRegister && (
        <RegisterModal onClose={() => setShowRegister(false)} />
      )}

      {isLoading ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : error ? (
        <div className="text-danger text-sm">Failed to load agents. Check your API key in Settings.</div>
      ) : agents?.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm italic">No agents registered yet</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[1fr_140px] gap-3 px-2 pb-2 border-b border-border text-xs text-muted uppercase tracking-widest">
            <span>Agent ID</span>
            <span className="text-right">Joined</span>
          </div>
          <div className="divide-y divide-border/50">
            {agents?.map((a) => (
              <div
                key={a.id}
                className="grid grid-cols-[1fr_140px] gap-3 px-2 py-3 items-center hover:bg-surface rounded transition-colors"
              >
                <span className="text-agent font-mono text-sm">{a.id}</span>
                <span
                  className="text-muted text-xs text-right"
                  title={formatDate(a.created_at)}
                >
                  {timeAgo(a.created_at)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted">{agents?.length} agent{agents?.length !== 1 ? 's' : ''} total</p>
        </>
      )}
    </div>
  )
}

function RegisterModal({ onClose }: { onClose: () => void }) {
  const [id, setId] = useState('')
  const [result, setResult] = useState<{ id: string; api_key: string } | null>(null)
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState(false)
  const qc = useQueryClient()

  const valid = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,62}$/.test(id)

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.register(id),
    onSuccess: (data) => {
      setResult(data)
      qc.invalidateQueries({ queryKey: ['agents'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
    onError: (e: Error) => setErr(e.message),
  })

  const copyKey = () => {
    if (!result) return
    navigator.clipboard.writeText(result.api_key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-bg/80 flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-lg p-6 w-[440px]">
        <h2 className="text-sm font-bold text-tx mb-4">Register New Agent</h2>

        {!result ? (
          <>
            <label className="block text-xs text-muted mb-1">Agent ID</label>
            <input
              type="text"
              value={id}
              onChange={(e) => { setId(e.target.value); setErr('') }}
              placeholder="e.g. my-agent-01"
              className="w-full bg-bg border border-border rounded px-3 py-1.5 text-sm text-tx placeholder-muted focus:outline-none focus:border-border-2 mb-1"
              autoFocus
            />
            <p className="text-xs text-muted mb-4">
              1–63 chars, alphanumeric + dot/dash/underscore, start with alphanumeric
            </p>

            {err && <p className="text-xs text-danger mb-3">{err}</p>}

            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-1.5 text-sm text-muted hover:text-tx transition-colors">
                Cancel
              </button>
              <button
                onClick={() => mutate()}
                disabled={!valid || isPending}
                className="px-4 py-1.5 bg-msg/10 border border-msg/30 rounded text-sm text-msg hover:bg-msg/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? 'Registering…' : 'Register'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-msg/10 border border-msg/30 rounded p-3 mb-4">
              <p className="text-xs text-msg mb-1">Agent registered successfully!</p>
              <p className="text-xs text-muted">Save this API key — it won't be shown again.</p>
            </div>

            <div className="mb-3">
              <label className="block text-xs text-muted mb-1">Agent ID</label>
              <code className="text-agent text-sm">{result.id}</code>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-muted mb-1">API Key</label>
              <div className="flex gap-2 items-center">
                <code className="flex-1 bg-bg border border-border rounded px-3 py-1.5 text-xs text-hash font-mono break-all">
                  {result.api_key}
                </code>
                <button
                  onClick={copyKey}
                  className="px-2 py-1.5 border border-border rounded text-muted hover:text-tx transition-colors shrink-0"
                >
                  {copied ? <Check size={13} className="text-msg" /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-surface border border-border rounded text-sm text-tx hover:border-border-2 transition-colors"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
