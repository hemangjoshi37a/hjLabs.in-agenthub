import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from './components/Toast'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Commits from './pages/Commits'
import CommitDetail from './pages/CommitDetail'
import Board from './pages/Board'
import Agents from './pages/Agents'
import Settings from './pages/Settings'
import Diff from './pages/Diff'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/overview" replace />} />
              <Route path="overview" element={<Overview />} />
              <Route path="commits" element={<Commits />} />
              <Route path="commits/:hash" element={<CommitDetail />} />
              <Route path="diff" element={<Diff />} />
              <Route path="board" element={<Board />} />
              <Route path="agents" element={<Agents />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
