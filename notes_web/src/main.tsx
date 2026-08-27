import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import App from './App.tsx'

const theme = createTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      {/* Normalises browser defaults and applies the theme's background. */}
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
