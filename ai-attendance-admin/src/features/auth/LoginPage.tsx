import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import apiClient from '../../shared/api/client';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const onSubmit = async (data: LoginForm) => {
    setError('');
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', data);
      const { user: rawUser, accessToken, refreshToken } = response.data;
      const user = {
        ...rawUser,
        role: rawUser.role?.name || rawUser.role || 'viewer',
      };
      login(user, accessToken, refreshToken);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">AttendAI</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your admin dashboard</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="admin@company.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" loading={loading} className="w-full">
              Sign In
            </Button>
          </form>

          <div className="mt-6 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <p className="text-xs font-medium text-blue-800 mb-1">Demo Credentials</p>
            <p className="text-xs text-blue-700">Email: <span className="font-mono">admin@siddhan.com</span></p>
            <p className="text-xs text-blue-700">Password: <span className="font-mono">Siddhan@123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
