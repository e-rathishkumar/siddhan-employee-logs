import { useEffect, useState } from 'react';
import { useAuditStore } from '../../stores/auditStore';
import { PageHeader, Select, Input, Pagination, Badge } from '../../shared/components';
import { formatDate } from '../../shared/utils';

export function AuditLogsPage() {
  const { logs, total, page, pageSize, loading, fetchLogs } = useAuditStore();
  const [filters, setFilters] = useState({ action: '', entity: '', from: '', to: '' });

  useEffect(() => {
    fetchLogs(1, {
      action: filters.action || undefined,
      entity: filters.entity || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    });
  }, [filters, fetchLogs]);

  const totalPages = Math.ceil(total / pageSize);

  const getActionBadge = (action: string) => {
    if (action.includes('create') || action.includes('add')) return 'success';
    if (action.includes('delete') || action.includes('remove')) return 'danger';
    if (action.includes('update') || action.includes('edit')) return 'info';
    if (action.includes('login') || action.includes('auth')) return 'warning';
    return 'neutral';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Track all system activities and changes"
      />

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Select
          value={filters.action}
          onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
          options={[
            { value: '', label: 'All Actions' },
            { value: 'login', label: 'Login' },
            { value: 'logout', label: 'Logout' },
            { value: 'create', label: 'Create' },
            { value: 'update', label: 'Update' },
            { value: 'delete', label: 'Delete' },
            { value: 'approve', label: 'Approve' },
            { value: 'reject', label: 'Reject' },
          ]}
        />
        <Select
          value={filters.entity}
          onChange={(e) => setFilters((f) => ({ ...f, entity: e.target.value }))}
          options={[
            { value: '', label: 'All Entities' },
            { value: 'user', label: 'User' },
            { value: 'employee', label: 'Employee' },
            { value: 'attendance', label: 'Attendance' },
            { value: 'leave', label: 'Leave' },
            { value: 'department', label: 'Department' },
            { value: 'shift', label: 'Shift' },
            { value: 'geofence', label: 'Geofence' },
            { value: 'settings', label: 'Settings' },
          ]}
        />
        <Input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          placeholder="From date"
        />
        <Input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          placeholder="To date"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Entity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Details</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && logs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">No audit logs found</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(log.timestamp, 'MMM dd, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{log.actorName}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getActionBadge(log.action) as any}>{log.action}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{log.entity}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{log.ipAddress}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(p) => fetchLogs(p, {
          action: filters.action || undefined,
          entity: filters.entity || undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
        })}
      />
    </div>
  );
}
