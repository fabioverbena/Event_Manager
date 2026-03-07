import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Clienti from './pages/Clienti'
import Prodotti from './pages/Prodotti'
import Ordini from './pages/Ordini'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clienti" element={<Clienti />} />
          <Route path="prodotti" element={<Prodotti />} />
          <Route path="ordini" element={<Ordini />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App