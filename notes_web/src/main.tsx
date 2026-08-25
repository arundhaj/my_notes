import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// MUI's default typography asks for Roboto; these self-host the weights it uses.
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
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
