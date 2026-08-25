import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Mantine's stylesheet first, so app styles can override it later.
import '@mantine/core/styles.css'
import { MantineProvider } from '@mantine/core'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider>
      <App />
    </MantineProvider>
  </StrictMode>,
)
