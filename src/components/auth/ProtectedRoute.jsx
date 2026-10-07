import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { haySesionActiva } from '../../services/auth.service'

function ProtectedRoute() {
  const location = useLocation()
  return haySesionActiva() ? <Outlet /> : <Navigate to="/" replace state={{ from: location.pathname }} />
}

export default ProtectedRoute
