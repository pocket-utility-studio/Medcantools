import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { StashProvider } from './context/StashContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StashProvider>
      <App />
    </StashProvider>
  </StrictMode>,
)
