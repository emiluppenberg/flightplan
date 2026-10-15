import { createRoot } from 'react-dom/client'
import './index.scss'
import './App.scss'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { FlightPathProvider } from './Provider'
import Aerodromes from './pages/Aerodromes'
import Search from './pages/Search'
import Account from './pages/Account'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<FlightPathProvider />}>
        <Route path="my-briefings" element={<Aerodromes />} />
        <Route path="search" element={<Search />} />
        <Route path="account" element={<Account />} />
        <Route path="sign-in" element={<Navigate to="/account" replace />} />
        <Route path="sign-up" element={<Navigate to="/account?mode=sign-up" replace />} />
      </Route>
    </Routes>
  </BrowserRouter>
)
