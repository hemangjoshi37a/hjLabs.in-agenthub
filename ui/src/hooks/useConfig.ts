import { useState, useEffect } from 'react'
import type { Config } from '../types'

const KEY = 'agenthub.config'

const defaultConfig: Config = { serverUrl: '', apiKey: '' }

function read(): Config {
  try {
    const s = localStorage.getItem(KEY)
    if (s) return { ...defaultConfig, ...JSON.parse(s) }
  } catch {}
  return defaultConfig
}

export function getConfig(): Config {
  return read()
}

export function useConfig() {
  const [config, setConfig] = useState<Config>(read)

  useEffect(() => {
    const handler = () => setConfig(read())
    window.addEventListener('agenthub-config', handler)
    return () => window.removeEventListener('agenthub-config', handler)
  }, [])

  const save = (updates: Partial<Config>) => {
    const next = { ...config, ...updates }
    localStorage.setItem(KEY, JSON.stringify(next))
    setConfig(next)
    window.dispatchEvent(new Event('agenthub-config'))
  }

  return { config, save }
}
