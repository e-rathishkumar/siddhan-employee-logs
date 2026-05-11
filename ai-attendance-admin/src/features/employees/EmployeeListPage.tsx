import { useEffect, useState } from 'react';
import { useEmployeeStore } from '../../stores/employeeStore';
import { Button, Input, EmptyState, ErrorState, PageLoader } from '../../shared/components';
import { EmployeeTable } from './EmployeeTable';
import { EmployeeFormModal } from './EmployeeFormModal';
import { useDisclosure, useDebounce } from '../../shared/hooks';
import type { Employee } from '../../shared/types';

export function EmployeeListPage() {
  const { employees, total, page, pageSize, loading, error, fetchEmployees } = useEmployeeStore();
  const { isOpen, open, close } = useDisclosure();
  const [search, setSearch] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchEmployees(1, debouncedSearch);
  }, [debouncedSearch, fetchEmployees]);

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    open();
  };

  const handleCreate = () => {
    setEditingEmployee(null);
    open();
  };

  const handleClose = () => {
    setEditingEmployee(null);
    close();
    fetchEmployees(page, search);
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading && employees.length === 0) return <PageLoader />;
  if (error && employees.length === 0) return <ErrorState message={error} onRetry={() => fetchEmployees()} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your team — {total} total employees</p>
        </div>
        <Button onClick={handleCreate}>
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Employee
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            placeholder="Search by name, email, or employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {employees.length === 0 ? (
        <EmptyState
          title="No employees found"
          description="Get started by adding your first employee."
          action={{ label: 'Add Employee', onClick: handleCreate }}
        />
      ) : (
        <>
          <EmployeeTable employees={employees} onEdit={handleEdit} />
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => fetchEmployees(page - 1, search)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => fetchEmployees(page + 1, search)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <EmployeeFormModal
        isOpen={isOpen}
        onClose={handleClose}
        employee={editingEmployee}
      />
    </div>
  );
}
