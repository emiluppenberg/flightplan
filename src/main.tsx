import { createRoot } from 'react-dom/client'
import './index.scss'
import './App.scss'
import { BrowserRouter, Route, Routes } from 'react-router'
import { FlightPathProvider } from './Provider'
import Airports from './pages/Airports'
import Search from './pages/Search'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<FlightPathProvider />}>
        <Route index element={<Airports />} />
        <Route path="search" element={<Search />} />
        <Route path="sign-in" element={<SignIn />} />
        <Route path="sign-up" element={<SignUp />} />
      </Route>
    </Routes>
  </BrowserRouter>
)
