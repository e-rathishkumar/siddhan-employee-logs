import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../shared/api/client';

// Inline default English translations so the app works without backend
const defaultMessages: Record<string, any> = {
  app_name: 'AttendAI',
  login: { title: 'Sign In', email: 'Email Address', password: 'Password', submit: 'Sign In', invalid_credentials: 'Invalid email or password', welcome_back: 'Welcome back!' },
  dashboard: { title: 'Dashboard', total_employees: 'Total Employees', present_today: 'Present Today', absent_today: 'Absent Today', late_today: 'Late Today', on_leave: 'On Leave', attendance_rate: 'Attendance Rate', pending_leaves: 'Pending Leave Requests', recent_activity: 'Recent Activity' },
  employees: { title: 'Employees', add: 'Add Employee', edit: 'Edit Employee', delete: 'Delete Employee', name: 'Name', email: 'Email', phone: 'Phone', department: 'Department', designation: 'Designation', joined: 'Joined Date', status: 'Status', face_registered: 'Face Registered', search_placeholder: 'Search employees...' },
  departments: { title: 'Departments', add: 'Add Department', edit: 'Edit Department', name: 'Department Name', code: 'Code', description: 'Description', head: 'Department Head', employee_count: 'Employees' },
  shifts: { title: 'Shifts', add: 'Add Shift', edit: 'Edit Shift', name: 'Shift Name', code: 'Code', start_time: 'Start Time', end_time: 'End Time', grace_minutes: 'Grace Period (min)', assignments: 'Shift Assignments' },
  holidays: { title: 'Holidays', add: 'Add Holiday', edit: 'Edit Holiday', name: 'Holiday Name', date: 'Date', type: 'Type', public: 'Public Holiday', optional: 'Optional Holiday', restricted: 'Restricted Holiday' },
  leaves: { title: 'Leave Management', types: 'Leave Types', requests: 'Leave Requests', balances: 'Leave Balances', approve: 'Approve', reject: 'Reject', pending: 'Pending', approved: 'Approved', rejected: 'Rejected' },
  attendance: { title: 'Attendance', date: 'Date', check_in: 'Check In', check_out: 'Check Out', status: 'Status', method: 'Verification Method', present: 'Present', absent: 'Absent', late: 'Late', half_day: 'Half Day', export: 'Export' },
  analytics: { title: 'Analytics', trends: 'Attendance Trends', by_department: 'By Department', summary: 'Summary' },
  geofence: { title: 'Geofence Zones', add: 'Add Zone', edit: 'Edit Zone', name: 'Zone Name', address: 'Address', radius: 'Radius (meters)' },
  users: { title: 'User Management', add: 'Add User', edit: 'Edit User', activate: 'Activate', deactivate: 'Deactivate', reset_password: 'Reset Password' },
  roles: { title: 'Roles & Permissions', add: 'Add Role', edit: 'Edit Role', permissions: 'Permissions' },
  audit: { title: 'Audit Logs', action: 'Action', entity: 'Entity', user: 'User', timestamp: 'Timestamp', details: 'Details' },
  settings: { title: 'Settings', general: 'General', attendance_rules: 'Attendance Rules', notifications: 'Notifications', save: 'Save Changes' },
  reports: { title: 'Reports', generate: 'Generate Report', type: 'Report Type', format: 'Format', date_range: 'Date Range' },
  common: { save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', create: 'Create', search: 'Search', filter: 'Filter', export: 'Export', back: 'Back', next: 'Next', previous: 'Previous', loading: 'Loading...', no_data: 'No data available', confirm_delete: 'Are you sure you want to delete this?', success: 'Operation completed successfully', error: 'An error occurred', active: 'Active', inactive: 'Inactive' },
};

export type Locale = 'en' | 'hi' | 'ta';

interface I18nState {
  locale: Locale;
  messages: Record<string, any>;
  isLoaded: boolean;
  setLocale: (locale: Locale) => void;
  loadMessages: (locale: Locale) => Promise<void>;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      locale: 'en',
      messages: defaultMessages,
      isLoaded: true,
      setLocale: (locale: Locale) => {
        set({ locale });
        get().loadMessages(locale);
      },
      loadMessages: async (locale: Locale) => {
        try {
          const { data } = await apiClient.get(`/i18n/messages?lang=${locale}`);
          set({ messages: data.messages, isLoaded: true });
        } catch {
          // Fallback to default messages
          set({ messages: defaultMessages, isLoaded: true });
        }
      },
    }),
    {
      name: 'i18n-storage',
      partialize: (state) => ({ locale: state.locale }),
    }
  )
);

/**
 * Get a translated string by dot-notation key.
 * Example: t('dashboard.title') → 'Dashboard'
 */
export function useTranslation() {
  const { messages, locale, setLocale } = useI18nStore();

  const t = (key: string, fallback?: string): string => {
    const parts = key.split('.');
    let value: any = messages;
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return fallback || key;
      }
    }
    return typeof value === 'string' ? value : fallback || key;
  };

  return { t, locale, setLocale };
}

export const LOCALE_OPTIONS = [
  { code: 'en' as Locale, name: 'English', flag: '🇬🇧' },
  { code: 'hi' as Locale, name: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta' as Locale, name: 'தமிழ்', flag: '🇮🇳' },
];
