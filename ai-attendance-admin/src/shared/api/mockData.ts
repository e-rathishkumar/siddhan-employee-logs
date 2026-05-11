import type {
  DashboardSummary,
  Employee,
  AttendanceRecord,
  Department,
  LeaveRequest,
  LeaveType,
  Holiday,
  GeofenceZone,
  AnalyticsData,
  DepartmentAnalytics,
  AuditLog,
  User,
  Role,
  CompanySettings,
  PaginatedResponse,
} from '../types';

// ─── Seed Data ───────────────────────────────────────────────────────────────

const departments: Department[] = [
  { id: 'dept-1', name: 'Engineering', code: 'ENG', description: 'Software development team', headId: 'emp-1', headName: 'Rajesh Kumar', employeeCount: 24, isActive: true, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-12-01T08:00:00Z' },
  { id: 'dept-2', name: 'Human Resources', code: 'HR', description: 'People and culture team', headId: 'emp-5', headName: 'Priya Sharma', employeeCount: 8, isActive: true, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-11-20T09:00:00Z' },
  { id: 'dept-3', name: 'Marketing', code: 'MKT', description: 'Brand and growth team', headId: 'emp-8', headName: 'Amit Patel', employeeCount: 12, isActive: true, createdAt: '2024-02-01T10:00:00Z', updatedAt: '2024-11-15T08:00:00Z' },
  { id: 'dept-4', name: 'Finance', code: 'FIN', description: 'Accounting and financial operations', headId: 'emp-12', headName: 'Sonia Gupta', employeeCount: 6, isActive: true, createdAt: '2024-01-20T10:00:00Z', updatedAt: '2024-10-28T08:00:00Z' },
  { id: 'dept-5', name: 'Operations', code: 'OPS', description: 'Business operations and logistics', headId: 'emp-15', headName: 'Vikram Singh', employeeCount: 15, isActive: true, createdAt: '2024-03-01T10:00:00Z', updatedAt: '2024-12-05T08:00:00Z' },
  { id: 'dept-6', name: 'Design', code: 'DSN', description: 'Product and UX design', headName: 'Kavita Nair', employeeCount: 7, isActive: true, createdAt: '2024-04-01T10:00:00Z', updatedAt: '2024-11-30T08:00:00Z' },
  { id: 'dept-7', name: 'Quality Assurance', code: 'QA', description: 'Testing and quality control', headName: 'Arjun Reddy', employeeCount: 9, isActive: true, createdAt: '2024-03-15T10:00:00Z', updatedAt: '2024-12-02T08:00:00Z' },
  { id: 'dept-8', name: 'Sales', code: 'SAL', description: 'Sales and business development', headName: 'Neha Verma', employeeCount: 11, isActive: false, createdAt: '2024-05-01T10:00:00Z', updatedAt: '2024-09-15T08:00:00Z' },
];

const employees: Employee[] = [
  { id: 'emp-1', employeeId: 'ENG-001', name: 'Rajesh Kumar', email: 'rajesh.kumar@company.com', department: 'Engineering', departmentId: 'dept-1', designation: 'Senior Engineer', gender: 'male', phone: '+91 98765 43210', status: 'active', joinedAt: '2022-03-15T00:00:00Z', createdAt: '2022-03-15T10:00:00Z', updatedAt: '2024-12-01T08:00:00Z' },
  { id: 'emp-2', employeeId: 'ENG-002', name: 'Deepa Menon', email: 'deepa.menon@company.com', department: 'Engineering', departmentId: 'dept-1', designation: 'Tech Lead', gender: 'female', phone: '+91 98765 43211', status: 'active', joinedAt: '2022-05-20T00:00:00Z', createdAt: '2022-05-20T10:00:00Z', updatedAt: '2024-11-28T08:00:00Z' },
  { id: 'emp-3', employeeId: 'ENG-003', name: 'Arun Prakash', email: 'arun.prakash@company.com', department: 'Engineering', departmentId: 'dept-1', designation: 'Software Engineer', gender: 'male', phone: '+91 98765 43212', status: 'active', joinedAt: '2023-01-10T00:00:00Z', createdAt: '2023-01-10T10:00:00Z', updatedAt: '2024-12-03T08:00:00Z' },
  { id: 'emp-4', employeeId: 'ENG-004', name: 'Sneha Reddy', email: 'sneha.reddy@company.com', department: 'Engineering', departmentId: 'dept-1', designation: 'Frontend Developer', gender: 'female', phone: '+91 98765 43213', status: 'active', joinedAt: '2023-04-01T00:00:00Z', createdAt: '2023-04-01T10:00:00Z', updatedAt: '2024-11-25T08:00:00Z' },
  { id: 'emp-5', employeeId: 'HR-001', name: 'Priya Sharma', email: 'priya.sharma@company.com', department: 'Human Resources', departmentId: 'dept-2', designation: 'HR Manager', gender: 'female', phone: '+91 98765 43214', status: 'active', joinedAt: '2021-08-01T00:00:00Z', createdAt: '2021-08-01T10:00:00Z', updatedAt: '2024-12-04T08:00:00Z' },
  { id: 'emp-6', employeeId: 'HR-002', name: 'Ravi Shankar', email: 'ravi.shankar@company.com', department: 'Human Resources', departmentId: 'dept-2', designation: 'HR Executive', gender: 'male', phone: '+91 98765 43215', status: 'active', joinedAt: '2023-06-15T00:00:00Z', createdAt: '2023-06-15T10:00:00Z', updatedAt: '2024-11-30T08:00:00Z' },
  { id: 'emp-7', employeeId: 'MKT-001', name: 'Kavitha Nair', email: 'kavitha.nair@company.com', department: 'Marketing', departmentId: 'dept-3', designation: 'Marketing Manager', gender: 'female', phone: '+91 98765 43216', status: 'active', joinedAt: '2022-11-01T00:00:00Z', createdAt: '2022-11-01T10:00:00Z', updatedAt: '2024-12-02T08:00:00Z' },
  { id: 'emp-8', employeeId: 'MKT-002', name: 'Amit Patel', email: 'amit.patel@company.com', department: 'Marketing', departmentId: 'dept-3', designation: 'Content Lead', gender: 'male', phone: '+91 98765 43217', status: 'active', joinedAt: '2023-02-01T00:00:00Z', createdAt: '2023-02-01T10:00:00Z', updatedAt: '2024-11-20T08:00:00Z' },
  { id: 'emp-9', employeeId: 'FIN-001', name: 'Sonia Gupta', email: 'sonia.gupta@company.com', department: 'Finance', departmentId: 'dept-4', designation: 'Finance Head', gender: 'female', phone: '+91 98765 43218', status: 'active', joinedAt: '2021-06-01T00:00:00Z', createdAt: '2021-06-01T10:00:00Z', updatedAt: '2024-12-01T08:00:00Z' },
  { id: 'emp-10', employeeId: 'OPS-001', name: 'Vikram Singh', email: 'vikram.singh@company.com', department: 'Operations', departmentId: 'dept-5', designation: 'Operations Manager', gender: 'male', phone: '+91 98765 43219', status: 'active', joinedAt: '2022-01-15T00:00:00Z', createdAt: '2022-01-15T10:00:00Z', updatedAt: '2024-12-05T08:00:00Z' },
  { id: 'emp-11', employeeId: 'ENG-005', name: 'Meera Joshi', email: 'meera.joshi@company.com', department: 'Engineering', departmentId: 'dept-1', designation: 'DevOps Engineer', gender: 'female', phone: '+91 98765 43220', status: 'active', joinedAt: '2023-07-01T00:00:00Z', createdAt: '2023-07-01T10:00:00Z', updatedAt: '2024-12-03T08:00:00Z' },
  { id: 'emp-12', employeeId: 'DSN-001', name: 'Anita Desai', email: 'anita.desai@company.com', department: 'Design', departmentId: 'dept-6', designation: 'UX Designer', gender: 'female', phone: '+91 98765 43221', status: 'inactive', joinedAt: '2023-03-01T00:00:00Z', createdAt: '2023-03-01T10:00:00Z', updatedAt: '2024-10-15T08:00:00Z' },
];



const leaveTypes: LeaveType[] = [
  { id: 'lt-1', name: 'Casual Leave', code: 'CL', daysPerYear: 12, carryForward: false, maxCarryDays: 0, isActive: true },
  { id: 'lt-2', name: 'Sick Leave', code: 'SL', daysPerYear: 10, carryForward: true, maxCarryDays: 5, isActive: true },
  { id: 'lt-3', name: 'Earned Leave', code: 'EL', daysPerYear: 15, carryForward: true, maxCarryDays: 30, isActive: true },
  { id: 'lt-4', name: 'Maternity Leave', code: 'ML', daysPerYear: 180, carryForward: false, maxCarryDays: 0, isActive: true },
  { id: 'lt-5', name: 'Paternity Leave', code: 'PL', daysPerYear: 15, carryForward: false, maxCarryDays: 0, isActive: true },
  { id: 'lt-6', name: 'Compensatory Off', code: 'CO', daysPerYear: 0, carryForward: false, maxCarryDays: 0, isActive: true },
];

const leaveRequests: LeaveRequest[] = [
  { id: 'lr-1', employeeId: 'emp-3', employeeName: 'Arun Prakash', department: 'Engineering', leaveTypeId: 'lt-1', leaveTypeName: 'Casual Leave', startDate: '2025-05-12T00:00:00Z', endDate: '2025-05-13T00:00:00Z', days: 2, reason: 'Family function', status: 'pending', createdAt: '2025-05-06T09:00:00Z' },
  { id: 'lr-2', employeeId: 'emp-7', employeeName: 'Kavitha Nair', department: 'Marketing', leaveTypeId: 'lt-2', leaveTypeName: 'Sick Leave', startDate: '2025-05-08T00:00:00Z', endDate: '2025-05-09T00:00:00Z', days: 2, reason: 'Not feeling well', status: 'approved', approvedBy: 'user-1', approverName: 'Admin', approvedAt: '2025-05-07T14:00:00Z', createdAt: '2025-05-07T08:00:00Z' },
  { id: 'lr-3', employeeId: 'emp-5', employeeName: 'Priya Sharma', department: 'Human Resources', leaveTypeId: 'lt-3', leaveTypeName: 'Earned Leave', startDate: '2025-05-19T00:00:00Z', endDate: '2025-05-23T00:00:00Z', days: 5, reason: 'Vacation', status: 'pending', createdAt: '2025-05-05T11:00:00Z' },
  { id: 'lr-4', employeeId: 'emp-10', employeeName: 'Vikram Singh', department: 'Operations', leaveTypeId: 'lt-1', leaveTypeName: 'Casual Leave', startDate: '2025-05-15T00:00:00Z', endDate: '2025-05-15T00:00:00Z', days: 1, reason: 'Personal work', status: 'rejected', rejectionReason: 'Critical deadline', createdAt: '2025-05-04T10:00:00Z' },
  { id: 'lr-5', employeeId: 'emp-11', employeeName: 'Meera Joshi', department: 'Engineering', leaveTypeId: 'lt-2', leaveTypeName: 'Sick Leave', startDate: '2025-05-07T00:00:00Z', endDate: '2025-05-07T00:00:00Z', days: 1, reason: 'Doctor appointment', status: 'approved', approvedBy: 'user-1', approverName: 'Admin', approvedAt: '2025-05-06T16:00:00Z', createdAt: '2025-05-06T09:30:00Z' },
];

const holidays: Holiday[] = [
  { id: 'h-1', name: 'Republic Day', date: '2025-01-26T00:00:00Z', type: 'public', isOptional: false, year: 2025, createdAt: '2024-12-01T00:00:00Z' },
  { id: 'h-2', name: 'Holi', date: '2025-03-14T00:00:00Z', type: 'public', isOptional: false, year: 2025, createdAt: '2024-12-01T00:00:00Z' },
  { id: 'h-3', name: 'Good Friday', date: '2025-04-18T00:00:00Z', type: 'restricted', isOptional: true, year: 2025, createdAt: '2024-12-01T00:00:00Z' },
  { id: 'h-4', name: 'May Day', date: '2025-05-01T00:00:00Z', type: 'public', isOptional: false, year: 2025, createdAt: '2024-12-01T00:00:00Z' },
  { id: 'h-5', name: 'Independence Day', date: '2025-08-15T00:00:00Z', type: 'public', isOptional: false, year: 2025, createdAt: '2024-12-01T00:00:00Z' },
  { id: 'h-6', name: 'Gandhi Jayanti', date: '2025-10-02T00:00:00Z', type: 'public', isOptional: false, year: 2025, createdAt: '2024-12-01T00:00:00Z' },
  { id: 'h-7', name: 'Diwali', date: '2025-10-20T00:00:00Z', type: 'public', isOptional: false, year: 2025, createdAt: '2024-12-01T00:00:00Z' },
  { id: 'h-8', name: 'Christmas', date: '2025-12-25T00:00:00Z', type: 'public', isOptional: false, year: 2025, createdAt: '2024-12-01T00:00:00Z' },
  { id: 'h-9', name: 'Company Foundation Day', date: '2025-06-15T00:00:00Z', type: 'company', isOptional: false, year: 2025, createdAt: '2024-12-01T00:00:00Z' },
];

const geofenceZones: GeofenceZone[] = [
  { id: 'gz-1', name: 'Head Office', center: { lat: 28.6139, lng: 77.2090 }, radius: 200, address: '123 Connaught Place, New Delhi, India', isActive: true },
  { id: 'gz-2', name: 'Tech Park Campus', center: { lat: 12.9716, lng: 77.5946 }, radius: 500, address: 'Electronic City, Bangalore, India', isActive: true },
  { id: 'gz-3', name: 'Branch Office - Mumbai', center: { lat: 19.0760, lng: 72.8777 }, radius: 150, address: 'Bandra Kurla Complex, Mumbai, India', isActive: false },
];

const roles: Role[] = [
  { id: 'role-1', name: 'admin', description: 'Full system access with all permissions', permissions: ['dashboard.view', 'employees.view', 'employees.manage', 'attendance.view', 'attendance.manage', 'leaves.view', 'leaves.approve', 'departments.manage', 'shifts.manage', 'holidays.manage', 'geofence.manage', 'reports.view', 'reports.export', 'users.manage', 'roles.manage', 'settings.manage', 'audit.view'], isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'role-2', name: 'manager', description: 'Team management with limited admin access', permissions: ['dashboard.view', 'employees.view', 'attendance.view', 'attendance.manage', 'leaves.view', 'leaves.approve', 'reports.view', 'reports.export'], isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'role-3', name: 'viewer', description: 'Read-only access to dashboards and reports', permissions: ['dashboard.view', 'employees.view', 'attendance.view', 'leaves.view', 'reports.view'], isActive: true, createdAt: '2024-01-01T00:00:00Z' },
];

const users: User[] = [
  { id: 'user-1', email: 'admin@siddhan.com', name: 'System Admin', role: 'admin', isActive: true, createdAt: '2024-01-01T00:00:00Z', lastLoginAt: '2025-05-07T08:30:00Z' },
  { id: 'user-2', email: 'manager@example.com', name: 'Priya Sharma', role: 'manager', isActive: true, createdAt: '2024-01-15T00:00:00Z', lastLoginAt: '2025-05-06T09:15:00Z' },
  { id: 'user-3', email: 'viewer@example.com', name: 'Ravi Shankar', role: 'viewer', isActive: true, createdAt: '2024-02-01T00:00:00Z', lastLoginAt: '2025-05-05T14:20:00Z' },
  { id: 'user-4', email: 'hr@example.com', name: 'Anita Deshmukh', role: 'manager', isActive: false, createdAt: '2024-03-01T00:00:00Z', lastLoginAt: '2025-04-20T10:00:00Z' },
];

const auditLogs: AuditLog[] = [
  { id: 'al-1', actorId: 'user-1', actorName: 'System Admin', action: 'login', entity: 'user', entityId: 'user-1', metadata: { method: 'email_password' }, ipAddress: '192.168.1.100', timestamp: '2025-05-07T08:30:00Z' },
  { id: 'al-2', actorId: 'user-1', actorName: 'System Admin', action: 'update_settings', entity: 'settings', metadata: { field: 'attendance_rules' }, ipAddress: '192.168.1.100', timestamp: '2025-05-07T09:00:00Z' },
  { id: 'al-3', actorId: 'user-2', actorName: 'Priya Sharma', action: 'approve_leave', entity: 'leave', entityId: 'lr-2', metadata: { employee: 'Kavitha Nair', days: 2 }, ipAddress: '192.168.1.105', timestamp: '2025-05-07T14:00:00Z' },
  { id: 'al-4', actorId: 'user-1', actorName: 'System Admin', action: 'create_employee', entity: 'employee', entityId: 'emp-11', metadata: { name: 'Meera Joshi', department: 'Engineering' }, ipAddress: '192.168.1.100', timestamp: '2025-05-06T11:00:00Z' },
  { id: 'al-5', actorId: 'user-1', actorName: 'System Admin', action: 'update_geofence', entity: 'geofence', entityId: 'gz-1', metadata: { field: 'radius', oldValue: 150, newValue: 200 }, ipAddress: '192.168.1.100', timestamp: '2025-05-06T10:00:00Z' },
  { id: 'al-6', actorId: 'user-2', actorName: 'Priya Sharma', action: 'reject_leave', entity: 'leave', entityId: 'lr-4', metadata: { employee: 'Vikram Singh', reason: 'Critical deadline' }, ipAddress: '192.168.1.105', timestamp: '2025-05-05T15:00:00Z' },
  { id: 'al-7', actorId: 'user-1', actorName: 'System Admin', action: 'create_shift', entity: 'shift', entityId: 'shift-3', metadata: { name: 'Night Shift' }, ipAddress: '192.168.1.100', timestamp: '2025-05-04T09:00:00Z' },
  { id: 'al-8', actorId: 'user-1', actorName: 'System Admin', action: 'delete_holiday', entity: 'holiday', metadata: { name: 'Test Holiday' }, ipAddress: '192.168.1.100', timestamp: '2025-05-03T16:00:00Z' },
  { id: 'al-9', actorId: 'user-3', actorName: 'Ravi Shankar', action: 'login', entity: 'user', entityId: 'user-3', metadata: { method: 'email_password' }, ipAddress: '192.168.1.110', timestamp: '2025-05-05T14:20:00Z' },
  { id: 'al-10', actorId: 'user-1', actorName: 'System Admin', action: 'update_role', entity: 'role', entityId: 'role-2', metadata: { added_permissions: ['reports.export'] }, ipAddress: '192.168.1.100', timestamp: '2025-05-02T11:30:00Z' },
];

const companySettings: CompanySettings = {
  companyName: 'AttendAI Technologies Pvt. Ltd.',
  timezone: 'Asia/Kolkata',
  workingDays: [1, 2, 3, 4, 5],
  attendanceRules: {
    autoAbsentAfterMinutes: 240,
    requireFaceVerification: true,
    requireGeofence: true,
    allowManualEntry: false,
    overtimeThresholdMinutes: 480,
  },
  notificationSettings: {
    emailNotifications: true,
    lateArrivalAlert: true,
    absentAlert: true,
    leaveRequestAlert: true,
    dailySummaryReport: true,
    weeklyReport: false,
  },
};

// ─── Helper Functions ────────────────────────────────────────────────────────

function generateAttendanceRecords(): AttendanceRecord[] {
  const today = new Date();
  const records: AttendanceRecord[] = [];
  const statuses: AttendanceRecord['status'][] = ['present', 'present', 'present', 'late', 'present', 'absent', 'half-day'];

  employees.filter(e => e.status === 'active').forEach((emp, idx) => {
    const status = statuses[idx % statuses.length];
    const baseHour = 9;
    const lateMinutes = status === 'late' ? Math.floor(Math.random() * 45) + 16 : Math.floor(Math.random() * 10);

    records.push({
      id: `att-${emp.id}-${today.toISOString().split('T')[0]}`,
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      date: today.toISOString().split('T')[0],
      checkIn: status === 'absent' ? null : `${today.toISOString().split('T')[0]}T${String(baseHour).padStart(2, '0')}:${String(lateMinutes).padStart(2, '0')}:00Z`,
      checkOut: status === 'absent' || status === 'half-day' ? null : `${today.toISOString().split('T')[0]}T18:${String(Math.floor(Math.random() * 30)).padStart(2, '0')}:00Z`,
      status,
      verificationMethod: 'face',
      location: { lat: 28.6139 + (Math.random() - 0.5) * 0.01, lng: 77.2090 + (Math.random() - 0.5) * 0.01 },
    });
  });

  return records;
}

function generateAnalyticsTrends(range: string): AnalyticsData[] {
  const data: AnalyticsData[] = [];
  const days = range === 'daily' ? 7 : range === 'weekly' ? 4 : 12;
  const total = 92;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    if (range === 'daily') date.setDate(date.getDate() - i);
    else if (range === 'weekly') date.setDate(date.getDate() - i * 7);
    else date.setMonth(date.getMonth() - i);

    const present = Math.floor(total * (0.82 + Math.random() * 0.12));
    const late = Math.floor(Math.random() * 8) + 2;
    const absent = total - present;

    data.push({
      date: range === 'monthly'
        ? date.toLocaleDateString('en-US', { month: 'short' })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      present,
      absent,
      late,
      total,
    });
  }

  return data;
}

const departmentAnalytics: DepartmentAnalytics[] = [
  { department: 'Engineering', attendanceRate: 94, lateRate: 8, absentRate: 6 },
  { department: 'HR', attendanceRate: 97, lateRate: 3, absentRate: 3 },
  { department: 'Marketing', attendanceRate: 91, lateRate: 12, absentRate: 9 },
  { department: 'Finance', attendanceRate: 96, lateRate: 5, absentRate: 4 },
  { department: 'Operations', attendanceRate: 89, lateRate: 15, absentRate: 11 },
  { department: 'Design', attendanceRate: 93, lateRate: 9, absentRate: 7 },
];

function generateDashboardSummary(): DashboardSummary {
  return {
    totalEmployees: 92,
    presentToday: 78,
    absentToday: 6,
    lateToday: 5,
    onLeaveToday: 3,
    attendanceRate: 84.8,
    pendingLeaveRequests: 2,
    recentActivity: [
      { id: 'act-1', type: 'check_in', message: 'Rajesh Kumar checked in', timestamp: new Date(Date.now() - 30 * 60000).toISOString(), employeeName: 'Rajesh Kumar' },
      { id: 'act-2', type: 'check_in', message: 'Deepa Menon checked in', timestamp: new Date(Date.now() - 45 * 60000).toISOString(), employeeName: 'Deepa Menon' },
      { id: 'act-3', type: 'leave_request', message: 'Arun Prakash submitted a leave request', timestamp: new Date(Date.now() - 60 * 60000).toISOString(), employeeName: 'Arun Prakash' },
      { id: 'act-4', type: 'leave_approved', message: 'Leave approved for Kavitha Nair', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), employeeName: 'Kavitha Nair' },
      { id: 'act-5', type: 'check_out', message: 'Vikram Singh checked out', timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), employeeName: 'Vikram Singh' },
      { id: 'act-6', type: 'check_in', message: 'Sneha Reddy checked in (late)', timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), employeeName: 'Sneha Reddy' },
      { id: 'act-7', type: 'employee_added', message: 'New employee Meera Joshi added', timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), employeeName: 'Meera Joshi' },
    ],
  };
}

