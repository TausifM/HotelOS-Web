'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BadgeCheck,
  Briefcase,
  Building2,
  Clock3,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Filter,
  IndianRupee,
  KeyRound,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shield,
  Sparkles,
  UserCheck,
  UserX,
  Users,
  X,
  Edit3,
  CheckSquare,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

type Role =
  | 'owner'
  | 'manager'
  | 'front_desk'
  | 'housekeeping'
  | 'accountant'
  | 'restaurant'
  | 'security'
  | 'maintenance'
  | 'hr';

type Staff = {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  phone: string;
  role: Role;
  department?: string;
  employeeId?: string;
  shift?: string;
  shiftStart?: string;
  shiftEnd?: string;
  employmentType?: string;
  joiningDate?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  monthlySalary?: number;
  hourlyRate?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  reportingManagerId?: string | { _id: string; name: string; role: string; phone?: string };
  avatar?: string;
  permissions?: string[];
  permissionSource?: 'role_default' | 'custom';
  lastPermissionUpdatedAt?: string;
  deactivatedAt?: string;
  deactivatedBy?: string | { _id: string; name: string; role: string };
  deactivationReason?: string;
  createdAt?: string;
  updatedAt?: string;
};

type StaffListResponse = {
  docs: Staff[];
  total: number;
  page: number;
  totalPages: number;
};

type Payroll = {
  name: string;
  role: Role;
  department?: string;
  monthlySalary?: number;
  hourlyRate?: number;
  employmentType?: string;
  joiningDate?: string;
  bankAccountHolder?: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  upiId?: string;
  aadhaarNumber?: string;
  panCard?: string;
};

type MeProfile = {
  _id: string;
  name: string;
  role: Role;
};

const DEPARTMENTS = [
  'Management',
  'Front Office',
  'Housekeeping',
  'Accounts',
  'Restaurant',
  'Security',
  'Maintenance',
  'HR',
  'General',
];

const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'intern'];
const SHIFTS = ['morning', 'evening', 'night', 'general'];
const GENDERS = ['male', 'female', 'other'];

const ROLE_META: Record<
  Exclude<Role, 'owner'>,
  { label: string; chip: string; glow: string; gradient: string }
> = {
  manager: {
    label: 'Manager',
    chip: 'bg-orange-100 text-orange-700 border-orange-200',
    glow: 'shadow-orange-200/60',
    gradient: 'from-orange-500 via-amber-500 to-pink-500',
  },
  front_desk: {
    label: 'Front Desk',
    chip: 'bg-pink-100 text-pink-700 border-pink-200',
    glow: 'shadow-pink-200/60',
    gradient: 'from-pink-500 via-rose-500 to-orange-400',
  },
  housekeeping: {
    label: 'Housekeeping',
    chip: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
    glow: 'shadow-fuchsia-200/60',
    gradient: 'from-fuchsia-500 via-pink-500 to-orange-500',
  },
  accountant: {
    label: 'Accountant',
    chip: 'bg-violet-100 text-violet-700 border-violet-200',
    glow: 'shadow-violet-200/60',
    gradient: 'from-violet-500 via-pink-500 to-orange-500',
  },
  restaurant: {
    label: 'Restaurant',
    chip: 'bg-amber-100 text-amber-700 border-amber-200',
    glow: 'shadow-amber-200/60',
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
  },
  security: {
    label: 'Security',
    chip: 'bg-rose-100 text-rose-700 border-rose-200',
    glow: 'shadow-rose-200/60',
    gradient: 'from-rose-500 via-pink-500 to-red-500',
  },
  maintenance: {
    label: 'Maintenance',
    chip: 'bg-slate-100 text-slate-700 border-slate-200',
    glow: 'shadow-slate-200/60',
    gradient: 'from-slate-500 via-orange-400 to-pink-500',
  },
  hr: {
    label: 'HR',
    chip: 'bg-orange-100 text-orange-700 border-orange-200',
    glow: 'shadow-orange-200/60',
    gradient: 'from-orange-500 via-pink-500 to-fuchsia-500',
  },
};
type PermissionItem = {
  key: string;
  label: string;
};

type PermissionGroup = {
  group: string;
  icon: string;
  perms: PermissionItem[];
};
const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    group: 'Reservations',
    icon: '🛎️',
    perms: [
      { key: 'reservations.read', label: 'View reservations' },
      { key: 'reservations.create', label: 'Create reservations' },
      { key: 'reservations.update', label: 'Edit reservations' },
      { key: 'reservations.cancel', label: 'Cancel reservations' },
    ],
  },
  {
    group: 'Check-in / Check-out',
    icon: '🧾',
    perms: [
      { key: 'checkin.read', label: 'View check-in screen' },
      { key: 'checkin.checkin', label: 'Perform check-in' },
      { key: 'checkin.checkout', label: 'Perform check-out' },
      { key: 'checkin.verifyid', label: 'Verify guest ID' },
    ],
  },
  {
    group: 'Billing',
    icon: '💳',
    perms: [
      { key: 'folios.read', label: 'View folios / bills' },
      { key: 'folios.postcharge', label: 'Post charges' },
      { key: 'folios.payments', label: 'Record payments' },
      { key: 'folios.discount', label: 'Apply discounts' },
      { key: 'folios.void', label: 'Void charges' },
      { key: 'folios.invoice', label: 'Generate GST invoice' },
    ],
  },
  {
    group: 'Rooms',
    icon: '🛏️',
    perms: [
      { key: 'rooms.read', label: 'View rooms' },
      { key: 'rooms.updatestatus', label: 'Update room status' },
      { key: 'rooms.create', label: 'Add or edit rooms' },
      { key: 'rates.read', label: 'View rates' },
      { key: 'rates.update', label: 'Update rates' },
    ],
  },
  {
    group: 'Guests',
    icon: '🧑‍💼',
    perms: [
      { key: 'guests.read', label: 'View guests' },
      { key: 'guests.create', label: 'Add guests' },
      { key: 'guests.update', label: 'Edit guest details' },
      { key: 'guests.export', label: 'Export guest data' },
    ],
  },
  {
    group: 'Housekeeping',
    icon: '🧹',
    perms: [
      { key: 'housekeeping.read', label: 'View housekeeping board' },
      { key: 'housekeeping.update', label: 'Update room housekeeping status' },
    ],
  },
  {
    group: 'Restaurant',
    icon: '🍽️',
    perms: [
      { key: 'restaurant.read', label: 'View restaurant / POS' },
      { key: 'restaurant.orders', label: 'Take orders' },
      { key: 'restaurant.kitchen', label: 'Kitchen display' },
      { key: 'restaurant.menu', label: 'Edit menu items' },
    ],
  },
  {
    group: 'Reports',
    icon: '📊',
    perms: [
      { key: 'reports.read', label: 'View reports' },
      { key: 'reports.financial', label: 'Financial reports' },
      { key: 'reports.export', label: 'Export reports' },
      { key: 'reports.gst', label: 'GST / tax reports' },
    ],
  },
  {
    group: 'Notifications',
    icon: '🔔',
    perms: [
      { key: 'notifications.read', label: 'View notifications' },
      { key: 'notifications.send', label: 'Send messages' },
    ],
  },
  {
    group: 'Staff & HR',
    icon: '👥',
    perms: [
      { key: 'staff.read', label: 'View staff list' },
      { key: 'staff.create', label: 'Add staff members' },
      { key: 'staff.update', label: 'Edit staff details' },
      { key: 'attendance.read', label: 'View attendance' },
      { key: 'attendance.mark', label: 'Mark attendance' },
      { key: 'payroll.read', label: 'View payroll' },
      { key: 'payroll.manage', label: 'Manage payroll' },
    ],
  },
  {
    group: 'Settings & Admin',
    icon: '⚙️',
    perms: [
      { key: 'settings.read', label: 'View settings' },
      { key: 'settings.update', label: 'Edit settings' },
      { key: 'audit.read', label: 'View audit log' },
      { key: 'inventory.read', label: 'View inventory' },
      { key: 'inventory.update', label: 'Manage inventory' },
      { key: 'banquet.read', label: 'View banquet' },
      { key: 'banquet.manage', label: 'Manage banquet' },
    ],
  },
] as const;

