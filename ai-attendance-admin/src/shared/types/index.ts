// ─── Auth & User ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'viewer';
  avatar?: string;
  phone?: string;
  createdAt?: string;
  lastLoginAt?: string;
  isActive?: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

// ─── Employee ────────────────────────────────────────────────────────────────

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  departmentId: string;
  designation: string;
  gender: string;
  phone: string;
  status: 'active' | 'inactive';
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Attendance ──────────────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: 'present' | 'absent' | 'late' | 'half-day';
  location?: { lat: number; lng: number };
  verificationMethod: 'face' | 'manual' | 'geofence';
  remarks?: string;
}

// ─── Department ──────────────────────────────────────────────────────────────

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  headId?: string;
  headName?: string;
  employeeCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Leave ───────────────────────────────────────────────────────────────────

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  daysPerYear: number;
  carryForward: boolean;
  maxCarryDays: number;
  isActive: boolean;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
  approverName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  allocated: number;
  used: number;
  remaining: number;
  year: number;
}

// ─── Holiday ─────────────────────────────────────────────────────────────────

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'public' | 'restricted' | 'company';
  isOptional: boolean;
  year: number;
  createdAt: string;
}

// ─── Geofence ────────────────────────────────────────────────────────────────

export interface GeofenceZone {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radius: number;
  address: string;
  isActive: boolean;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface AnalyticsData {
  date: string;
  present: number;
  absent: number;
  late: number;
  total: number;
}

export interface DepartmentAnalytics {
  department: string;
  attendanceRate: number;
  lateRate: number;
  absentRate: number;
}

export interface DashboardSummary {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
  attendanceRate: number;
  pendingLeaveRequests: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'check_in' | 'check_out' | 'leave_request' | 'leave_approved' | 'employee_added';
  message: string;
  timestamp: string;
  employeeName?: string;
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress: string;
  timestamp: string;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface CompanySettings {
  companyName: string;
  companyLogo?: string;
  timezone: string;
  workingDays: number[];
  attendanceRules: AttendanceRules;
  notificationSettings: NotificationSettings;
}

export interface AttendanceRules {
  autoAbsentAfterMinutes: number;
  requireFaceVerification: boolean;
  requireGeofence: boolean;
  allowManualEntry: boolean;
  overtimeThresholdMinutes: number;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  lateArrivalAlert: boolean;
  absentAlert: boolean;
  leaveRequestAlert: boolean;
  dailySummaryReport: boolean;
  weeklyReport: boolean;
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export interface ReportConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: string;
  endDate: string;
  departments?: string[];
  employees?: string[];
  format: 'pdf' | 'excel' | 'csv';
}

// ─── Common ──────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface SelectOption {
  value: string;
  label: string;
}
