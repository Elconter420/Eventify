import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Mail, Settings, LogOut, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Eventos', path: '/events' },
    { icon: Users, label: 'Asistentes', path: '/attendees' },
    { icon: Mail, label: 'Comunicaciones', path: '/communications' },
    { icon: Settings, label: 'Configuración', path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden fixed inset-0">
      {/* Sidebar */}
      <aside className="w-56 bg-indigo-600 text-white flex flex-col flex-shrink-0 overflow-hidden">
        {/* Logo */}
        <div className="px-4 py-4 flex-shrink-0">
          <h1 className="text-xl font-bold">Eventify</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'thin' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                  isActive(item.path)
                    ? 'bg-indigo-700 text-white'
                    : 'text-indigo-100 hover:bg-indigo-500'
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile - Fixed at bottom */}
        <div className="p-3 border-t border-indigo-500 flex-shrink-0">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-indigo-800 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold">
                {user?.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.full_name}</p>
              <p className="text-[10px] text-indigo-200 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-1 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors text-sm"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 h-full">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 truncate">
            {menuItems.find((item) => isActive(item.path))?.label || 'Dashboard'}
          </h2>
          <div className="flex items-center space-x-4 min-w-0">
            <span className="text-gray-600 truncate">{user?.full_name}</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-5 bg-gray-50">
          <div className="max-w-full w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