// ─── Paginate Helper ─────────────────────────────────────────────────────────

function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResponse<T> {
  const start = (page - 1) * pageSize;
  const data = items.slice(start, start + pageSize);
  return {
    data,
    total: items.length,
    page,
    pageSize,
    totalPages: Math.ceil(items.length / pageSize),
  };
}

// ─── Mock State (mutable for CRUD) ──────────────────────────────────────────

let mockDepartments = [...departments];
let mockEmployees = [...employees];
let mockLeaveRequests = [...leaveRequests];
let mockLeaveTypes = [...leaveTypes];
let mockHolidays = [...holidays];
let mockGeofenceZones = [...geofenceZones];
let mockRoles = [...roles];
let mockUsers = [...users];
let mockAuditLogs = [...auditLogs];
let mockSettings = { ...companySettings };

function generateId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Route Handler ───────────────────────────────────────────────────────────

interface MockResponse {
  data: unknown;
  status: number;
}

export function handleMockRequest(method: string, url: string, data?: unknown, params?: Record<string, unknown>): MockResponse {
  const path = url.replace(/^\/api\/v1/, '').replace(/^\//, '');

  // Dashboard
  if (method === 'GET' && path === 'dashboard/summary') {
    return { data: generateDashboardSummary(), status: 200 };
  }

  // Analytics
  if (method === 'GET' && path.startsWith('analytics/trends')) {
    const range = (params?.range as string) || 'daily';
    return { data: generateAnalyticsTrends(range), status: 200 };
  }
  if (method === 'GET' && path === 'analytics/departments') {
    return { data: departmentAnalytics, status: 200 };
  }
  if (method === 'GET' && path.startsWith('analytics/summary')) {
    return { data: { totalPresent: 78, totalAbsent: 6, totalLate: 5, avgAttendanceRate: 84.8 }, status: 200 };
  }

  // Employees
  if (method === 'GET' && path === 'employees') {
    const page = Number(params?.page) || 1;
    const pageSize = Number(params?.pageSize) || 10;
    const search = ((params?.search as string) || '').toLowerCase();
    const filtered = search
      ? mockEmployees.filter(e => e.name.toLowerCase().includes(search) || e.employeeId.toLowerCase().includes(search))
      : mockEmployees;
    return { data: paginate(filtered, page, pageSize), status: 200 };
  }
  if (method === 'POST' && path === 'employees') {
    const newEmp = { ...data as Partial<Employee>, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Employee;
    mockEmployees = [newEmp, ...mockEmployees];
    return { data: newEmp, status: 201 };
  }
  if (method === 'PUT' && path.match(/^employees\/[^/]+$/) && !path.includes('photos')) {
    const id = path.split('/')[1];
    mockEmployees = mockEmployees.map(e => e.id === id ? { ...e, ...data as Partial<Employee>, updatedAt: new Date().toISOString() } : e);
    return { data: mockEmployees.find(e => e.id === id), status: 200 };
  }
  if (method === 'PATCH' && path.match(/^employees\/.+\/deactivate$/)) {
    const id = path.split('/')[1];
    mockEmployees = mockEmployees.map(e => e.id === id ? { ...e, status: 'inactive' as const, updatedAt: new Date().toISOString() } : e);
    return { data: { success: true }, status: 200 };
  }
  if (method === 'DELETE' && path.match(/^employees\/.+/)) {
    const id = path.split('/')[1];
    mockEmployees = mockEmployees.filter(e => e.id !== id);
    return { data: { success: true }, status: 200 };
  }

  // Attendance
  if (method === 'GET' && path === 'attendance') {
    const page = Number(params?.page) || 1;
    const pageSize = Number(params?.pageSize) || 20;
    const records = generateAttendanceRecords();
    const status = params?.status as string;
    const dept = params?.department as string;
    let filtered = records;
    if (status) filtered = filtered.filter(r => r.status === status);
    if (dept) filtered = filtered.filter(r => r.department === dept);
    return { data: paginate(filtered, page, pageSize), status: 200 };
  }
  if (method === 'GET' && path === 'attendance/export') {
    return { data: new Blob(['Employee,Date,Check In,Check Out,Status\nRajesh Kumar,2025-05-07,09:00,18:00,present'], { type: 'text/csv' }), status: 200 };
  }

  // Leave Balances
  if (method === 'GET' && path === 'leaves/balances') {
    return { data: [], status: 200 };
  }

  // Departments
  if (method === 'GET' && path === 'departments') {
    const page = Number(params?.page) || 1;
    const pageSize = Number(params?.pageSize) || 10;
    const search = ((params?.search as string) || '').toLowerCase();
    const filtered = search
      ? mockDepartments.filter(d => d.name.toLowerCase().includes(search))
      : mockDepartments;
    return { data: paginate(filtered, page, pageSize), status: 200 };
  }
  if (method === 'GET' && path === 'departments/all') {
    return { data: mockDepartments.filter(d => d.isActive), status: 200 };
  }
  if (method === 'POST' && path === 'departments') {
    const newDept = { ...data as Partial<Department>, id: generateId(), employeeCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Department;
    mockDepartments = [newDept, ...mockDepartments];
    return { data: newDept, status: 201 };
  }
  if (method === 'PUT' && path.match(/^departments\/.+/)) {
    const id = path.split('/')[1];
    mockDepartments = mockDepartments.map(d => d.id === id ? { ...d, ...data as Partial<Department>, updatedAt: new Date().toISOString() } : d);
    return { data: mockDepartments.find(d => d.id === id), status: 200 };
  }
  if (method === 'DELETE' && path.match(/^departments\/.+/)) {
    const id = path.split('/')[1];
    mockDepartments = mockDepartments.filter(d => d.id !== id);
    return { data: { success: true }, status: 200 };
  }

  // Shifts (removed — no longer used)
  if (method === 'GET' && path === 'shifts') {
    return { data: [], status: 200 };
  }
  if (method === 'GET' && path === 'shifts/assignments') {
    return { data: { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }, status: 200 };
  }

  // Leaves
  if (method === 'GET' && (path === 'leaves' || path === 'leaves/requests')) {
    const page = Number(params?.page) || 1;
    const pageSize = Number(params?.pageSize) || 10;
    const status = params?.status as string;
    let filtered = mockLeaveRequests;
    if (status) filtered = filtered.filter(l => l.status === status);
    return { data: paginate(filtered, page, pageSize), status: 200 };
  }
  if (method === 'PATCH' && path.match(/^leaves\/(requests\/)?[^/]+\/approve$/)) {
    const parts = path.split('/');
    const id = parts.includes('requests') ? parts[2] : parts[1];
    mockLeaveRequests = mockLeaveRequests.map(l => l.id === id ? { ...l, status: 'approved' as const, approvedAt: new Date().toISOString(), approverName: 'Admin' } : l);
    return { data: mockLeaveRequests.find(l => l.id === id), status: 200 };
  }
  if (method === 'PATCH' && path.match(/^leaves\/(requests\/)?[^/]+\/reject$/)) {
    const parts = path.split('/');
    const id = parts.includes('requests') ? parts[2] : parts[1];
    const reason = (data as { comment?: string; reason?: string })?.comment || (data as { reason?: string })?.reason || 'Rejected by admin';
    mockLeaveRequests = mockLeaveRequests.map(l => l.id === id ? { ...l, status: 'rejected' as const, rejectionReason: reason } : l);
    return { data: mockLeaveRequests.find(l => l.id === id), status: 200 };
  }

  // Leave Types
  if (method === 'GET' && path === 'leaves/types') {
    return { data: mockLeaveTypes, status: 200 };
  }
  if (method === 'POST' && path === 'leaves/types') {
    const newType = { ...data as Partial<LeaveType>, id: generateId() } as LeaveType;
    mockLeaveTypes = [...mockLeaveTypes, newType];
    return { data: newType, status: 201 };
  }
  if (method === 'PUT' && path.match(/^leaves\/types\/.+/)) {
    const id = path.split('/')[2];
    mockLeaveTypes = mockLeaveTypes.map(t => t.id === id ? { ...t, ...data as Partial<LeaveType> } : t);
    return { data: mockLeaveTypes.find(t => t.id === id), status: 200 };
  }
  if (method === 'DELETE' && path.match(/^leaves\/types\/.+/)) {
    const id = path.split('/')[2];
    mockLeaveTypes = mockLeaveTypes.filter(t => t.id !== id);
    return { data: { success: true }, status: 200 };
  }

  // Holidays
  if (method === 'GET' && path === 'holidays') {
    const year = Number(params?.year) || new Date().getFullYear();
    return { data: mockHolidays.filter(h => h.year === year), status: 200 };
  }
  if (method === 'POST' && path === 'holidays') {
    const newHoliday = { ...data as Partial<Holiday>, id: generateId(), createdAt: new Date().toISOString() } as Holiday;
    mockHolidays = [...mockHolidays, newHoliday];
    return { data: newHoliday, status: 201 };
  }
  if (method === 'PUT' && path.match(/^holidays\/.+/)) {
    const id = path.split('/')[1];
    mockHolidays = mockHolidays.map(h => h.id === id ? { ...h, ...data as Partial<Holiday> } : h);
    return { data: mockHolidays.find(h => h.id === id), status: 200 };
  }
  if (method === 'DELETE' && path.match(/^holidays\/.+/)) {
    const id = path.split('/')[1];
    mockHolidays = mockHolidays.filter(h => h.id !== id);
    return { data: { success: true }, status: 200 };
  }

  // Geofences
  if (method === 'GET' && path === 'geofences') {
    return { data: mockGeofenceZones, status: 200 };
  }
  if (method === 'POST' && path === 'geofences') {
    const payload = data as Record<string, unknown>;
    const newZone: GeofenceZone = {
      id: generateId(),
      name: (payload.name || payload.centerLat ? payload.name : (payload as unknown as GeofenceZone).name) as string,
      address: ((payload.address || '') as string),
      center: payload.centerLat
        ? { lat: payload.centerLat as number, lng: payload.centerLng as number }
        : (payload.center as { lat: number; lng: number }) || { lat: 0, lng: 0 },
      radius: (payload.radiusMeters || payload.radius || 200) as number,
      isActive: payload.isActive !== undefined ? payload.isActive as boolean : true,
    };
    mockGeofenceZones = [...mockGeofenceZones, newZone];
    return { data: newZone, status: 201 };
  }
  if (method === 'PUT' && path.match(/^geofences\/.+/)) {
    const id = path.split('/')[1];
    const payload = data as Record<string, unknown>;
    mockGeofenceZones = mockGeofenceZones.map(z => {
      if (z.id !== id) return z;
      return {
        ...z,
        name: (payload.name as string) || z.name,
        address: (payload.address as string) ?? z.address,
        center: payload.centerLat
          ? { lat: payload.centerLat as number, lng: payload.centerLng as number }
          : (payload.center as { lat: number; lng: number }) || z.center,
        radius: (payload.radiusMeters || payload.radius || z.radius) as number,
        isActive: payload.isActive !== undefined ? payload.isActive as boolean : z.isActive,
      };
    });
    return { data: mockGeofenceZones.find(z => z.id === id), status: 200 };
  }
  if (method === 'DELETE' && path.match(/^geofences\/.+/)) {
    const id = path.split('/')[1];
    mockGeofenceZones = mockGeofenceZones.filter(z => z.id !== id);
    return { data: { success: true }, status: 200 };
  }

  // Users
  if (method === 'GET' && path === 'users') {
    const page = Number(params?.page) || 1;
    const pageSize = Number(params?.pageSize) || 10;
    const search = ((params?.search as string) || '').toLowerCase();
    const filtered = search
      ? mockUsers.filter(u => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search))
      : mockUsers;
    return { data: paginate(filtered, page, pageSize), status: 200 };
  }
  if (method === 'POST' && path === 'users') {
    const payload = data as { email: string; name: string; role: string };
    const newUser: User = { id: generateId(), email: payload.email, name: payload.name, role: payload.role as User['role'], isActive: true, createdAt: new Date().toISOString() };
    mockUsers = [...mockUsers, newUser];
    return { data: newUser, status: 201 };
  }
  if (method === 'PATCH' && path.match(/^users\/[^/]+$/) && !path.includes('deactivate') && !path.includes('activate')) {
    const id = path.split('/')[1];
    mockUsers = mockUsers.map(u => u.id === id ? { ...u, ...data as Partial<User> } : u);
    return { data: mockUsers.find(u => u.id === id), status: 200 };
  }
  if (method === 'PATCH' && path.match(/^users\/.+\/deactivate$/)) {
    const id = path.split('/')[1];
    mockUsers = mockUsers.map(u => u.id === id ? { ...u, isActive: false } : u);
    return { data: { success: true }, status: 200 };
  }
  if (method === 'PATCH' && path.match(/^users\/.+\/activate$/)) {
    const id = path.split('/')[1];
    mockUsers = mockUsers.map(u => u.id === id ? { ...u, isActive: true } : u);
    return { data: { success: true }, status: 200 };
  }
  if (method === 'POST' && path.match(/^users\/.+\/reset-password$/)) {
    return { data: { success: true, message: 'Password reset email sent' }, status: 200 };
  }

  // Roles
  if (method === 'GET' && path === 'roles') {
    return { data: mockRoles, status: 200 };
  }
  if (method === 'POST' && path === 'roles') {
    const newRole = { ...data as Partial<Role>, id: generateId(), isActive: true, createdAt: new Date().toISOString() } as Role;
    mockRoles = [...mockRoles, newRole];
    return { data: newRole, status: 201 };
  }
  if (method === 'PUT' && path.match(/^roles\/.+/)) {
    const id = path.split('/')[1];
    mockRoles = mockRoles.map(r => r.id === id ? { ...r, ...data as Partial<Role> } : r);
    return { data: mockRoles.find(r => r.id === id), status: 200 };
  }
  if (method === 'DELETE' && path.match(/^roles\/.+/)) {
    const id = path.split('/')[1];
    mockRoles = mockRoles.filter(r => r.id !== id);
    return { data: { success: true }, status: 200 };
  }

  // Audit Logs
  if (method === 'GET' && path === 'audit/logs') {
    const page = Number(params?.page) || 1;
    const pageSize = Number(params?.pageSize) || 20;
    let filtered = [...mockAuditLogs];
    if (params?.action) filtered = filtered.filter(l => l.action.includes(params.action as string));
    if (params?.entity) filtered = filtered.filter(l => l.entity === params.entity);
    return { data: paginate(filtered, page, pageSize), status: 200 };
  }

  // Settings
  if (method === 'GET' && path === 'settings') {
    return { data: mockSettings, status: 200 };
  }
  if (method === 'PUT' && path === 'settings') {
    mockSettings = { ...mockSettings, ...data as Partial<CompanySettings> };
    return { data: mockSettings, status: 200 };
  }

  // Reports
  if (method === 'POST' && path === 'reports/generate') {
    // Return a mock blob-like response
    return { data: new Blob(['Mock Report Data'], { type: 'application/octet-stream' }), status: 200 };
  }

  // Auth
  if (method === 'POST' && path === 'auth/login') {
    const payload = data as { email: string; password: string };
    if (payload.email === 'admin@siddhan.com' && payload.password === 'Siddhan@123') {
      return {
        data: {
          user: { id: 'user-1', email: 'admin@siddhan.com', name: 'System Admin', role: 'admin' },
          access_token: 'mock-jwt-token-admin',
          refresh_token: 'mock-refresh-token-admin',
        },
        status: 200,
      };
    }
    return { data: { message: 'Invalid credentials' }, status: 401 };
  }
  if (method === 'POST' && path === 'auth/refresh') {
    return { data: { access_token: 'mock-refreshed-token' }, status: 200 };
  }

  // Fallback
  return { data: { message: 'Not found' }, status: 404 };
}
