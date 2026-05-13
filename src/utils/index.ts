import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(date: Date | string, fmt = 'dd MMM yyyy'): string {
  return format(new Date(date), fmt);
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), 'dd MMM yyyy, h:mm a');
}

export function timeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatNights(checkIn: Date | string, checkOut: Date | string): number {
  return differenceInDays(new Date(checkOut), new Date(checkIn));
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export const ROOM_STATUS_LABELS: Record<string, string> = {
  VC: 'Vacant Clean', VD: 'Vacant Dirty', OC: 'Occupied Clean',
  OD: 'Occupied Dirty', OOO: 'Out of Order', OOS: 'Out of Service',
  DND: 'Do Not Disturb', INS: 'Inspection',
};

export const ROOM_STATUS_COLORS: Record<string, string> = {
  VC: 'bg-green-100 text-green-800', VD: 'bg-yellow-100 text-yellow-800',
  OC: 'bg-blue-100 text-blue-800', OD: 'bg-purple-100 text-purple-800',
  OOO: 'bg-red-100 text-red-800', OOS: 'bg-gray-200 text-gray-700',
  DND: 'bg-orange-100 text-orange-800', INS: 'bg-cyan-100 text-cyan-800',
};

export const RESERVATION_STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-800', checked_in: 'bg-green-100 text-green-800',
  checked_out: 'bg-gray-100 text-gray-700', cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-orange-100 text-orange-800', inquiry: 'bg-yellow-100 text-yellow-800',
};

export const LOYALTY_TIER_COLORS: Record<string, string> = {
  bronze: 'text-amber-700 bg-amber-50', silver: 'text-gray-600 bg-gray-100',
  gold: 'text-yellow-700 bg-yellow-50', platinum: 'text-purple-700 bg-purple-50',
};

export function debounce<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}