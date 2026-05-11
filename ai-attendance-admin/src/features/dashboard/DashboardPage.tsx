import { useEffect } from 'react';
import { useDashboardStore } from '../../stores/dashboardStore';
import { StatsCard, PageLoader } from '../../shared/components';
import { formatDate } from '../../shared/utils';

export function DashboardPage() {
  const { summary, loading, fetchSummary } = useDashboardStore();

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (loading && !summary) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Check-in / Check-out Overview — {formatDate(new Date().toISOString(), 'EEEE, MMMM dd, yyyy')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Employees"
          value={summary?.totalEmployees ?? 0}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Checked In Today"
          value={summary?.checkedInToday ?? 0}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Checked Out"
          value={summary?.checkedOutToday ?? 0}
          color="yellow"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          }
        />
        <StatsCard
          title="Still Inside"
          value={summary?.stillInside ?? 0}
          color="indigo"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
      </div>

      {/* Recent Logs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Today's Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Check In</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Check Out</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(summary?.recentLogs || []).map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{log.employeeName}</div>
                    <div className="text-xs text-gray-500">{log.employeeCode}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {log.checkIn ? new Date(log.checkIn).toLocaleTimeString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {log.checkOut ? (
                      new Date(log.checkOut).toLocaleTimeString()
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        Still Inside
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs capitalize">{log.method}</td>
                </tr>
              ))}
              {(!summary?.recentLogs || summary.recentLogs.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No activity yet today
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
