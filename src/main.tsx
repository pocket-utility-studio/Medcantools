import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { StashProvider } from './context/StashContext.tsx'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`/Medcantools/sw.js?v=${__APP_VERSION__}`).catch(() => { /* ignore */ })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StashProvider>
      <App />
    </StashProvider>
  </StrictMode>,
)
