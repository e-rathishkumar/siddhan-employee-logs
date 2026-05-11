import { useEffect, useState } from 'react';
import { useUserManagementStore } from '../../stores/userManagementStore';
import { useToastStore } from '../../stores/toastStore';
import { PageHeader, Button, Modal, Input, Textarea, Badge, ConfirmDialog } from '../../shared/components';
import { useDisclosure } from '../../shared/hooks';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Role } from '../../shared/types';

const AVAILABLE_PERMISSIONS = [
  { key: 'dashboard.view', label: 'View Dashboard' },
  { key: 'employees.view', label: 'View Employees' },
  { key: 'employees.manage', label: 'Manage Employees' },
  { key: 'attendance.view', label: 'View Attendance' },
  { key: 'attendance.manage', label: 'Manage Attendance' },
  { key: 'leaves.view', label: 'View Leaves' },
  { key: 'leaves.approve', label: 'Approve Leaves' },
  { key: 'holidays.manage', label: 'Manage Holidays' },
  { key: 'geofence.manage', label: 'Manage Geofence' },
  { key: 'reports.view', label: 'View Reports' },
  { key: 'reports.export', label: 'Export Reports' },
  { key: 'users.manage', label: 'Manage Users' },
  { key: 'roles.manage', label: 'Manage Roles' },
  { key: 'settings.manage', label: 'Manage Settings' },
  { key: 'audit.view', label: 'View Audit Logs' },
];

const roleSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().min(5, 'Description is required'),
});

type RoleFormData = z.infer<typeof roleSchema>;

export function RolesPage() {
  const { roles, loading, fetchRoles, createRole, updateRole, deleteRole, activateRole, deactivateRole } = useUserManagementStore();
  const addToast = useToastStore((s) => s.addToast);
  const formModal = useDisclosure();
  const deleteDialog = useDisclosure();
  const [editing, setEditing] = useState<Role | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
  });

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const openCreate = () => {
    setEditing(null);
    setSelectedPermissions([]);
    reset({ name: '', description: '' });
    formModal.open();
  };

  const openEdit = (role: Role) => {
    setEditing(role);
    setSelectedPermissions(role.permissions);
    reset({ name: role.name, description: role.description });
    formModal.open();
  };

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const onSubmit = async (data: RoleFormData) => {
    try {
      const payload = { ...data, permissions: selectedPermissions };
      if (editing) {
        await updateRole(editing.id, payload);
        addToast({ type: 'success', title: 'Role updated' });
      } else {
        await createRole(payload);
        addToast({ type: 'success', title: 'Role created' });
      }
      formModal.close();
    } catch {
      addToast({ type: 'error', title: 'Operation failed' });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteRole(deletingId);
      addToast({ type: 'success', title: 'Role deleted' });
      deleteDialog.close();
    } catch {
      addToast({ type: 'error', title: 'Cannot delete role (may have users assigned)' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Define access levels and permissions for users"
        actions={<Button onClick={openCreate}>Add Role</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 capitalize">{role.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
              </div>
              <Badge variant={role.isActive ? 'success' : 'neutral'}>
                {role.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">Permissions ({role.permissions.length})</p>
              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 4).map((p) => (
                  <span key={p} className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                    {p.split('.')[0]}
                  </span>
                ))}
                {role.permissions.length > 4 && (
                  <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                    +{role.permissions.length - 4} more
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
              <button onClick={() => openEdit(role)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
              {role.isActive ? (
                <button
                  onClick={async () => {
                    try { await deactivateRole(role.id); addToast({ type: 'success', title: 'Role deactivated' }); }
                    catch { addToast({ type: 'error', title: 'Cannot deactivate role' }); }
                  }}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={async () => {
                    try { await activateRole(role.id); addToast({ type: 'success', title: 'Role activated' }); }
                    catch { addToast({ type: 'error', title: 'Cannot activate role' }); }
                  }}
                  className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                >
                  Activate
                </button>
              )}
              <button onClick={() => { setDeletingId(role.id); deleteDialog.open(); }} className="text-sm text-red-600 hover:text-red-800 font-medium">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {roles.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">No roles defined yet</div>
      )}

      <Modal isOpen={formModal.isOpen} onClose={formModal.close} title={editing ? 'Edit Role' : 'Add Role'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Role Name" {...register('name')} error={errors.name?.message} placeholder="e.g. manager" />
          <Textarea label="Description" {...register('description')} error={errors.description?.message} placeholder="What can this role do?" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {AVAILABLE_PERMISSIONS.map((perm) => (
                <label key={perm.key} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(perm.key)}
                    onChange={() => togglePermission(perm.key)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-gray-700">{perm.label}</span>
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">{selectedPermissions.length} permissions selected</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={formModal.close}>Cancel</Button>
            <Button type="submit" loading={loading}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={handleDelete}
        title="Delete Role"
        message="Deleting this role will remove it permanently. Users with this role will need to be reassigned."
        confirmLabel="Delete"
        variant="danger"
        loading={loading}
      />
    </div>
  );
}
