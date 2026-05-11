import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { LanguageSwitcher } from '../shared/components/LanguageSwitcher';
import { ErrorBoundary } from '../shared/components/ErrorBoundary';
import { ConfirmDialog } from '../shared/components';
import { clsx } from 'clsx';

interface NavItem {
  name: string;
  path: string;
  icon: string;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigationSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { name: 'Logs', path: '/logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    ],
  },
  {
    title: 'People',
    items: [
      { name: 'Employees', path: '/employees', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { name: 'Geofence', path: '/geofence', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', adminOnly: true },
    ],
  },
  {
    title: 'Administration',
    items: [
      { name: 'Users', path: '/users', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z', adminOnly: true },
      { name: 'Roles', path: '/roles', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', adminOnly: true },
      { name: 'Audit Logs', path: '/audit-logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', adminOnly: true },
    ],
  },
];

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setLogoutDialogOpen(false);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200/80 transform transition-transform lg:translate-x-0 flex flex-col shadow-sm',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center h-16 px-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">AttendAI</h1>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Admin Panel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {navigationSections.map((section) => {
            const visibleItems = section.items.filter((item) => !item.adminOnly || isAdmin);
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.title}>
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) => clsx(
                        'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                      </svg>
                      {item.name}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <LanguageSwitcher />
            <div className="h-8 w-px bg-gray-200" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900 leading-tight">{user?.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={() => setLogoutDialogOpen(true)}
              className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      <ConfirmDialog
        isOpen={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={handleLogout}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmLabel="Logout"
        variant="danger"
      />
    </div>
  );
}
