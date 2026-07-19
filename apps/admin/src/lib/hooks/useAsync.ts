import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/lib/api/client'

interface AsyncState<T> {
  data: T | undefined
  error: string | undefined
  loading: boolean
}

/** Runs `fn` whenever `deps` change, exposing loading/error/data plus a manual `refetch`. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> & { refetch: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: undefined, error: undefined, loading: true })
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: undefined }))
    fn()
      .then((data) => {
        if (!cancelled) setState({ data, error: undefined, loading: false })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Unknown error'
        setState({ data: undefined, error: message, loading: false })
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  return { ...state, refetch }
}
