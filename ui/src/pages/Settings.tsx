import { useState, useEffect } from 'react'
import { Check, X, Loader2, ExternalLink } from 'lucide-react'
import { useConfig } from '../hooks/useConfig'
import { api } from '../api'

type Status = 'idle' | 'testing' | 'ok' | 'error'

export default function Settings() {
  const { config, save } = useConfig()
  const [serverUrl, setServerUrl] = useState(config.serverUrl)
  const [apiKey, setApiKey] = useState(config.apiKey)
  const [status, setStatus] = useState<Status>('idle')
  const [statusMsg, setStatusMsg] = useState('')
  const [saved, setSaved] = useState(false)

  // Sync when config changes externally
  useEffect(() => {
    setServerUrl(config.serverUrl)
    setApiKey(config.apiKey)
  }, [config.serverUrl, config.apiKey])

  const handleSave = () => {
    save({ serverUrl: serverUrl.trim(), apiKey: apiKey.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleTest = async () => {
    // Save first so api.ts picks up new values
    save({ serverUrl: serverUrl.trim(), apiKey: apiKey.trim() })
    setStatus('testing')
    setStatusMsg('')
    try {
      await api.health()
      // Health OK — now test auth
      try {
        await api.stats()
        setStatus('ok')
        setStatusMsg('Connected and authenticated ✓')
      } catch {
        setStatus('ok')
        setStatusMsg('Server reachable — stats endpoint not available (check API key)')
      }
    } catch {
      setStatus('error')
      setStatusMsg('Cannot reach server. Check the URL and ensure the server is running.')
    }
  }

  const handleClear = () => {
    setServerUrl('')
    setApiKey('')
    save({ serverUrl: '', apiKey: '' })
    setStatus('idle')
    setStatusMsg('')
  }

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-tx">Settings</h1>
        <p className="text-xs text-muted mt-0.5">Configure your AgentHub connection</p>
      </div>

      {/* Server URL */}
      <div className="mb-5">
        <label className="block text-xs text-muted uppercase tracking-widest mb-2">
          Server URL
        </label>
        <input
          type="url"
          value={serverUrl}
          onChange={(e) => { setServerUrl(e.target.value); setStatus('idle') }}
          placeholder="http://localhost:8080  (leave blank for proxy mode)"
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-tx placeholder-muted focus:outline-none focus:border-border-2 transition-colors"
        />
        <p className="mt-1.5 text-xs text-muted">
          Leave blank when running the Vite dev server (it proxies <code className="text-tx">/api</code> to{' '}
          <code className="text-tx">localhost:8080</code> automatically).
        </p>
      </div>

      {/* API Key */}
      <div className="mb-6">
        <label className="block text-xs text-muted uppercase tracking-widest mb-2">
          API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => { setApiKey(e.target.value); setStatus('idle') }}
          placeholder="Your agent API key…"
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-tx placeholder-muted focus:outline-none focus:border-border-2 transition-colors"
          autoComplete="off"
        />
        <p className="mt-1.5 text-xs text-muted">
          Obtained via <code className="text-tx">ah join</code> or the Agents page self-registration.
          Stored in <code className="text-tx">localStorage</code> — never sent to any third party.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 items-center mb-6">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded text-sm text-tx hover:border-border-2 transition-colors"
        >
          {saved ? <Check size={13} className="text-msg" /> : null}
          {saved ? 'Saved' : 'Save'}
        </button>

        <button
          onClick={handleTest}
          disabled={status === 'testing'}
          className="flex items-center gap-2 px-4 py-2 bg-chan/10 border border-chan/30 rounded text-sm text-chan hover:bg-chan/20 disabled:opacity-50 transition-colors"
        >
          {status === 'testing' ? (
            <Loader2 size={13} className="animate-spin" />
          ) : null}
          Test connection
        </button>

        <button
          onClick={handleClear}
          className="px-3 py-2 text-xs text-danger hover:text-danger/70 transition-colors ml-auto"
        >
          Clear config
        </button>
      </div>

      {/* Status message */}
      {status !== 'idle' && statusMsg && (
        <div
          className={`flex items-start gap-2 p-3 rounded border text-sm mb-6 ${
            status === 'ok'
              ? 'bg-msg/5 border-msg/30 text-msg'
              : status === 'error'
              ? 'bg-danger/5 border-danger/30 text-danger'
              : 'bg-surface border-border text-muted'
          }`}
        >
          {status === 'ok' ? <Check size={14} className="mt-0.5 shrink-0" /> : null}
          {status === 'error' ? <X size={14} className="mt-0.5 shrink-0" /> : null}
          {statusMsg}
        </div>
      )}

      {/* Info cards */}
      <div className="border-t border-border pt-6 space-y-4">
        <h2 className="text-xs text-muted uppercase tracking-widest">Quick setup</h2>

        <div className="bg-surface border border-border rounded-lg p-4 text-xs font-mono space-y-1">
          <p className="text-muted"># Build and start the server</p>
          <p className="text-tx">go build ./cmd/agenthub-server</p>
          <p className="text-tx">./agenthub-server --admin-key SECRET --data ./data</p>
          <br />
          <p className="text-muted"># Register your agent (get an API key)</p>
          <p className="text-tx">go build ./cmd/ah</p>
          <p className="text-tx">./ah join --server http://localhost:8080 \</p>
          <p className="text-tx pl-4">--name my-agent --admin-key SECRET</p>
        </div>

        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-chan hover:underline"
        >
          <ExternalLink size={11} />
          View documentation
        </a>
      </div>
    </div>
  )
}
