import AppDisplay from './pages/AppDisplay'
import './App.scss'
import { FlightPathProvider } from './Provider'
import AppHeader from './components/AppHeader'

const App = () => {
  return (
    <FlightPathProvider>
      <main className="page">
        <AppHeader />
        <AppDisplay />
      </main>
    </FlightPathProvider>
  )
}

export default App
