import { http, HttpResponse } from 'msw';

const baseUrl = 'http://localhost:8000/api/v1';

export const handlers = [
  http.post(`${baseUrl}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    if (body.email === 'admin@test.com' && body.password === 'password123') {
      return HttpResponse.json({
        user: { id: '1', email: 'admin@test.com', name: 'Admin User', role: 'admin' },
        accessToken: 'mock-access-token',
      });
    }
    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }),

  http.post(`${baseUrl}/auth/refresh`, () => {
    return HttpResponse.json({ accessToken: 'refreshed-token' });
  }),

  http.get(`${baseUrl}/employees`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    return HttpResponse.json({
      data: [
        {
          id: '1', employeeId: 'EMP001', name: 'John Doe', email: 'john@test.com',
          department: 'engineering', designation: 'Senior Engineer', phone: '1234567890',
          status: 'active', createdAt: '2024-01-01', updatedAt: '2024-01-01',
        },
        {
          id: '2', employeeId: 'EMP002', name: 'Jane Smith', email: 'jane@test.com',
          department: 'product', designation: 'Product Manager', phone: '0987654321',
          status: 'active',
          createdAt: '2024-01-01', updatedAt: '2024-01-01',
        },
      ],
      total: 2,
      page,
      pageSize: 10,
      totalPages: 1,
    });
  }),

  http.post(`${baseUrl}/employees`, () => {
    return HttpResponse.json({ id: '3', message: 'Created' }, { status: 201 });
  }),

  http.put(`${baseUrl}/employees/:id`, () => {
    return HttpResponse.json({ message: 'Updated' });
  }),

  http.patch(`${baseUrl}/employees/:id/deactivate`, () => {
    return HttpResponse.json({ message: 'Deactivated' });
  }),

  http.get(`${baseUrl}/attendance`, ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json({
      data: [
        {
          id: 'a1', employeeId: 'EMP001', employeeName: 'John Doe', department: 'engineering',
          date: '2024-03-01', checkIn: '2024-03-01T09:00:00Z', checkOut: '2024-03-01T18:00:00Z',
          status: 'present', verificationMethod: 'face',
        },
        {
          id: 'a2', employeeId: 'EMP002', employeeName: 'Jane Smith', department: 'product',
          date: '2024-03-01', checkIn: '2024-03-01T09:30:00Z', checkOut: null,
          status: 'late', verificationMethod: 'geofence',
        },
      ],
      total: 2,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });
  }),

  http.get(`${baseUrl}/attendance/export`, () => {
    return new HttpResponse('id,name,date,status\n1,John,2024-03-01,present', {
      headers: { 'Content-Type': 'text/csv' },
    });
  }),

  http.get(`${baseUrl}/analytics/trends`, () => {
    return HttpResponse.json([
      { date: '2024-03-01', present: 45, absent: 5, late: 3, total: 53 },
      { date: '2024-03-02', present: 48, absent: 3, late: 2, total: 53 },
      { date: '2024-03-03', present: 50, absent: 2, late: 1, total: 53 },
    ]);
  }),

  http.get(`${baseUrl}/analytics/departments`, () => {
    return HttpResponse.json([
      { department: 'Engineering', attendanceRate: 95, lateRate: 5, absentRate: 3 },
      { department: 'Product', attendanceRate: 92, lateRate: 8, absentRate: 5 },
      { department: 'Design', attendanceRate: 97, lateRate: 3, absentRate: 2 },
    ]);
  }),

  http.get(`${baseUrl}/analytics/summary`, () => {
    return HttpResponse.json({
      totalPresent: 143,
      totalAbsent: 10,
      totalLate: 6,
      avgAttendanceRate: 94.5,
    });
  }),

  http.get(`${baseUrl}/geofences`, () => {
    return HttpResponse.json([
      {
        id: 'g1', name: 'Main Office', center: { lat: 28.6139, lng: 77.2090 },
        radius: 200, address: '123 Business Park', isActive: true,
      },
    ]);
  }),

  http.post(`${baseUrl}/geofences`, () => {
    return HttpResponse.json({ id: 'g2', message: 'Created' }, { status: 201 });
  }),

  http.put(`${baseUrl}/geofences/:id`, () => {
    return HttpResponse.json({ message: 'Updated' });
  }),

  http.delete(`${baseUrl}/geofences/:id`, () => {
    return HttpResponse.json({ message: 'Deleted' });
  }),
];
