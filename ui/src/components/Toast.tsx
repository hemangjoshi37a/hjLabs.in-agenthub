import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'

interface Toast {
  id: number
  kind: ToastKind
  message: string
}

interface ToastCtx {
  toast: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} })

let _id = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = ++_id
    setToasts((t) => [...t, { id, kind, message }])
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 max-w-sm">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const icons = {
    success: <CheckCircle size={14} className="text-msg shrink-0" />,
    error: <AlertCircle size={14} className="text-danger shrink-0" />,
    info: <Info size={14} className="text-hash shrink-0" />,
  }

  const borders = {
    success: 'border-msg/30',
    error: 'border-danger/30',
    info: 'border-hash/30',
  }

  return (
    <div
      className={`flex items-start gap-2 bg-surface border ${borders[toast.kind]} rounded-lg px-3 py-2.5 shadow-lg text-sm text-tx animate-fade-in`}
    >
      {icons[toast.kind]}
      <span className="flex-1">{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} className="text-muted hover:text-tx shrink-0">
        <X size={12} />
      </button>
    </div>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
