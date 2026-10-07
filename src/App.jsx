import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Productos from './pages/Productos'
import Pedidos from './pages/Pedidos'
import Cotizaciones from './pages/Cotizaciones'
import OrdenCompra from './pages/OrdenCompra'
import Stock from './pages/Stock'
import Cobros from './pages/Cobros'
import Almacen from './pages/Almacen'
import Facturacion from './pages/Facturacion'
import Seguimiento from './pages/Seguimiento'

const modulos = [
  ['clientes', Clientes, 'Clientes'],
  ['productos', Productos, 'Productos'],
  ['pedidos', Pedidos, 'Pedidos'],
  ['cotizaciones', Cotizaciones, 'Cotizaciones'],
  ['ordenes-compra', OrdenCompra, 'Órdenes de Compra'],
  ['stock', Stock, 'Stock'],
  ['cobros', Cobros, 'Cobros'],
  ['almacen', Almacen, 'Almacén'],
  ['facturacion', Facturacion, 'Facturación'],
  ['seguimiento', Seguimiento, 'Seguimiento'],
]

function App() {
  return <Routes>
    <Route path="/" element={<Login />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        {modulos.map(([ruta, Componente, titulo]) => <Route key={ruta} path={`/${ruta}`} element={<Componente titulo={titulo} />} />)}
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}

export default App
