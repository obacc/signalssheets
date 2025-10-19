import { NavLink } from 'react-router-dom'
import { Home, Table, SlidersHorizontal } from 'lucide-react'

export default function Sidebar() {
  const link = (isActive:boolean) => isActive ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
  return (
    <aside className="hidden md:block w-64 border-r h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4 space-y-2">
        <NavLink to="/" className={({isActive})=>`flex items-center gap-2 px-3 py-2 rounded-lg ${link(!!isActive)}`}>
          <Home className="h-4 w-4"/> Inicio
        </NavLink>
        <NavLink to="/dashboard" className={({isActive})=>`flex items-center gap-2 px-3 py-2 rounded-lg ${link(!!isActive)}`}>
          <Table className="h-4 w-4"/> Señales
        </NavLink>
        <a href="#filters" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50">
          <SlidersHorizontal className="h-4 w-4"/> Filtros
        </a>
      </div>
    </aside>
  )
}