const ROLE_DEFAULT_PERMS: Record<string, string[]> = {
  manager: [
    'reservations.read',
    'reservations.create',
    'reservations.update',
    'reservations.cancel',
    'checkin.read',
    'checkin.checkin',
    'checkin.checkout',
    'checkin.verifyid',
    'folios.read',
    'folios.postcharge',
    'folios.payments',
    'folios.discount',
    'folios.invoice',
    'rooms.read',
    'rooms.updatestatus',
    'rates.read',
    'rates.update',
    'guests.read',
    'guests.create',
    'guests.update',
    'housekeeping.read',
    'housekeeping.update',
    'restaurant.read',
    'restaurant.orders',
    'reports.read',
    'reports.financial',
    'reports.export',
    'reports.gst',
    'notifications.read',
    'notifications.send',
    'staff.read',
    'attendance.read',
    'attendance.mark',
    'inventory.read',
    'banquet.read',
    'banquet.manage',
  ],
  front_desk: [
    'reservations.read',
    'reservations.create',
    'reservations.update',
    'checkin.read',
    'checkin.checkin',
    'checkin.checkout',
    'checkin.verifyid',
    'folios.read',
    'folios.postcharge',
    'folios.payments',
    'folios.invoice',
    'rooms.read',
    'rooms.updatestatus',
    'guests.read',
    'guests.create',
    'housekeeping.read',
    'notifications.read',
    'notifications.send',
    'inventory.read',
  ],
  housekeeping: ['rooms.read', 'rooms.updatestatus', 'housekeeping.read', 'housekeeping.update', 'inventory.read'],
  accountant: [
    'reservations.read',
    'folios.read',
    'folios.postcharge',
    'folios.payments',
    'folios.discount',
    'folios.void',
    'folios.invoice',
    'reports.read',
    'reports.financial',
    'reports.export',
    'reports.gst',
    'guests.read',
    'payroll.read',
    'payroll.manage',
    'inventory.read',
  ],
  restaurant: ['restaurant.read', 'restaurant.orders', 'restaurant.kitchen', 'restaurant.menu', 'folios.postcharge', 'guests.read', 'inventory.read'],
  security: ['reservations.read', 'checkin.read', 'checkin.verifyid', 'guests.read', 'rooms.read', 'housekeeping.read'],
  maintenance: ['rooms.read', 'rooms.updatestatus', 'inventory.read', 'inventory.update', 'housekeeping.read'],
  hr: ['staff.read', 'staff.create', 'staff.update', 'attendance.read', 'attendance.mark', 'payroll.read', 'payroll.manage', 'reports.read'],
};
const OPTIONAL_LOGIN_ROLES: Role[] = [
  'housekeeping',
  'security',
  'maintenance',
  'restaurant',
];

const roleNeedsToggle = (role: Role) => OPTIONAL_LOGIN_ROLES.includes(role);

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function getId(s: Partial<Staff>) {
  return (s.id || s._id || '') as string;
}

function roleMeta(role: Role) {
  if (role === 'owner') {
    return {
      label: 'Owner',
      chip: 'bg-orange-100 text-orange-800 border-orange-200',
      glow: 'shadow-orange-200/60',
      gradient: 'from-orange-600 via-pink-500 to-rose-500',
    };
  }
  return ROLE_META[role];
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function formatCurrency(value?: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function maskAccount(v?: string) {
  if (!v) return '—';
  const raw = String(v);
  if (raw.length <= 4) return raw;
  return `${'*'.repeat(Math.max(0, raw.length - 4))}${raw.slice(-4)}`;
}

function maskAadhaar(v?: string) {
  if (!v) return '—';
  const digits = String(v).replace(/\D/g, '');
  if (!digits) return '—';
  const last = digits.slice(-4);
  return `XXXX XXXX ${last}`;
}

function getShiftLabel(staff: Staff) {
  if (!staff.shiftStart || !staff.shiftEnd) return staff.shift || '—';
  return `${staff.shiftStart} - ${staff.shiftEnd}`;
}

function isOnShift(staff: Staff) {
  if (!staff.shiftStart || !staff.shiftEnd) return false;
  const [sh, sm] = staff.shiftStart.split(':').map(Number);
  const [eh, em] = staff.shiftEnd.split(':').map(Number);
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  if (end >= start) return current >= start && current <= end;
  return current >= start || current <= end;
}

function getAllPermKeys(group: PermissionGroup) {
  return group.perms.map((x) => x.key);
}
function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl sm:rounded-3xl",
        "border border-white/60 bg-white/70",
        "p-4 sm:p-5 lg:p-6",
        "shadow-[0_12px_40px_-20px_rgba(255,92,130,0.45)]",
        "sm:shadow-[0_18px_50px_-24px_rgba(255,92,130,0.55)]",
        "backdrop-blur-xl transition-transform duration-300 hover:scale-[1.02]"
      )}
    >
      {/* Gradient background wash */}
      <div className={cn("absolute inset-0 opacity-15 bg-gradient-to-br", gradient)} />

      <div className="relative flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] sm:tracking-[0.24em] text-slate-500">
            {label}
          </p>
          <p className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={cn(
            "shrink-0 rounded-xl sm:rounded-2xl bg-gradient-to-br p-2 sm:p-3 lg:p-3.5 text-white shadow-lg",
            gradient
          )}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
        </div>
      </div>
    </div>
  );
}


