import { useState } from 'react';
import type { Employee } from '../../shared/types';
import { useEmployeeStore } from '../../stores/employeeStore';
import { Button, ConfirmDialog } from '../../shared/components';
import { useToastStore } from '../../stores/toastStore';

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
}

export function EmployeeTable({ employees, onEdit }: EmployeeTableProps) {
  const deactivateEmployee = useEmployeeStore((s) => s.deactivateEmployee);
  const activateEmployee = useEmployeeStore((s) => s.activateEmployee);
  const deleteEmployee = useEmployeeStore((s) => s.deleteEmployee);
  const addToast = useToastStore((s) => s.addToast);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteEmployee(deleteTarget.id);
      addToast({ type: 'success', title: 'Employee permanently deleted' });
    } catch {
      addToast({ type: 'error', title: 'Failed to delete employee' });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/80 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Employee ID</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Employee</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Designation</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
              <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{emp.employeeId}</span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-xs font-semibold text-white shadow-sm">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{emp.name}</p>
                      <p className="text-gray-400 text-xs">{emp.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-600">{emp.designation}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${emp.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    {emp.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(emp)}>
                      Edit
                    </Button>
                    {emp.status === 'active' ? (
                      <Button variant="danger" size="sm" onClick={() => deactivateEmployee(emp.id)}>
                        Deactivate
                      </Button>
                    ) : (
                      <>
                        <Button variant="success" size="sm" onClick={() => activateEmployee(emp.id)}>
                          Activate
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => setDeleteTarget(emp)}>
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Employee Permanently"
        message={`Are you sure you want to delete "${deleteTarget?.name}" permanently? This will remove all their data including attendance records. This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
