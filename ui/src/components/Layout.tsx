import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  GitCommit,
  MessageSquare,
  Users,
  Settings,
  Zap,
  AlertCircle,
  Diff as DiffIcon,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { useConfig } from '../hooks/useConfig'

const navItems = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/commits', label: 'Commits', icon: GitCommit },
  { to: '/diff', label: 'Diff', icon: DiffIcon },
  { to: '/board', label: 'Board', icon: MessageSquare },
  { to: '/agents', label: 'Agents', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout() {
  const { config } = useConfig()
  const isConfigured = Boolean(config.apiKey)

  const { data: health, isFetched } = useQuery({
    queryKey: ['health'],
    queryFn: api.health,
    refetchInterval: 15_000,
    retry: false,
  })

  // Only show red after first check completes
  const online = health?.status === 'ok'
  const showStatus = isFetched

  return (
    <div className="flex h-full bg-bg overflow-hidden font-mono">
      {/* Sidebar */}
      <aside className="w-52 border-r border-border flex flex-col shrink-0 bg-surface">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-border flex items-center gap-2">
          <Zap size={16} className="text-hash" />
          <span className="font-bold text-tx text-sm tracking-wider">agenthub</span>
          {showStatus && (
            <span
              title={online ? 'Server online' : 'Server unreachable'}
              className={`ml-auto w-2 h-2 rounded-full shrink-0 ${online ? 'bg-msg' : 'bg-danger'}`}
            />
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'text-tx bg-s2 border-l-2 border-hash'
                    : 'text-muted hover:text-tx hover:bg-s2 border-l-2 border-transparent'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Not-configured banner */}
        {!isConfigured && (
          <div className="px-3 py-3 border-t border-border">
            <div className="flex gap-2 text-xs text-danger items-start">
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              <span>
                No API key.{' '}
                <NavLink to="/settings" className="underline">
                  Configure
                </NavLink>
              </span>
            </div>
          </div>
        )}

        <div className="px-4 py-2 border-t border-border text-xs text-muted">
          v0.1.0 · MIT
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
