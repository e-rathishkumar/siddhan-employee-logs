import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Modal, Input, Button } from '../../shared/components';
import { useEmployeeStore } from '../../stores/employeeStore';
import { useToastStore } from '../../stores/toastStore';
import type { Employee } from '../../shared/types';

const employeeSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  designation: z.string().min(1, 'Designation is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  employeeId: z.string().min(1, 'Employee ID is required').max(6, 'Employee ID must be max 6 digits'),
  gender: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export function EmployeeFormModal({ isOpen, onClose, employee }: Props) {
  const { createEmployee, updateEmployee } = useEmployeeStore();
  const addToast = useToastStore((s) => s.addToast);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
  });

  useEffect(() => {
    if (!isOpen) return;
    if (employee) {
      reset({
        name: employee.name,
        email: employee.email,
        designation: employee.designation,
        phone: employee.phone || '',
        employeeId: employee.employeeId,
        gender: employee.gender || '',
      });
    } else {
      reset({
        name: '', email: '', designation: '', phone: '', employeeId: '', gender: '',
      });
    }
  }, [isOpen, employee, reset]);

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      if (employee) {
        await updateEmployee(employee.id, data);
        addToast({ type: 'success', title: 'Employee updated' });
      } else {
        await createEmployee(data);
        addToast({ type: 'success', title: 'Employee created' });
      }
      onClose();
    } catch (err: any) {
      addToast({ type: 'error', title: err.response?.data?.detail || 'Operation failed' });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={employee ? 'Edit Employee' : 'Add Employee'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
          <Input label="Employee ID" {...register('employeeId')} error={errors.employeeId?.message} disabled={!!employee} maxLength={6} />
          <Input label="Full Name" {...register('name')} error={errors.name?.message} />
          <div className="sm:col-span-2">
            <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-l-lg border border-r-0 border-gray-300 h-[38px] flex items-center">+</span>
              <input
                {...register('phone')}
                className="block w-full rounded-r-lg rounded-l-none border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {errors.phone?.message && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              {...register('gender')}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 h-[38px]"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <Input label="Designation" {...register('designation')} error={errors.designation?.message} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : employee ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
