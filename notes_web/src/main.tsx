import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import App from './App.tsx'
import { PageStoreProvider } from './state/pageStore.tsx'

const theme = createTheme({
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // The app is a fixed-viewport shell: App is 100dvh and every scroll
        // region lives inside a panel, so the document itself must never
        // scroll. Without this, a portaled overlay landing a fraction of a
        // pixel past the edge grows the document, the scrollbar shrinks the
        // viewport, the overlay repositions to fit, the scrollbar goes away
        // -- and it oscillates.
        'html, body, #root': { height: '100%', overflow: 'hidden' },
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      {/* Normalises browser defaults and applies the theme's background. */}
      <CssBaseline />
      <PageStoreProvider>
        <App />
      </PageStoreProvider>
    </ThemeProvider>
  </StrictMode>,
)
