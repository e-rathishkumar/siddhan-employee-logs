import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { LoginPage } from '../features/auth/LoginPage';
import { UnauthorizedPage } from '../features/auth/UnauthorizedPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { EmployeeListPage } from '../features/employees/EmployeeListPage';
import { LogsPage } from '../features/logs/LogsPage';
import { GeofencePage } from '../features/geofence/GeofencePage';
import { UserListPage } from '../features/users/UserListPage';
import { RolesPage } from '../features/users/RolesPage';
import { AuditLogsPage } from '../features/audit/AuditLogsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/employees', element: <EmployeeListPage /> },
          { path: '/logs', element: <LogsPage /> },
          {
            element: <ProtectedRoute allowedRoles={['admin']} />,
            children: [
              { path: '/geofence', element: <GeofencePage /> },
              { path: '/users', element: <UserListPage /> },
              { path: '/roles', element: <RolesPage /> },
              { path: '/audit-logs', element: <AuditLogsPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
