import { format, parseISO, differenceInMinutes } from 'date-fns';
import type { AttendanceRecord } from '../types';

export const formatDate = (date: string, pattern = 'MMM dd, yyyy'): string => {
  return format(parseISO(date), pattern);
};

export const formatTime = (time: string | null): string => {
  if (!time) return '--:--';
  return format(parseISO(time), 'hh:mm a');
};

export const getStatusColor = (status: AttendanceRecord['status']): string => {
  const colors = {
    present: 'bg-green-100 text-green-800',
    absent: 'bg-red-100 text-red-800',
    late: 'bg-yellow-100 text-yellow-800',
    'half-day': 'bg-orange-100 text-orange-800',
  };
  return colors[status];
};

export const calculateWorkHours = (checkIn: string | null, checkOut: string | null): string => {
  if (!checkIn || !checkOut) return '--';
  const minutes = differenceInMinutes(parseISO(checkOut), parseISO(checkIn));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
