import { useEffect } from 'react';
import { useLogStore } from '../../stores/logStore';
import { PageLoader, ErrorState, EmptyState, Button, Input, Pagination } from '../../shared/components';
import { downloadBlob, formatDate, formatTime } from '../../shared/utils';

export function LogsPage() {
  const { logs, total, page, pageSize, loading, error, filters, setFilters, fetchLogs, exportData } = useLogStore();

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    fetchLogs(1);
  };

  const handleExport = async () => {
    try {
      const blob = await exportData();
      downloadBlob(blob, `logs-${new Date().toISOString().split('T')[0]}.csv`);
    } catch {
      // handled by interceptor
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading && logs.length === 0) return <PageLoader />;
  if (error && logs.length === 0) return <ErrorState message={error} onRetry={() => fetchLogs()} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Check-in / Check-out Logs</h1>
          <p className="text-sm text-gray-500 mt-1">View all employee check-in and check-out records</p>
        </div>
        <Button variant="secondary" onClick={handleExport}>
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            type="date"
            value={filters.date || ''}
            onChange={(e) => handleFilterChange('date', e.target.value)}
            placeholder="Filter by date"
          />
          <Input
            placeholder="Employee ID"
            value={filters.employeeId || ''}
            onChange={(e) => handleFilterChange('employeeId', e.target.value)}
          />
        </div>
      </div>

      {logs.length === 0 ? (
        <EmptyState title="No logs found" description="Try adjusting your filters." />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                    <th className="text-left px-[28px] py-3 font-medium text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Check In</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Check Out</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Duration</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => {
                    let duration = '-';
                    if (log.checkIn && log.checkOut) {
                      const diff = new Date(log.checkOut).getTime() - new Date(log.checkIn).getTime();
                      const hours = Math.floor(diff / 3600000);
                      const mins = Math.floor((diff % 3600000) / 60000);
                      duration = `${hours}h ${mins}m`;
                    }
                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{log.employeeName || '-'}</div>
                          <div className="text-xs text-gray-500">{log.employeeCode}</div>
                        </td>
                        <td className="px-[28px] py-3 text-gray-600 whitespace-nowrap text-sm">{formatDate(log.date)}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {log.checkIn ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-green-500" />
                              {formatTime(log.checkIn)}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {log.checkOut ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                              {formatTime(log.checkOut)}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                              Still Inside
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{duration}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs capitalize">{log.verificationMethod}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => fetchLogs(p)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
