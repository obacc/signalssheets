import { Link, NavLink } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import ResponsiveLogo from '../brand/ResponsiveLogo'

export default function Header() {
  const { user, logout } = useAuthStore()
  
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-neutral-200">
      <div className="container-indicium">
        <div className="flex items-center justify-between h-16">
          {/* Logo oficial Indicium Signals - Responsive */}
          <Link to="/" className="flex items-center">
            <ResponsiveLogo />
            <span className="sr-only">Indicium Signals - Dashboard</span>
          </Link>
          
          {/* Navegación */}
          <nav className="flex items-center gap-6 text-sm">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `font-medium transition-colors duration-200 ${
                  isActive 
                    ? 'text-primary-600' 
                    : 'text-neutral-600 hover:text-primary-600'
                }`
              }
            >
              Inicio
            </NavLink>
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => 
                `font-medium transition-colors duration-200 ${
                  isActive 
                    ? 'text-primary-600' 
                    : 'text-neutral-600 hover:text-primary-600'
                }`
              }
            >
              Dashboard
            </NavLink>
            
            {/* Botón de autenticación */}
            {user ? (
              <button 
                onClick={logout} 
                className="btn-secondary text-sm px-4 py-2"
              >
                Salir
              </button>
            ) : (
              <NavLink 
                to="/auth" 
                className="btn-primary text-sm px-4 py-2 inline-flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                Ingresar
              </NavLink>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
