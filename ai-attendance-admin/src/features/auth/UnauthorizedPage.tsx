import { Link } from 'react-router-dom';

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-200">403</h1>
        <h2 className="text-xl font-semibold text-gray-900 mt-4">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to access this page.</p>
        <Link
          to="/dashboard"
          className="inline-block mt-6 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