function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        {label} {hint ? <span className="normal-case tracking-normal text-slate-400">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-2xl border border-orange-100 bg-white/90 px-3.5 py-3 text-sm text-slate-800 outline-none transition',
        'placeholder:text-slate-400 focus:border-pink-300 focus:ring-4 focus:ring-pink-100',
        props.className,
      )}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'w-full rounded-2xl border border-orange-100 bg-white/90 px-3.5 py-3 text-sm text-slate-800 outline-none transition',
        'focus:border-pink-300 focus:ring-4 focus:ring-pink-100',
        props.className,
      )}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full rounded-2xl border border-orange-100 bg-white/90 px-3.5 py-3 text-sm text-slate-800 outline-none transition',
        'placeholder:text-slate-400 focus:border-pink-300 focus:ring-4 focus:ring-pink-100',
        props.className,
      )}
    />
  );
}

function ModalShell({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  headerGradient,
  maxWidth = 'max-w-4xl',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  headerGradient: string;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button
            aria-label="Close modal"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 16 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_30px_100px_-30px_rgba(255,85,128,0.75)]',
              maxWidth,
            )}
          >
            <div className={cn('bg-gradient-to-r px-6 py-5 text-white', headerGradient)}>
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white/15 p-2.5 backdrop-blur">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-black tracking-tight">{title}</h3>
                  {subtitle ? <p className="mt-1 text-sm text-white/80">{subtitle}</p> : null}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-2xl p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function StaffCard({
  staff,
  canManage,
  canViewPayroll,
  canDeactivate,
  onEdit,
  onPayroll,
  onPermissions,
  onResetPassword,
  onDeactivate,
  onReactivate,
}: {
  staff: Staff;
  canManage: boolean;
  canViewPayroll: boolean;
  canDeactivate: boolean;
  onEdit: (staff: Staff) => void;
  onPayroll: (staff: Staff) => void;
  onPermissions: (staff: Staff) => void;
  onResetPassword: (staff: Staff) => void;
  onDeactivate: (staff: Staff) => void;
  onReactivate: (staff: Staff) => void;
}) {
  const meta = roleMeta(staff.role);
  const permCount = staff.permissions?.length || 0;
  const shiftNow = isOnShift(staff);
  const staffId = getId(staff);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group overflow-hidden rounded-[28px] border bg-white/95 shadow-[0_18px_45px_-26px_rgba(255,120,92,0.28)] backdrop-blur-sm transition-all duration-300',
        staff.isActive
          ? 'border-orange-100/80 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_24px_60px_-24px_rgba(255,120,92,0.38)]'
          : 'border-rose-100 bg-white/85 opacity-80'
      )}
    >
      <div className="relative overflow-hidden border-b border-orange-100/70 p-5">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 via-rose-400 to-pink-400" />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/70 via-white to-rose-50/40" />

        <div className="relative flex items-start gap-4">
          <div
            className={cn(
              'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-black text-white shadow-[0_10px_24px_-10px_rgba(255,116,92,0.6)]',
              meta.gradient
            )}
          >
            {staff.name?.charAt(0)?.toUpperCase() || 'S'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-[15px] font-extrabold text-slate-900">
                  {staff.name}
                </h3>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  {staff.employeeId || staffId}
                </p>
              </div>

              {!staff.isActive ? (
                <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-bold text-rose-600">
                  Inactive
                </span>
              ) : shiftNow ? (
                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-bold text-sky-600">
                  On shift
                </span>
              ) : (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600">
                  Active
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={cn(
                  'rounded-full border px-3 py-1 text-[11px] font-bold shadow-sm',
                  meta.chip
                )}
              >
                {meta.label}
              </span>

              <span className="inline-flex items-center gap-1 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-[11px] font-bold text-orange-700">
                <Building2 className="h-3.5 w-3.5" />
                {staff.department || 'General'}
              </span>

              <span className="inline-flex items-center gap-1 rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-[11px] font-bold text-violet-700">
                <Clock3 className="h-3.5 w-3.5" />
                {getShiftLabel(staff)}
              </span>
            </div>

            <div className="mt-4 grid gap-2 text-sm text-slate-500">
              <p className="inline-flex items-center gap-2 truncate">
                <Phone className="h-4 w-4 text-orange-500" />
                {staff.phone}
              </p>

              <p className="inline-flex items-center gap-2 truncate">
                <Mail className="h-4 w-4 text-rose-500" />
                {staff.email || 'No email'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 p-4">
        <div className="rounded-2xl border border-orange-100 bg-gradient-to-b from-orange-50 to-white p-3 text-center">
          <p className="text-lg font-black text-slate-900">{permCount}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Permissions
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-3 text-center">
          <p className="truncate text-sm font-black text-slate-900">
            {formatCurrency(staff.monthlySalary)}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Salary
          </p>
        </div>

        <div className="rounded-2xl border border-violet-100 bg-gradient-to-b from-violet-50 to-white p-3 text-center">
          <p className="truncate text-sm font-black text-slate-900">
            {formatDate(staff.joiningDate)}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Joined
          </p>
        </div>
      </div>

      {(staff.address || staff.notes) && (
        <div className="border-t border-orange-100/70 bg-gradient-to-r from-orange-50/40 to-rose-50/30 px-4 py-3 text-xs text-slate-500">
          {staff.address ? (
            <p className="truncate">
              <span className="font-bold text-slate-700">Address:</span> {staff.address}
            </p>
          ) : null}

          {staff.notes ? (
            <p className="mt-1 truncate">
              <span className="font-bold text-slate-700">Notes:</span> {staff.notes}
            </p>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 border-t border-orange-100/70 bg-white p-3 sm:grid-cols-3">
        <button
          onClick={() => onEdit(staff)}
          disabled={!canManage}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <div className="mb-1 flex justify-center">
            <Edit3 className="h-4 w-4 text-orange-500" />
          </div>
          Edit
        </button>

        <button
          onClick={() => onPermissions(staff)}
          disabled={!canManage}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <div className="mb-1 flex justify-center">
            <Shield className="h-4 w-4 text-rose-500" />
          </div>
          Access
        </button>

        <button
          onClick={() => onResetPassword(staff)}
          disabled={!canManage}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <div className="mb-1 flex justify-center">
            <KeyRound className="h-4 w-4 text-violet-500" />
          </div>
          Password
        </button>

        <button
          onClick={() => onPayroll(staff)}
          disabled={!canViewPayroll}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold text-slate-700 transition hover:border-amber-200 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <div className="mb-1 flex justify-center">
            <CreditCard className="h-4 w-4 text-amber-500" />
          </div>
          Payroll
        </button>

        {staff.isActive ? (
          <button
            onClick={() => onDeactivate(staff)}
            disabled={!canDeactivate}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <div className="mb-1 flex justify-center">
              <UserX className="h-4 w-4 text-rose-500" />
            </div>
            Deactivate
          </button>
        ) : (
          <button
            onClick={() => onReactivate(staff)}
            disabled={!canManage}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <div className="mb-1 flex justify-center">
              <UserCheck className="h-4 w-4 text-emerald-500" />
            </div>
            Activate
          </button>
        )}
      </div>
    </motion.div>
  );
}

function StaffFormModal({
  open,
  onClose,
  editing,
  onSaved,
  managers,
}: {
  open: boolean;
  onClose: () => void;
  editing: Staff | null;
  onSaved: () => void;
  managers?: any;
}) {
  const isEdit = Boolean(editing);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'front_desk' as Exclude<Role, 'owner'>,
    department: '',
    employeeId: '',
    password: '',
    shift: 'general',
    shiftStart: '09:00',
    shiftEnd: '18:00',
    employmentType: 'full_time',
    joiningDate: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    notes: '',
    monthlySalary: '',
    hourlyRate: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    reportingManagerId: '',
    avatar: '',
    isActive: true,
  });

  const NO_PASSWORD_ROLES: Role[] = [
    'housekeeping',
    'security',
    'maintenance',
    'restaurant',
  ];

  const needsPasswordForRole = (role: Role) => !NO_PASSWORD_ROLES.includes(role);

  useEffect(() => {
    if (!open) return;

    const nextRole = ((editing?.role as Exclude<Role, 'owner'>) || 'front_desk');

    setForm({
      name: editing?.name || '',
      email: editing?.email || '',
      phone: editing?.phone || '',
      role: nextRole,
      department: editing?.department || '',
      employeeId: editing?.employeeId || '',
      password: '',
      shift: editing?.shift || 'general',
      shiftStart: editing?.shiftStart || '09:00',
      shiftEnd: editing?.shiftEnd || '18:00',
      employmentType: editing?.employmentType || 'full_time',
      joiningDate: editing?.joiningDate ? String(editing.joiningDate).slice(0, 10) : '',
      dateOfBirth: editing?.dateOfBirth ? String(editing.dateOfBirth).slice(0, 10) : '',
      gender: editing?.gender || '',
      address: editing?.address || '',
      notes: editing?.notes || '',
      monthlySalary: editing?.monthlySalary?.toString() || '',
      hourlyRate: editing?.hourlyRate?.toString() || '',
      emergencyContactName: editing?.emergencyContactName || '',
      emergencyContactPhone: editing?.emergencyContactPhone || '',
      reportingManagerId:
        typeof editing?.reportingManagerId === 'object'
          ? editing?.reportingManagerId?._id || ''
          : editing?.reportingManagerId || '',
      avatar: editing?.avatar || '',
      isActive: editing?.isActive ?? true,
    });
  }, [open, editing]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim() || !form.phone.trim()) {
        throw new Error('Name and phone are required');
      }

      if (!isEdit && needsPasswordForRole(form.role) && form.password.trim().length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const payload = {
        ...form,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        department: form.department || undefined,
        employeeId: form.employeeId || undefined,
        monthlySalary: form.monthlySalary ? Number(form.monthlySalary) : 0,
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : 0,
        joiningDate: form.joiningDate || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        address: form.address || undefined,
        notes: form.notes || undefined,
        emergencyContactName: form.emergencyContactName || undefined,
        emergencyContactPhone: form.emergencyContactPhone || undefined,
        reportingManagerId: form.reportingManagerId || undefined,
        avatar: form.avatar || undefined,
        password: !isEdit && needsPasswordForRole(form.role)
          ? form.password.trim()
          : undefined,
      };

      if (isEdit) {
        await api.put(`/api/staff/${getId(editing || {})}`, payload);
      } else {
        await api.post('/api/staff', payload);
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Staff updated' : 'Staff created');
      onSaved();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Request failed');
    },
  });

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Staff Member' : 'Add Staff Member'}
      subtitle="Orange-pink premium staff form with profile, work, payroll-ready, and emergency fields."
      icon={Users}
      headerGradient="from-orange-500 via-pink-500 to-fuchsia-500"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-gradient-to-b from-orange-50/60 via-white to-pink-50/60 px-6 py-5">
          <section className="rounded-[28px] border border-orange-100 bg-white/80 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-orange-500" />
              <h4 className="font-black text-slate-900">Basic Information</h4>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Full Name">
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Rajesh Kumar" required />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+91 9876543210" required />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="staff@hotel.com" />
              </Field>
              <Field label="Employee ID">
                <Input value={form.employeeId} onChange={(e) => setForm((p) => ({ ...p, employeeId: e.target.value }))} placeholder="STF-1024" />
              </Field>
              <Field label="Date of Birth">
                <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))} />
              </Field>
              <Field label="Gender">
                <Select value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}>
                  <option value="">Select gender</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Address">
                <Textarea rows={3} value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder="Full address" />
              </Field>
              <Field label="Notes">
                <Textarea rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Internal notes" />
              </Field>
            </div>
          </section>

          <section className="rounded-[28px] border border-pink-100 bg-white/80 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-pink-500" />
              <h4 className="font-black text-slate-900">Role & Work Details</h4>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Role">
                <Select
                  value={form.role}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      role: e.target.value as Exclude<Role, 'owner'>,
                      password: '',
                    }))
                  }
                >
                  {Object.entries(ROLE_META).map(([value, meta]) => (
                    <option key={value} value={value}>
                      {meta.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Department">
                <Select value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}>
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Employment Type">
                <Select value={form.employmentType} onChange={(e) => setForm((p) => ({ ...p, employmentType: e.target.value }))}>
                  {EMPLOYMENT_TYPES.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Joining Date">
                <Input type="date" value={form.joiningDate} onChange={(e) => setForm((p) => ({ ...p, joiningDate: e.target.value }))} />
              </Field>

              <Field label="Shift">
                <Select value={form.shift} onChange={(e) => setForm((p) => ({ ...p, shift: e.target.value }))}>
                  {SHIFTS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Active Status">
                <Select
                  value={String(form.isActive)}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.value === 'true' }))}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Select>
              </Field>

              <Field label="Shift Start">
                <Input type="time" value={form.shiftStart} onChange={(e) => setForm((p) => ({ ...p, shiftStart: e.target.value }))} />
              </Field>

              <Field label="Shift End">
                <Input type="time" value={form.shiftEnd} onChange={(e) => setForm((p) => ({ ...p, shiftEnd: e.target.value }))} />
              </Field>

              <Field label="Monthly Salary">
                <Input
                  type="number"
                  value={form.monthlySalary}
                  onChange={(e) => setForm((p) => ({ ...p, monthlySalary: e.target.value }))}
                  placeholder="18000"
                />
              </Field>

              <Field label="Hourly Rate">
                <Input
                  type="number"
                  value={form.hourlyRate}
                  onChange={(e) => setForm((p) => ({ ...p, hourlyRate: e.target.value }))}
                  placeholder="150"
                />
              </Field>

              <Field label="Reporting Manager">
                <Select
                  value={form.reportingManagerId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, reportingManagerId: e.target.value }))
                  }
                >
                  <option value="">Select reporting manager</option>
                  {(managers || [])
                    .filter((m: any) => {
                      const id = getId(m);
                      const editingId = editing ? getId(editing) : '';
                      return id && id !== editingId;
                    })
                    .map((manager: any) => {
                      const id = getId(manager);
                      return (
                        <option key={id} value={id}>
                          {manager.name}
                          {manager.role ? ` — ${String(manager.role).replace('_', ' ')}` : ''}
                        </option>
                      );
                    })}
                </Select>
              </Field>

              <Field label="Avatar URL">
                <Input
                  value={form.avatar}
                  onChange={(e) => setForm((p) => ({ ...p, avatar: e.target.value }))}
                  placeholder="https://..."
                />
              </Field>
            </div>

            {!isEdit ? (
              <div className="mt-4 rounded-2xl border border-pink-200 bg-pink-50 px-4 py-3 text-sm text-pink-700">
                Default role permissions can be applied right after creation from the Access modal.
              </div>
            ) : null}
          </section>

          <section className="rounded-[28px] border border-fuchsia-100 bg-white/80 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Phone className="h-4 w-4 text-fuchsia-500" />
              <h4 className="font-black text-slate-900">Emergency Contact</h4>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Emergency Contact Name">
                <Input
                  value={form.emergencyContactName}
                  onChange={(e) => setForm((p) => ({ ...p, emergencyContactName: e.target.value }))}
                  placeholder="Contact person name"
                />
              </Field>
              <Field label="Emergency Contact Phone">
                <Input
                  value={form.emergencyContactPhone}
                  onChange={(e) => setForm((p) => ({ ...p, emergencyContactPhone: e.target.value }))}
                  placeholder="+91 9XXXXXXXXX"
                />
              </Field>
            </div>
          </section>

          {!isEdit && needsPasswordForRole(form.role) ? (
            <section className="rounded-[28px] border border-amber-100 bg-white/80 p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-amber-500" />
                <h4 className="font-black text-slate-900">Initial Login Password</h4>
              </div>
              <Field label="Temporary Password" hint="minimum 6 characters">
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Set a temporary password"
                />
              </Field>
            </section>
          ) : null}
        </div>

        <div className="flex items-center gap-3 border-t border-orange-100 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-pink-200/70 transition hover:brightness-105 disabled:opacity-60"
          >
            {mutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Save Changes' : 'Create Staff'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function PayrollModal({
  open,
  onClose,
  staff,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  staff: Staff | null;
  onSaved: () => void;
}) {
  const staffId = getId(staff || {});
  const payrollQuery = useQuery({
    queryKey: ['staff-payroll', staffId],
    enabled: open && !!staffId,
    queryFn: async () => {
      const res = await api.get(`/api/staff/${staffId}/payroll`);
      return res.data.data as Payroll;
    },
  });

  const [form, setForm] = useState<Payroll>({
    name: '',
    role: 'front_desk',
    monthlySalary: 0,
    hourlyRate: 0,
    employmentType: 'full_time',
    joiningDate: '',
    bankAccountHolder: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    upiId: '',
    aadhaarNumber: '',
    panCard: '',
    department: '',
  });

  useEffect(() => {
    if (payrollQuery.data) {
      setForm(payrollQuery.data);
    }
  }, [payrollQuery.data]);

  const mutation = useMutation({
    mutationFn: async () => {
      await api.put(`/api/staff/${staffId}/payroll`, {
        monthlySalary: Number(form.monthlySalary || 0),
        hourlyRate: Number(form.hourlyRate || 0),
        employmentType: form.employmentType || undefined,
        bankAccountHolder: form.bankAccountHolder || undefined,
        bankName: form.bankName || undefined,
        accountNumber: form.accountNumber || undefined,
        ifsc: form.ifsc || undefined,
        upiId: form.upiId || undefined,
        aadhaarNumber: form.aadhaarNumber || undefined,
        panCard: form.panCard || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Payroll details updated');
      onSaved();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update payroll');
    },
  });

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Payroll & KYC"
      subtitle={staff ? `${staff.name} • secure payroll and bank details` : 'Loading'}
      icon={CreditCard}
      headerGradient="from-amber-500 via-orange-500 to-pink-500"
    >
      <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-amber-50/60 via-white to-pink-50/60 px-6 py-5">
        {payrollQuery.isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : payrollQuery.isError ? (
          <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700">
            Unable to load payroll. This usually means the signed-in role does not have payroll access.
          </div>
        ) : (
          <div className="space-y-5">
            <section className="rounded-[28px] border border-orange-100 bg-white/80 p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-orange-500" />
                <h4 className="font-black text-slate-900">Compensation</h4>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Monthly Salary">
                  <Input
                    type="number"
                    value={form.monthlySalary ?? 0}
                    onChange={(e) => setForm((p) => ({ ...p, monthlySalary: Number(e.target.value) }))}
                  />
                </Field>
                <Field label="Hourly Rate">
                  <Input
                    type="number"
                    value={form.hourlyRate ?? 0}
                    onChange={(e) => setForm((p) => ({ ...p, hourlyRate: Number(e.target.value) }))}
                  />
                </Field>
                <Field label="Employment Type">
                  <Select value={form.employmentType || ''} onChange={(e) => setForm((p) => ({ ...p, employmentType: e.target.value }))}>
                    {EMPLOYMENT_TYPES.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </section>

            <section className="rounded-[28px] border border-pink-100 bg-white/80 p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-pink-500" />
                <h4 className="font-black text-slate-900">Bank Details</h4>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Account Holder">
                  <Input value={form.bankAccountHolder || ''} onChange={(e) => setForm((p) => ({ ...p, bankAccountHolder: e.target.value }))} />
                </Field>
                <Field label="Bank Name">
                  <Input value={form.bankName || ''} onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))} />
                </Field>
                <Field label="Account Number">
                  <Input value={form.accountNumber || ''} onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))} />
                </Field>
                <Field label="IFSC">
                  <Input value={form.ifsc || ''} onChange={(e) => setForm((p) => ({ ...p, ifsc: e.target.value.toUpperCase() }))} />
                </Field>
                <Field label="UPI ID">
                  <Input value={form.upiId || ''} onChange={(e) => setForm((p) => ({ ...p, upiId: e.target.value }))} />
                </Field>
                <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-500">Masked preview</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">{maskAccount(form.accountNumber)}</p>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-fuchsia-100 bg-white/80 p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-fuchsia-500" />
                <h4 className="font-black text-slate-900">KYC</h4>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Aadhaar Number">
                  <Input value={form.aadhaarNumber || ''} onChange={(e) => setForm((p) => ({ ...p, aadhaarNumber: e.target.value }))} />
                </Field>
                <Field label="PAN Card">
                  <Input value={form.panCard || ''} onChange={(e) => setForm((p) => ({ ...p, panCard: e.target.value.toUpperCase() }))} />
                </Field>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-pink-100 bg-pink-50/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-pink-500">Aadhaar preview</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">{maskAadhaar(form.aadhaarNumber)}</p>
                </div>
                <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-500">PAN preview</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">{form.panCard || '—'}</p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-orange-100 bg-white px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
        >
          Close
        </button>
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || payrollQuery.isError || payrollQuery.isLoading}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200/70 transition hover:brightness-105 disabled:opacity-60"
        >
          {mutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Payroll
        </button>
      </div>
    </ModalShell>
  );
}

