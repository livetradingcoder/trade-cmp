import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { TournamentProvider } from './context/TournamentContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <TournamentProvider>
        <App />
      </TournamentProvider>
    </BrowserRouter>
  </StrictMode>,
)
