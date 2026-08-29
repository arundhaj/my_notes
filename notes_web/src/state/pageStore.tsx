import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Page } from '../api/types'

interface PageStoreValue {
  /** Every page fetched so far, keyed by id -- the single copy every
   * component reads, so an edit in one place is the same object everywhere
   * else it's shown. */
  pages: Record<string, Page>
  /** Insert or overwrite entries after a fetch or a save. */
  upsertPages: (pages: Page[]) => void
}

const PageStoreContext = createContext<PageStoreValue | null>(null)

export function PageStoreProvider({ children }: { children: ReactNode }) {
  const [pages, setPages] = useState<Record<string, Page>>({})

  const upsertPages = useCallback((incoming: Page[]) => {
    if (incoming.length === 0) return
    setPages((prev) => {
      const next = { ...prev }
      for (const page of incoming) next[page.id] = page
      return next
    })
  }, [])

  const value = useMemo<PageStoreValue>(
    () => ({ pages, upsertPages }),
    [pages, upsertPages],
  )

  return (
    <PageStoreContext.Provider value={value}>
      {children}
    </PageStoreContext.Provider>
  )
}

export function usePageStore(): PageStoreValue {
  const context = useContext(PageStoreContext)
  if (!context) {
    throw new Error('usePageStore must be used within a PageStoreProvider')
  }
  return context
}
