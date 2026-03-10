import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { shortHash } from '../lib/utils'

interface HashBadgeProps {
  hash: string
  full?: boolean
  className?: string
}

export function HashBadge({ hash, full = false, className = '' }: HashBadgeProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(hash).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const display = full ? hash : shortHash(hash)

  return (
    <span
      className={`inline-flex items-center gap-1 group cursor-default ${className}`}
      title={hash}
    >
      <code className="text-hash text-xs font-mono">{display}</code>
      <button
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-tx"
        title="Copy hash"
      >
        {copied ? <Check size={11} className="text-msg" /> : <Copy size={11} />}
      </button>
    </span>
  )
}
