import { useEffect, useState } from 'react';
import { useUserManagementStore } from '../../stores/userManagementStore';
import { useToastStore } from '../../stores/toastStore';
import { PageHeader, Button, Modal, Input, Select, Badge, Pagination, ConfirmDialog } from '../../shared/components';
import { useDisclosure, useDebounce } from '../../shared/hooks';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatDate } from '../../shared/utils';
import type { User } from '../../shared/types';

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.string().min(1, 'Role is required'),
});

const editUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
});

type UserFormData = z.infer<typeof userSchema>;
type EditUserFormData = z.infer<typeof editUserSchema>;

export function UserListPage() {
  const { users, roles, total, page, pageSize, loading, fetchUsers, createUser, updateUser, deactivateUser, activateUser, resetPassword, fetchRoles } = useUserManagementStore();
  const addToast = useToastStore((s) => s.addToast);
  const createModal = useDisclosure();
  const editModal = useDisclosure();
  const confirmDialog = useDisclosure();
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [actionTarget, setActionTarget] = useState<{ id: string; action: 'deactivate' | 'activate' | 'reset' } | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const createForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const editForm = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  });

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    fetchUsers(1, debouncedSearch);
  }, [debouncedSearch, fetchUsers]);

  const openCreate = () => {
    createForm.reset({ email: '', name: '', password: '', role: '' });
    createModal.open();
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    editForm.reset({ email: user.email, name: user.name, role: user.role });
    editModal.open();
  };

  const handleCreate = async (data: UserFormData) => {
    try {
      await createUser(data);
      addToast({ type: 'success', title: 'User created successfully' });
      createModal.close();
    } catch {
      addToast({ type: 'error', title: 'Failed to create user' });
    }
  };

  const handleEdit = async (data: EditUserFormData) => {
    if (!editingUser) return;
    try {
      await updateUser(editingUser.id, { ...data, role: data.role as User['role'] });
      addToast({ type: 'success', title: 'User updated successfully' });
      editModal.close();
    } catch {
      addToast({ type: 'error', title: 'Failed to update user' });
    }
  };

  const handleConfirmAction = async () => {
    if (!actionTarget) return;
    try {
      if (actionTarget.action === 'deactivate') {
        await deactivateUser(actionTarget.id);
        addToast({ type: 'success', title: 'User deactivated' });
      } else if (actionTarget.action === 'activate') {
        await activateUser(actionTarget.id);
        addToast({ type: 'success', title: 'User activated' });
      } else {
        await resetPassword(actionTarget.id);
        addToast({ type: 'success', title: 'Password reset email sent' });
      }
      confirmDialog.close();
    } catch {
      addToast({ type: 'error', title: 'Action failed' });
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const roleOptions = roles.map((r) => ({ value: r.name, label: r.name.charAt(0).toUpperCase() + r.name.slice(1) }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage admin users and their access permissions"
        actions={<Button onClick={openCreate}>Add User</Button>}
      />

      <div className="max-w-sm">
        <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Last Login</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && users.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">No users found</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === 'admin' ? 'info' : 'neutral'}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.isActive !== false ? 'success' : 'danger'}>
                        {user.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt, 'MMM dd, HH:mm') : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(user)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Edit</button>
                        <button
                          onClick={() => { setActionTarget({ id: user.id, action: 'reset' }); confirmDialog.open(); }}
                          className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                        >
                          Reset PW
                        </button>
                        {user.isActive !== false ? (
                          <button
                            onClick={() => { setActionTarget({ id: user.id, action: 'deactivate' }); confirmDialog.open(); }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => { setActionTarget({ id: user.id, action: 'activate' }); confirmDialog.open(); }}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => fetchUsers(p, debouncedSearch)} />

      {/* Create User Modal */}
      <Modal isOpen={createModal.isOpen} onClose={createModal.close} title="Add User" size="md">
        <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
          <Input label="Full Name" {...createForm.register('name')} error={createForm.formState.errors.name?.message} />
          <Input label="Email" type="email" {...createForm.register('email')} error={createForm.formState.errors.email?.message} />
          <Input label="Password" type="password" {...createForm.register('password')} error={createForm.formState.errors.password?.message} />
          <Select
            label="Role"
            {...createForm.register('role')}
            error={createForm.formState.errors.role?.message}
            options={[{ value: '', label: 'Select a role' }, ...roleOptions]}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={createModal.close}>Cancel</Button>
            <Button type="submit" loading={loading}>Create User</Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={editModal.isOpen} onClose={editModal.close} title="Edit User" size="md">
        <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
          <Input label="Full Name" {...editForm.register('name')} error={editForm.formState.errors.name?.message} />
          <Input label="Email" type="email" {...editForm.register('email')} error={editForm.formState.errors.email?.message} />
          <Select
            label="Role"
            {...editForm.register('role')}
            error={editForm.formState.errors.role?.message}
            options={[{ value: '', label: 'Select a role' }, ...roleOptions]}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={editModal.close}>Cancel</Button>
            <Button type="submit" loading={loading}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={confirmDialog.close}
        onConfirm={handleConfirmAction}
        title={
          actionTarget?.action === 'deactivate' ? 'Deactivate User' :
          actionTarget?.action === 'activate' ? 'Activate User' : 'Reset Password'
        }
        message={
          actionTarget?.action === 'deactivate' ? 'This user will no longer be able to log in.' :
          actionTarget?.action === 'activate' ? 'This user will regain access to the system.' :
          'A password reset link will be sent to the user\'s email.'
        }
        confirmLabel={
          actionTarget?.action === 'deactivate' ? 'Deactivate' :
          actionTarget?.action === 'activate' ? 'Activate' : 'Reset'
        }
        variant={actionTarget?.action === 'deactivate' ? 'danger' : 'primary'}
        loading={loading}
      />
    </div>
  );
}