function PermissionsModal({
  open,
  onClose,
  staff,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  staff: Staff | null;
  onSaved: () => void;
}) {
  const [search, setSearch] = useState('');
  const [perms, setPerms] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setPerms(staff?.permissions || []);
  }, [staff]);

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return PERMISSION_GROUPS;
    return PERMISSION_GROUPS.map((group) => ({
      ...group,
      perms: group.perms.filter((perm) => perm.label.toLowerCase().includes(term) || perm.key.toLowerCase().includes(term)),
    })).filter((group) => group.perms.length > 0);
  }, [search]);

  const mutation = useMutation({
    mutationFn: async () => {
      await api.put(`/api/staff/${getId(staff || {})}/permissions`, { permissions: perms });
    },
    onSuccess: () => {
      toast.success('Permissions saved');
      onSaved();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save permissions');
    },
  });

  function togglePerm(key: string) {
    setPerms((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  }

  function toggleGroup(group: (typeof PERMISSION_GROUPS)[number]) {
    const keys = getAllPermKeys(group);
    const allOn = keys.every((k) => perms.includes(k));
    if (allOn) setPerms((prev) => prev.filter((p) => !keys.includes(p)))
    else setPerms((prev) => Array.from(new Set([...prev, ...keys])));
  }

  function applyDefaults() {
    const role = staff?.role || 'front_desk';
    const next = ROLE_DEFAULT_PERMS[role] || [];
    setPerms(next);
    toast.success(`Applied default permissions for ${roleMeta(role as Role).label}`);
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Permission Access"
      subtitle={staff ? `${staff.name} • ${roleMeta(staff.role).label}` : 'Loading'}
      icon={Shield}
      headerGradient="from-pink-500 via-fuchsia-500 to-orange-500"
    >
      <div className="border-b border-pink-100 bg-white px-6 py-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-pink-100 bg-pink-50/60 px-4 py-3">
            <Search className="h-4 w-4 text-pink-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search permissions"
              className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>
          <button
            type="button"
            onClick={applyDefaults}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700 transition hover:bg-orange-100"
          >
            <RefreshCw className="h-4 w-4" />
            Role Defaults
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-pink-50/60 via-white to-orange-50/60 px-6 py-5">
        {filteredGroups.map((group) => {
          const keys = getAllPermKeys(group);
          const allOn = keys.every((k) => perms.includes(k));
          const someOn = keys.some((k) => perms.includes(k));
          const isCollapsed = collapsed[group.group];

          return (
            <div
              key={group.group}
              className="overflow-hidden rounded-[26px] border border-pink-100 bg-white/85 shadow-sm"
            >
              <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-pink-50 px-4 py-4">
                <button
                  type="button"
                  onClick={() => setCollapsed((p) => ({ ...p, [group.group]: !p[group.group] }))}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="text-lg">{group.icon}</span>

                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-900">{group.group}</p>
                    <p className="text-xs text-slate-500">
                      {keys.filter((k) => perms.includes(k)).length}/{keys.length} enabled
                    </p>
                  </div>

                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleGroup(group);
                  }}
                  className={cn(
                    'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2',
                    allOn
                      ? 'border-pink-500 bg-pink-500 text-white'
                      : someOn
                        ? 'border-pink-300 bg-pink-100 text-pink-700'
                        : 'border-slate-300 bg-white'
                  )}
                  aria-label={`Toggle all permissions in ${group.group}`}
                >
                  {allOn ? (
                    <CheckSquare className="h-3 w-3" />
                  ) : someOn ? (
                    <div className="h-1.5 w-1.5 rounded-sm bg-pink-600" />
                  ) : null}
                </button>
              </div>

              {!isCollapsed ? (
                <div className="grid grid-cols-1 gap-2 p-4 md:grid-cols-2">
                  {group.perms.map((perm) => {
                    const active = perms.includes(perm.key);
                    return (
                      <button
                        type="button"
                        key={perm.key}
                        onClick={() => togglePerm(perm.key)}
                        className={cn(
                          'flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left text-sm transition',
                          active
                            ? 'border-pink-200 bg-gradient-to-r from-pink-50 to-orange-50 text-pink-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-pink-200 hover:bg-pink-50/50'
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2',
                            active ? 'border-pink-500 bg-pink-500 text-white' : 'border-slate-300 bg-white'
                          )}
                        >
                          {active ? <CheckSquare className="h-3 w-3" /> : null}
                        </span>
                        <span>{perm.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-pink-100 bg-white px-6 py-4">
        <p className="text-sm text-slate-500">{perms.length} permissions selected</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-pink-200/70 transition hover:brightness-105 disabled:opacity-60"
          >
            {mutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Permissions
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ResetPasswordModal({
  open,
  onClose,
  staff,
}: {
  open: boolean;
  onClose: () => void;
  staff: Staff | null;
}) {
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword('');
      setVisible(false);
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (password.trim().length < 6) throw new Error('Minimum 6 characters');
      await api.put(`/api/staff/${getId(staff || {})}/reset-password`, { newPassword: password });
    },
    onSuccess: () => {
      toast.success('Password reset successful');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to reset password');
    },
  });

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Reset Password"
      subtitle={staff ? `Set a new password for ${staff.name}` : ''}
      icon={KeyRound}
      headerGradient="from-amber-500 via-orange-500 to-rose-500"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 bg-gradient-to-b from-amber-50/60 via-white to-rose-50/60 px-6 py-5">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Minimum password length is 6 characters.
        </div>

        <div className="relative">
          <Field label="New Password">
            <Input
              type={visible ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a strong password"
            />
          </Field>
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-[43px] text-slate-400 transition hover:text-slate-600"
          >
            {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-amber-100 bg-white px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || password.length < 6}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200/70 transition hover:brightness-105 disabled:opacity-60"
        >
          {mutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Reset Password
        </button>
      </div>
    </ModalShell>
  );
}

function DeactivateModal({
  open,
  onClose,
  staff,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  staff: Staff | null;
  onDone: () => void;
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  const mutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/staff/${getId(staff || {})}`, {
        data: {
          deactivationReason: reason || 'Deactivated by owner',
        },
      });
    },
    onSuccess: () => {
      toast.success('Staff deactivated');
      onDone();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to deactivate staff');
    },
  });

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Deactivate Staff"
      subtitle={staff ? `${staff.name} will be marked inactive` : ''}
      icon={UserX}
      headerGradient="from-rose-500 via-pink-500 to-orange-500"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 bg-gradient-to-b from-rose-50/60 via-white to-orange-50/60 px-6 py-5">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          This is a soft deactivation. The record stays in the system and can still be audited later.
        </div>
        <Field label="Reason">
          <Textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional deactivation reason"
          />
        </Field>
      </div>
      <div className="flex items-center gap-3 border-t border-rose-100 bg-white px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-200/70 transition hover:brightness-105 disabled:opacity-60"
        >
          {mutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
          Deactivate
        </button>
      </div>
    </ModalShell>
  );
}

export default function StaffPage() {
  const qc = useQueryClient();
  const { staff: authStaff, isHydrated } = useAuthStore();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('active');
  const [page] = useState(1);
  const [limit] = useState(100);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [payrollStaff, setPayrollStaff] = useState<Staff | null>(null);
  const [permStaff, setPermStaff] = useState<Staff | null>(null);
  const [resetStaff, setResetStaff] = useState<Staff | null>(null);
  const [deactivateStaff, setDeactivateStaff] = useState<Staff | null>(null);

  const handleEdit = async (staff: Staff) => {
    try {
      const id = getId(staff);
      const res = await api.get(`/api/staff/${id}`);
      console.log('staff details:', res.data.data);
      setEditing(res.data.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load staff details');
    }
  };

  const meQuery = useQuery({
    queryKey: ['staff-me'],
    queryFn: async () => {
      const res = await api.get('/api/staff/me/profile');
      return res.data.data as MeProfile;
    },
  });
  const { data: managersData } = useQuery({
    queryKey: ['staff-managers'],
    queryFn: () =>
      api
        .get('/api/staff/lookup/assignable')
        .then((r) =>
          (r.data.data as { _id: string; name: string; role: string }[]).filter(
            (s) => s.role === 'manager' || s.role === 'owner'
          )
        ),
    staleTime: 60_000,
  });

  const listQuery = useQuery({
    queryKey: ['staff', search, roleFilter, departmentFilter, statusFilter, page, limit],
    queryFn: async () => {
      const res = await api.get('/api/staff', {
        params: {
          page,
          limit,
          search: search || undefined,
          role: roleFilter || undefined,
          department: departmentFilter || undefined,
          isActive: statusFilter === '' ? undefined : statusFilter === 'active',
        },
      });
      return res.data.data as StaffListResponse;
    },
  });

  const role = String(authStaff?.role || '').trim().toLowerCase();
  const canManage = isHydrated && ['owner', 'manager'].includes(role);
  const canViewPayroll = isHydrated && ['owner', 'manager', 'hr'].includes(role);
  const canDeactivate = isHydrated && role === 'owner';

  const docs = listQuery.data?.docs || [];
  const stats = useMemo(
    () => ({
      total: docs.length,
      active: docs.filter((s) => s.isActive).length,
      inactive: docs.filter((s) => !s.isActive).length,
      onShift: docs.filter((s) => isOnShift(s)).length,
    }),
    [docs],
  );

  const reactivateMutation = useMutation({
    mutationFn: async (staff: Staff) => {
      await api.put(`/api/staff/${getId(staff)}`, { isActive: true });
    },
    onSuccess: () => {
      toast.success('Staff activated');
      qc.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to activate staff');
    },
  });

  async function refreshAll() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['staff'] }),
      qc.invalidateQueries({ queryKey: ['staff-managers'] }),
    ]);
  }
  if (!isHydrated) {
    return (
      <DashboardLayout title="Staff">
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout title='Staff Management'>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,139,61,0.15),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,72,145,0.18),_transparent_32%),linear-gradient(180deg,#fff8f3_0%,#fffdfb_45%,#fff7fb_100%)] px-4 py-6 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[34px] border border-orange-200/70 bg-gradient-to-r from-orange-400 via-orange-500 to-rose-500 p-[1px] shadow-[0_30px_120px_-30px_rgba(255,115,85,0.45)]">
            <div className="relative rounded-[33px] bg-gradient-to-r from-orange-500 via-orange-500 to-rose-500 px-6 py-7 text-white md:px-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.10),transparent_28%)]" />
              <div className="absolute right-4 top-4 hidden h-28 w-28 rounded-full bg-white/10 blur-2xl md:block" />
              <div className="absolute bottom-0 right-20 hidden h-20 w-20 rounded-full bg-pink-300/20 blur-2xl md:block" />

              <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-white/95 backdrop-blur-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    Orange Pink Staff Suite
                  </div>

                  <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
                    Staff Management
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
                    Manage team profiles, roles, shifts, payroll, KYC, access permissions, password resets, and staff activation from one rich UI.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => refreshAll()}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/12 px-4 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/18"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </button>

                  <button
                    onClick={() => setAddOpen(true)}
                    disabled={!canManage}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-[0_16px_35px_-18px_rgba(255,255,255,0.65)] transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add Staff
                  </button>
                </div>
              </div>

              <div className="relative mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard
                  label="Visible Staff"
                  value={stats.total}
                  icon={Users}
                  gradient="from-orange-400 via-rose-400 to-pink-400"
                />
                <StatCard
                  label="Active"
                  value={stats.active}
                  icon={BadgeCheck}
                  gradient="from-emerald-400 via-teal-400 to-cyan-400"
                />
                <StatCard
                  label="On Shift"
                  value={stats.onShift}
                  icon={Clock3}
                  gradient="from-sky-400 via-blue-400 to-indigo-400"
                />
                <StatCard
                  label="Inactive"
                  value={stats.inactive}
                  icon={UserX}
                  gradient="from-rose-400 via-pink-400 to-orange-400"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[30px] border border-white/70 bg-white/75 p-4 shadow-[0_20px_70px_-35px_rgba(255,102,140,0.45)] backdrop-blur md:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="flex min-w-[280px] flex-1 items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3">
                <Search className="h-4 w-4 text-orange-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, phone, email, employee ID"
                  className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:w-auto">
                <div className="flex items-center gap-2 rounded-2xl border border-pink-100 bg-pink-50/60 px-3 py-3">
                  <Filter className="h-4 w-4 text-pink-500" />
                  <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="border-0 bg-transparent p-0 focus:ring-0">
                    <option value="">All roles</option>
                    {Object.entries(ROLE_META).map(([value, meta]) => (
                      <option key={value} value={value}>
                        {meta.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-orange-100 bg-orange-50/60 px-3 py-3">
                  <Building2 className="h-4 w-4 text-orange-500" />
                  <Select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="border-0 bg-transparent p-0 focus:ring-0">
                    <option value="">All departments</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-3 rounded-2xl bg-slate-100 p-1">
                  {[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: '', label: 'All' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => setStatusFilter(item.value as 'active' | 'inactive' | '')}
                      className={cn(
                        'rounded-xl px-3 py-2 text-xs font-bold transition',
                        statusFilter === item.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(ROLE_META).map(([value, meta]) => (
                <button
                  key={value}
                  onClick={() => setRoleFilter((p) => (p === value ? '' : value))}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-bold transition',
                    roleFilter === value ? meta.chip : 'border-slate-200 bg-white text-slate-600 hover:border-pink-200 hover:bg-pink-50',
                  )}
                >
                  {meta.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            {listQuery.isLoading ? (
              <div className="flex justify-center py-20">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
              </div>
            ) : listQuery.isError ? (
              <div className="rounded-[30px] border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
                Failed to load staff list.
              </div>
            ) : docs.length === 0 ? (
              <div className="rounded-[30px] border border-white/70 bg-white/80 p-12 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 via-pink-500 to-fuchsia-500 text-white shadow-lg">
                  <Users className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-black text-slate-900">No staff found</h3>
                <p className="mt-2 text-sm text-slate-500">Try adjusting filters or add your first staff member.</p>
                <button
                  onClick={() => setAddOpen(true)}
                  disabled={!canManage}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-pink-200/70 transition hover:brightness-105 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  Add Staff
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {docs.map((staff) => (
                  <StaffCard
                    key={getId(staff)}
                    staff={staff}
                    canManage={canManage}
                    canViewPayroll={canViewPayroll}
                    canDeactivate={canDeactivate}
                    onEdit={handleEdit}
                    onPayroll={setPayrollStaff}
                    onPermissions={setPermStaff}
                    onResetPassword={setResetStaff}
                    onDeactivate={setDeactivateStaff}
                    onReactivate={(s) => reactivateMutation.mutate(s)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <StaffFormModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          editing={null}
          managers={managersData || []}
          onSaved={() => {
            refreshAll();
          }}
        />

        <StaffFormModal
          open={!!editing}
          onClose={() => setEditing(null)}
          editing={editing}
          managers={managersData || []}
          onSaved={() => {
            refreshAll();
            setEditing(null);
          }}
        />

        <PayrollModal
          open={!!payrollStaff}
          onClose={() => setPayrollStaff(null)}
          staff={payrollStaff}
          onSaved={() => {
            refreshAll();
            setPayrollStaff(null);
          }}
        />

        <PermissionsModal
          open={!!permStaff}
          onClose={() => setPermStaff(null)}
          staff={permStaff}
          onSaved={() => {
            refreshAll();
            setPermStaff(null);
          }}
        />

        <ResetPasswordModal open={!!resetStaff} onClose={() => setResetStaff(null)} staff={resetStaff} />

        <DeactivateModal
          open={!!deactivateStaff}
          onClose={() => setDeactivateStaff(null)}
          staff={deactivateStaff}
          onDone={() => {
            refreshAll();
            setDeactivateStaff(null);
          }}
        />
      </div>
    </DashboardLayout>
  );
}