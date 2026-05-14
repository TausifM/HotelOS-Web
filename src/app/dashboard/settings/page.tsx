'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, Button, Input, Select, Badge } from '@/components/ui';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Settings,
  CreditCard,
  Zap,
  Bell,
  Shield,
  Printer,
  Globe,
  Clock,
  Building2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Link2,
  Save,
  Hotel,
  Palette,
  MapPin,
  MessageCircle,
  Mail,
  Wallet,
  Cloud,
  QrCode,
  ChevronRight,
} from 'lucide-react';

const TABS = [
  { id: 'hotel', label: 'Hotel Profile', icon: Settings },
  { id: 'policies', label: 'Policies', icon: Shield },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'integrations', label: 'Integrations', icon: Zap },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'features', label: 'Features', icon: Globe },
] as const;

const INDIA_STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

const FEATURE_LIST = [
  { key: 'restaurant', label: 'Restaurant / Room Service', desc: 'POS, orders, KOT', icon: '🍽️' },
  { key: 'spa', label: 'Spa & Wellness', desc: 'Spa bookings and charges', icon: '💆' },
  { key: 'loyalty', label: 'Guest Loyalty Program', desc: 'Points, tiers, redemption', icon: '⭐' },
  { key: 'whatsapp', label: 'WhatsApp Notifications', desc: 'Guest messaging', icon: '📱' },
  { key: 'aiRevenue', label: 'AI Revenue Intelligence', desc: 'Rate recommendations', icon: '🤖' },
  { key: 'onlineBooking', label: 'Online Booking Engine', desc: 'Direct booking page', icon: '🌐' },
  { key: 'channelManager', label: 'Channel Manager', desc: 'OTA sync (coming soon)', icon: '🔗' },
  { key: 'guestApp', label: 'Guest Mobile App', desc: 'Self check-in, requests', icon: '📲' },
] as const;

const NOTIFICATION_ITEMS = [
  {
    key: 'booking_confirmation',
    label: 'Booking Confirmation',
    desc: 'Sent when reservation is created',
    default: true,
  },
  {
    key: 'pre_arrival_24h',
    label: 'Pre-arrival (24h)',
    desc: 'Reminder sent 24 hours before check-in',
    default: true,
  },
  {
    key: 'pre_arrival_2h',
    label: 'Pre-arrival (2h)',
    desc: 'Reminder sent 2 hours before check-in',
    default: false,
  },
  {
    key: 'checkin_welcome',
    label: 'Check-in Welcome',
    desc: 'Welcome message after check-in',
    default: true,
  },
  {
    key: 'checkout_reminder',
    label: 'Checkout Reminder',
    desc: 'Reminder on morning of checkout',
    default: true,
  },
  {
    key: 'checkout_thankyou',
    label: 'Post-checkout Thank You',
    desc: 'Thank you + loyalty points after checkout',
    default: true,
  },
  {
    key: 'feedback_request',
    label: 'Feedback Request',
    desc: 'Asks for review 2 hours after checkout',
    default: false,
  },
  {
    key: 'payment_receipt',
    label: 'Payment Receipt',
    desc: 'Sent when payment is recorded',
    default: true,
  },
] as const;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  gradient,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  gradient: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden rounded-[30px] border border-white/70 bg-white/85 shadow-[0_18px_60px_-24px_rgba(255,102,140,0.35)] backdrop-blur">
      <div className={cn('bg-gradient-to-r px-5 py-4 text-white md:px-6', gradient)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white/15 p-2.5 backdrop-blur">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">{title}</h3>
              {subtitle ? <p className="mt-1 text-sm text-white/85">{subtitle}</p> : null}
            </div>
          </div>
          {right}
        </div>
      </div>
      <CardContent className="space-y-4 bg-gradient-to-b from-orange-50/60 via-white to-pink-50/50 p-5 md:p-6">
        {children}
      </CardContent>
    </Card>
  );
}

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ElementType;
  gradient: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_-24px_rgba(255,120,92,0.28)] backdrop-blur">
      <div className={cn('absolute inset-0 opacity-15 bg-gradient-to-br', gradient)} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</p>
          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
        <div className={cn('rounded-2xl bg-gradient-to-br p-3 text-white shadow-lg', gradient)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition',
        checked ? 'bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-500' : 'bg-slate-200',
        disabled && 'cursor-not-allowed opacity-60'
      )}
      aria-pressed={checked}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
          checked ? 'translate-x-5' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}

function IntegrationStatusPill({
  ready,
  phone = '919975767561',
  text = 'Hi, I want help with WhatsApp integration setup.',
}: {
  ready: boolean;
  phone?: string;
  text?: string;
}) {
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold transition hover:scale-[1.02] cursor-pointer',
        ready
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-amber-200 bg-amber-50 text-amber-700'
      )}
    >
      {ready ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <AlertCircle className="h-3.5 w-3.5" />
      )}
      {ready ? 'Configured' : 'Needs setup'}
    </a>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('hotel');
  const { hasRole } = useAuth();
  const qc = useQueryClient();

  const [intForm, setIntForm] = useState<any>({
    whatsappPhoneNumberId: '',
    whatsappToken: '',
    razorpayKeyId: '',
    upiId: '',
    cloudinaryCloudName: '',
    cloudinaryApiKey: '',
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
  });

  const [notifForm, setNotifForm] = useState<Record<string, boolean>>({});

  const canEditHotel = hasRole('owner', 'manager');
  const canEditIntegrations = hasRole('owner');

  const { data: t, isLoading } = useQuery({
    queryKey: ['tenant-me'],
    queryFn: () => api.get('/api/tenants/me').then((r) => r.data.data),
  });

  const { data: sub } = useQuery({
    queryKey: ['sub-status'],
    queryFn: () => api.get('/api/subscriptions/status').then((r) => r.data.data),
  });

  useEffect(() => {
    if (!t) return;

    setIntForm({
      whatsappPhoneNumberId: t.integrations?.whatsappPhoneNumberId || t.whatsappPhoneNumberId || '',
      whatsappToken: t.integrations?.whatsappToken || t.whatsappToken || '',
      razorpayKeyId: t.integrations?.razorpayKeyId || t.razorpayKeyId || '',
      upiId: t.integrations?.upiId || t.upiId || '',
      cloudinaryCloudName: t.integrations?.cloudinaryCloudName || t.cloudinaryCloudName || '',
      cloudinaryApiKey: t.integrations?.cloudinaryApiKey || t.cloudinaryApiKey || '',
      smtpHost: t.integrations?.smtpHost || t.smtpHost || '',
      smtpPort: t.integrations?.smtpPort || t.smtpPort || '',
      smtpUser: t.integrations?.smtpUser || t.smtpUser || '',
      smtpPass: t.integrations?.smtpPass || t.smtpPass || '',
    });

    const existingNotif = t.notificationSettings || t.notifications || {};
    const nextNotif: Record<string, boolean> = {};
    NOTIFICATION_ITEMS.forEach((item) => {
      nextNotif[item.key] =
        typeof existingNotif?.[item.key] === 'boolean' ? existingNotif[item.key] : item.default;
    });
    setNotifForm(nextNotif);
  }, [t]);

  const updateHotel = useMutation({
    mutationFn: (d: any) => api.put('/api/tenants/me', d),
    onSuccess: () => {
      toast.success('Saved!');
      qc.invalidateQueries({ queryKey: ['tenant-me'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateFeatures = useMutation({
    mutationFn: (patch: any) =>
      api.put('/api/tenants/me', {
        features: {
          ...(t?.features || {}),
          ...patch,
        },
      }),
    onSuccess: () => {
      toast.success('Features updated!');
      qc.invalidateQueries({ queryKey: ['tenant-me'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateInt = useMutation({
    mutationFn: (d: any) => api.put('/api/tenants/me/integrations', d),
    onSuccess: () => {
      toast.success('Integrations saved!');
      qc.invalidateQueries({ queryKey: ['tenant-me'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateNotifications = useMutation({
    mutationFn: (d: any) => api.put('/api/tenants/me', { notificationSettings: d }),
    onSuccess: () => {
      toast.success('Notification settings saved!');
      qc.invalidateQueries({ queryKey: ['tenant-me'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const createSub = useMutation({
    mutationFn: () => api.post('/api/subscriptions/create'),
    onSuccess: (d) => {
      const url = d.data?.data?.shortUrl;
      if (url) window.open(url, '_blank');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const featureCount = useMemo(
    () => Object.values(t?.features || {}).filter(Boolean).length,
    [t?.features]
  );

  const integrationStatus = useMemo(() => {
    const status = {
      whatsapp: Boolean(intForm.whatsappPhoneNumberId && intForm.whatsappToken),
      razorpay: Boolean(intForm.razorpayKeyId),
      upi: Boolean(intForm.upiId),
      cloudinary: Boolean(intForm.cloudinaryCloudName && intForm.cloudinaryApiKey),
      smtp: Boolean(intForm.smtpHost && intForm.smtpPort && intForm.smtpUser && intForm.smtpPass),
    };

    return {
      map: status,
      readyCount: Object.values(status).filter(Boolean).length,
      total: Object.keys(status).length,
    };
  }, [intForm]);

  const integrationsList = [
    {
      key: 'whatsapp',
      title: 'WhatsApp (Meta Cloud API)',
      desc: 'Booking confirmations, check-in reminders, and guest chat automation.',
      icon: MessageCircle,
      gradient: 'from-emerald-500 via-green-500 to-lime-400',
      ready: integrationStatus.map.whatsapp,
    },
    {
      key: 'razorpay',
      title: 'Razorpay',
      desc: 'Payment links, card/UPI collection, and online booking payments.',
      icon: Wallet,
      gradient: 'from-violet-500 via-fuchsia-500 to-pink-500',
      ready: integrationStatus.map.razorpay,
    },
    {
      key: 'upi',
      title: 'UPI Direct',
      desc: 'Direct QR collections at checkout through your hotel UPI ID.',
      icon: QrCode,
      gradient: 'from-orange-500 via-amber-500 to-yellow-400',
      ready: integrationStatus.map.upi,
    },
    {
      key: 'cloudinary',
      title: 'Cloudinary',
      desc: 'Guest KYC image storage and hosted media delivery.',
      icon: Cloud,
      gradient: 'from-sky-500 via-cyan-500 to-blue-500',
      ready: integrationStatus.map.cloudinary,
    },
    {
      key: 'smtp',
      title: 'SMTP Email',
      desc: 'Invoice mailers, booking mail, and system notifications.',
      icon: Mail,
      gradient: 'from-rose-500 via-pink-500 to-orange-500',
      ready: integrationStatus.map.smtp,
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout title="Settings">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,145,77,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,88,162,0.15),transparent_32%),linear-gradient(180deg,#fff8f3_0%,#fffdfb_48%,#fff7fb_100%)] px-4 py-6 md:px-6">
          <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center">
            <div className="rounded-[32px] border border-white/70 bg-white/80 px-10 py-12 shadow-[0_25px_100px_-40px_rgba(255,98,138,0.45)] backdrop-blur">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
              <p className="mt-4 text-sm font-medium text-slate-500">Loading premium settings workspace...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,145,77,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,88,162,0.14),transparent_30%),linear-gradient(180deg,#fff8f3_0%,#fffdfb_45%,#fff7fb_100%)] px-4 py-6 md:px-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="overflow-hidden rounded-[34px] border border-orange-200/70 bg-gradient-to-r from-orange-400 via-pink-500 to-fuchsia-500 p-[1px] shadow-[0_30px_120px_-30px_rgba(255,115,85,0.45)]">
            <div className="relative rounded-[33px] bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-500 px-6 py-7 text-white md:px-8 md:py-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.10),transparent_28%)]" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white/95 backdrop-blur-sm">
                  <Settings className="h-3.5 w-3.5" />
                  Orange Pink Control Center
                </div>

                <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                  <div className="max-w-3xl">
                    <h1 className="text-3xl font-black tracking-tight md:text-4xl">Hotel Settings</h1>
                    <p className="mt-3 text-sm leading-6 text-white/88 md:text-base">
                      Tune branding, policies, billing, integrations, guest messaging, and feature
                      access from one premium settings workspace.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:min-w-[320px]">
                    <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">Plan</p>
                      <p className="mt-1 text-sm font-black">{sub?.subscription?.status || '—'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">Integrations</p>
                      <p className="mt-1 text-sm font-black">
                        {integrationStatus.readyCount}/{integrationStatus.total} ready
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Hotel category"
              value={t?.category || 'Not set'}
              hint={t?.starRating ? `${t.starRating} star property` : 'Configure classification'}
              icon={Hotel}
              gradient="from-orange-500 via-amber-500 to-pink-500"
            />
            <StatTile
              label="Total rooms"
              value={t?.totalRooms || 0}
              hint={t?.hotelName || 'Hotel profile'}
              icon={Building2}
              gradient="from-pink-500 via-rose-500 to-fuchsia-500"
            />
            <StatTile
              label="Active modules"
              value={featureCount}
              hint="Enabled features"
              icon={Sparkles}
              gradient="from-fuchsia-500 via-pink-500 to-orange-500"
            />
            <StatTile
              label="Subscription"
              value={
                sub?.subscription?.status === 'active'
                  ? formatCurrency(sub?.subscription?.monthlyAmountINR || 2000)
                  : sub?.isTrialActive
                  ? `${sub?.trialDaysLeft || 0} days left`
                  : 'Pending'
              }
              hint={sub?.subscription?.currentPeriodEnd ? `Renews ${formatDate(sub.subscription.currentPeriodEnd)}` : 'Billing status'}
              icon={CreditCard}
              gradient="from-violet-500 via-pink-500 to-orange-500"
            />
          </div>

          <div className="rounded-[30px] border border-white/70 bg-white/75 p-3 shadow-[0_20px_70px_-35px_rgba(255,102,140,0.45)] backdrop-blur">
            <div className="flex flex-wrap gap-2">
              {TABS.map((item) => {
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition',
                      active
                        ? 'bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-500 text-white shadow-lg shadow-pink-200/70'
                        : 'border border-slate-200 bg-white text-slate-600 hover:border-pink-200 hover:bg-pink-50'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {tab === 'hotel' && t && (
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target as HTMLFormElement);
                updateHotel.mutate(Object.fromEntries(fd));
              }}
            >
              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <SectionCard
                  title="Basic Information"
                  subtitle="Identity, contact details, category, and room inventory."
                  icon={Hotel}
                  gradient="from-orange-500 via-pink-500 to-fuchsia-500"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input label="Hotel Name" name="hotelName" defaultValue={t.hotelName} required />
                    <Input label="Legal Name" name="legalName" defaultValue={t.legalName} />
                    <Input label="GSTIN" name="gstin" defaultValue={t.gstin} />
                    <Input label="PAN" name="pan" defaultValue={t.pan} />
                    <Input label="Phone" name="phone" defaultValue={t.phone} required />
                    <Input label="Email" defaultValue={t.email} disabled />
                    <Input label="Website" name="website" defaultValue={t.website} />
                    <Select label="Category" name="category" defaultValue={t.category}>
                      {['budget', 'standard', 'deluxe', 'luxury', 'boutique', 'resort', 'hostel'].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                    <Select label="Star Rating" name="starRating" defaultValue={t.starRating}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n} Star{n > 1 ? 's' : ''}
                        </option>
                      ))}
                    </Select>
                    <Input label="Total Rooms" name="totalRooms" type="number" defaultValue={t.totalRooms} />
                  </div>
                </SectionCard>

                <div className="space-y-6">
                  <SectionCard
                    title="Address"
                    subtitle="Used across invoices, profile pages, and guest communication."
                    icon={MapPin}
                    gradient="from-pink-500 via-rose-500 to-orange-500"
                  >
                    <Input label="Address Line 1" name="address.line1" defaultValue={t.address?.line1} />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <Input label="City" name="address.city" defaultValue={t.address?.city} />
                      <Select label="State" name="address.state" defaultValue={t.address?.state}>
                        {INDIA_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
                      <Input label="Pincode" name="address.pincode" defaultValue={t.address?.pincode} />
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="Branding"
                    subtitle="Primary brand color and logo link used in printed and digital guest touchpoints."
                    icon={Palette}
                    gradient="from-fuchsia-500 via-pink-500 to-orange-500"
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-[24px] border border-orange-100 bg-white/80 p-4">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Brand Color</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="color"
                            name="brandColor"
                            defaultValue={t.brandColor || '#F97316'}
                            className="h-12 w-20 cursor-pointer rounded-xl border border-orange-200 bg-white"
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-800">Primary UI / invoice accent</p>
                            <p className="text-xs text-slate-500">Pick a strong color for receipts, bills, and brand accents.</p>
                          </div>
                        </div>
                      </div>
                      <Input label="Logo URL" name="logo" defaultValue={t.logo} placeholder="https://..." />
                    </div>
                  </SectionCard>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={updateHotel.isPending}
                  disabled={!canEditHotel}
                  className="rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-500 px-6 py-3 text-white shadow-lg shadow-pink-200/70"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Hotel Profile
                </Button>
              </div>
            </form>
          )}

          {tab === 'policies' && t && (
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target as HTMLFormElement);
                updateHotel.mutate(Object.fromEntries(fd));
              }}
            >
              <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                <SectionCard
                  title="Check-in / Check-out"
                  subtitle="Standard timings and optional early/late charge settings."
                  icon={Clock}
                  gradient="from-orange-500 via-amber-500 to-pink-500"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                      label="Standard Check-in Time"
                      type="time"
                      name="checkInTime"
                      defaultValue={t.checkInTime || '14:00'}
                    />
                    <Input
                      label="Standard Check-out Time"
                      type="time"
                      name="checkOutTime"
                      defaultValue={t.checkOutTime || '11:00'}
                    />
                    <Input
                      label="Early Check-in Charge (₹)"
                      name="earlyCheckinCharge"
                      type="number"
                      defaultValue="500"
                      placeholder="₹500"
                    />
                    <Input
                      label="Late Check-out Charge (₹)"
                      name="lateCheckoutCharge"
                      type="number"
                      defaultValue="500"
                      placeholder="₹500"
                    />
                  </div>
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                    These timings appear on booking confirmations, self check-in screens, and guest communication flows.
                  </div>
                </SectionCard>

                <SectionCard
                  title="Cancellation Policy"
                  subtitle="Control refund windows and charge rules."
                  icon={Shield}
                  gradient="from-pink-500 via-fuchsia-500 to-orange-500"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Select label="Free Cancellation Window" name="cancellationHours" defaultValue="24">
                      <option value="0">No free cancellation</option>
                      <option value="6">6 hours before check-in</option>
                      <option value="12">12 hours before check-in</option>
                      <option value="24">24 hours before check-in</option>
                      <option value="48">48 hours before check-in</option>
                      <option value="72">72 hours before check-in</option>
                    </Select>
                    <Select label="Cancellation Charge" name="cancellationCharge" defaultValue="one_night">
                      <option value="none">No charge</option>
                      <option value="one_night">1 night charge</option>
                      <option value="two_nights">2 nights charge</option>
                      <option value="full">Full booking amount</option>
                      <option value="percent_50">50% of booking</option>
                    </Select>
                  </div>
                </SectionCard>
              </div>

              <SectionCard
                title="Invoice & GST Settings"
                subtitle="Configure invoice appearance and billing defaults."
                icon={Printer}
                gradient="from-amber-500 via-orange-500 to-pink-500"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Input label="GSTIN" name="gstin" defaultValue={t.gstin} placeholder="27AABCG1234F1ZX" />
                  <Select label="GST Registration Type" name="gstType" defaultValue="regular">
                    <option value="regular">Regular</option>
                    <option value="composition">Composition</option>
                    <option value="unregistered">Unregistered</option>
                  </Select>
                  <Input
                    label="Invoice Prefix"
                    name="invoicePrefix"
                    defaultValue={t.slug?.slice(0, 3).toUpperCase()}
                    placeholder="GRD"
                  />
                  <Select label="Invoice Format" name="invoiceFormat" defaultValue="gst">
                    <option value="gst">GST Tax Invoice</option>
                    <option value="simple">Simple Invoice</option>
                    <option value="proforma">Pro-forma Invoice</option>
                  </Select>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  GST slab can be shown contextually on bills while invoice styling stays aligned with your brand color.
                </div>
              </SectionCard>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={updateHotel.isPending}
                  disabled={!canEditHotel}
                  className="rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-500 px-6 py-3 text-white shadow-lg shadow-pink-200/70"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Policies
                </Button>
              </div>
            </form>
          )}

          {tab === 'subscription' && (
            <div className="space-y-6">
              <SectionCard
                title="Current Plan"
                subtitle="Billing status, trial details, next renewal, and payment history."
                icon={CreditCard}
                gradient="from-violet-500 via-pink-500 to-orange-500"
                right={
                  <Badge
                    variant={
                      sub?.subscription?.status === 'active'
                        ? 'success'
                        : sub?.subscription?.status === 'trial'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {sub?.subscription?.status || '...'}
                  </Badge>
                }
              >
                <div className="rounded-[28px] border border-brand-200 bg-gradient-to-br from-orange-50 via-white to-pink-50 p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-bold text-orange-700">HotelOS Pro</p>
                      <p className="mt-2 text-4xl font-black tracking-tight text-slate-900">
                        ₹2,000<span className="text-base font-medium text-slate-500">/month</span>
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Per hotel · All features · Unlimited staff
                      </p>
                    </div>

                    <div className="rounded-3xl bg-gradient-to-br from-orange-500 via-pink-500 to-fuchsia-500 p-4 text-white shadow-lg shadow-pink-200/70">
                      <Zap className="h-7 w-7" />
                    </div>
                  </div>

                  {sub?.isTrialActive && (
                    <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-bold text-amber-800">
                        Free trial · {sub.trialDaysLeft} days remaining
                      </p>
                      <p className="mt-1 text-xs text-amber-700">
                        Expires {sub.subscription?.trialEndsAt ? formatDate(sub.subscription.trialEndsAt) : '—'}
                      </p>
                    </div>
                  )}

                  {['trial', 'past_due'].includes(sub?.subscription?.status) && (
                    <Button
                      type="button"
                      className="mt-5 w-full rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-500 py-3 text-white shadow-lg shadow-pink-200/70"
                      onClick={() => createSub.mutate()}
                      loading={createSub.isPending}
                    >
                      Subscribe Now — ₹2,000/month
                    </Button>
                  )}

                  {sub?.subscription?.status === 'active' && (
                    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Next Billing</p>
                        <p className="mt-2 text-base font-black text-slate-900">
                          {sub.subscription?.currentPeriodEnd ? formatDate(sub.subscription.currentPeriodEnd) : '—'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Amount</p>
                        <p className="mt-2 text-base font-black text-slate-900">
                          {formatCurrency(sub.subscription?.monthlyAmountINR || 2000)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                  <div className="rounded-[28px] border border-orange-100 bg-white/80 p-5">
                    <p className="mb-3 text-sm font-black text-slate-800">What’s included</p>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {[
                        'Unlimited reservations',
                        'AI Revenue Intelligence',
                        'WhatsApp notifications',
                        'Aadhaar / Passport OCR',
                        'Guest loyalty program',
                        'GST invoice generation',
                        'Night audit',
                        'Housekeeping board',
                        'Maintenance tracking',
                        'Staff management',
                        'Real-time reports',
                        'Self check-in QR',
                      ].map((f) => (
                        <div key={f} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-pink-100 bg-white/80 p-5">
                    <p className="mb-3 text-sm font-black text-slate-800">Payment History</p>
                    {sub?.events?.filter((e: any) => e.event === 'payment_success').length > 0 ? (
                      <div className="space-y-3">
                        {sub.events
                          .filter((e: any) => e.event === 'payment_success')
                          .slice(0, 6)
                          .map((e: any) => (
                            <div
                              key={e._id}
                              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm"
                            >
                              <span className="text-slate-500">{formatDate(e.createdAt)}</span>
                              <span className="font-bold text-slate-900">{formatCurrency(e.amount)}</span>
                              <Badge variant="success">Paid</Badge>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                        No successful payments recorded yet.
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {tab === 'integrations' && (
            <div className="space-y-6">
              <SectionCard
                title="Integration Overview"
                subtitle="Quick readiness snapshot for guest communication, payment, and infra services."
                icon={Link2}
                gradient="from-orange-500 via-pink-500 to-fuchsia-500"
                right={<IntegrationStatusPill ready={integrationStatus.readyCount === integrationStatus.total} />}
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  {integrationsList.map((item) => (
                    <div
                      key={item.key}
                      className="rounded-[26px] border border-white/70 bg-white/90 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={cn('rounded-2xl bg-gradient-to-br p-3 text-white shadow-md', item.gradient)}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        <IntegrationStatusPill ready={item.ready} />
                      </div>
                      <p className="mt-4 text-sm font-black text-slate-900">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                <SectionCard
                  title="WhatsApp (Meta Cloud API)"
                  subtitle="Used for confirmations, pre-arrival reminders, and automated guest chat."
                  icon={MessageCircle}
                  gradient="from-emerald-500 via-green-500 to-lime-400"
                  right={<IntegrationStatusPill ready={integrationStatus.map.whatsapp} />}
                >
                  <Input
                    label="Phone Number ID"
                    placeholder="From Meta Developer Console"
                    value={intForm.whatsappPhoneNumberId || ''}
                    onChange={(e) => setIntForm((f: any) => ({ ...f, whatsappPhoneNumberId: e.target.value }))}
                  />
                  <Input
                    label="Permanent Access Token"
                    type="password"
                    placeholder="EAAxxxxxxxx"
                    value={intForm.whatsappToken || ''}
                    onChange={(e) => setIntForm((f: any) => ({ ...f, whatsappToken: e.target.value }))}
                  />
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                    Recommended for booking confirmations, check-in/out messaging, and AI guest support.
                  </div>
                </SectionCard>

                <SectionCard
                  title="Razorpay"
                  subtitle="Collect guest payments with hosted payment links and checkout flows."
                  icon={Wallet}
                  gradient="from-violet-500 via-fuchsia-500 to-pink-500"
                  right={<IntegrationStatusPill ready={integrationStatus.map.razorpay} />}
                >
                  <Input
                    label="Razorpay Key ID"
                    placeholder="rzp_live_..."
                    value={intForm.razorpayKeyId || ''}
                    onChange={(e) => setIntForm((f: any) => ({ ...f, razorpayKeyId: e.target.value }))}
                  />
                  <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-700">
                    Use this for booking advances, payment links, and checkout collections.
                  </div>
                </SectionCard>

                <SectionCard
                  title="UPI Direct"
                  subtitle="Generate direct QR collections from your own UPI ID."
                  icon={QrCode}
                  gradient="from-orange-500 via-amber-500 to-yellow-400"
                  right={<IntegrationStatusPill ready={integrationStatus.map.upi} />}
                >
                  <Input
                    label="Hotel UPI ID"
                    placeholder="hotelname@upi"
                    value={intForm.upiId || ''}
                    onChange={(e) => setIntForm((f: any) => ({ ...f, upiId: e.target.value }))}
                  />
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    Guests can scan and pay with GPay, PhonePe, Paytm, and BHIM.
                  </div>
                </SectionCard>

                <SectionCard
                  title="Cloudinary"
                  subtitle="Store guest ID images and other hosted media securely."
                  icon={Cloud}
                  gradient="from-sky-500 via-cyan-500 to-blue-500"
                  right={<IntegrationStatusPill ready={integrationStatus.map.cloudinary} />}
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                      label="Cloud Name"
                      placeholder="your-cloud-name"
                      value={intForm.cloudinaryCloudName || ''}
                      onChange={(e) => setIntForm((f: any) => ({ ...f, cloudinaryCloudName: e.target.value }))}
                    />
                    <Input
                      label="API Key"
                      placeholder="123456789"
                      value={intForm.cloudinaryApiKey || ''}
                      onChange={(e) => setIntForm((f: any) => ({ ...f, cloudinaryApiKey: e.target.value }))}
                    />
                  </div>
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                    Helpful for KYC uploads and archived guest documents.
                  </div>
                </SectionCard>
              </div>

              <SectionCard
                title="SMTP Email"
                subtitle="Transactional mail for invoices, confirmations, and internal notices."
                icon={Mail}
                gradient="from-rose-500 via-pink-500 to-orange-500"
                right={<IntegrationStatusPill ready={integrationStatus.map.smtp} />}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Input
                    label="SMTP Host"
                    placeholder="smtp.gmail.com"
                    value={intForm.smtpHost || ''}
                    onChange={(e) => setIntForm((f: any) => ({ ...f, smtpHost: e.target.value }))}
                  />
                  <Input
                    label="SMTP Port"
                    placeholder="587"
                    value={intForm.smtpPort || ''}
                    onChange={(e) => setIntForm((f: any) => ({ ...f, smtpPort: e.target.value }))}
                  />
                  <Input
                    label="Email Username"
                    placeholder="hotel@gmail.com"
                    value={intForm.smtpUser || ''}
                    onChange={(e) => setIntForm((f: any) => ({ ...f, smtpUser: e.target.value }))}
                  />
                  <Input
                    label="App Password"
                    type="password"
                    value={intForm.smtpPass || ''}
                    onChange={(e) => setIntForm((f: any) => ({ ...f, smtpPass: e.target.value }))}
                  />
                </div>
              </SectionCard>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => updateInt.mutate(intForm)}
                  loading={updateInt.isPending}
                  disabled={!canEditIntegrations}
                  className="rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-500 px-6 py-3 text-white shadow-lg shadow-pink-200/70"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save All Integrations
                </Button>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="space-y-6">
              <SectionCard
                title="Guest Notification Settings"
                subtitle="Choose which messages are sent automatically through guest communication workflows."
                icon={Bell}
                gradient="from-pink-500 via-fuchsia-500 to-orange-500"
              >
                <div className="grid gap-3">
                  {NOTIFICATION_ITEMS.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-4 rounded-[24px] border border-slate-100 bg-white/90 px-4 py-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900">{item.label}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{item.desc}</p>
                      </div>
                      <Toggle
                        checked={!!notifForm[item.key]}
                        onChange={(checked) => setNotifForm((prev) => ({ ...prev, [item.key]: checked }))}
                      />
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                  Save these preferences once your WhatsApp or email channels are connected.
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => updateNotifications.mutate(notifForm)}
                    loading={updateNotifications.isPending}
                    disabled={!canEditHotel}
                    className="rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-500 px-6 py-3 text-white shadow-lg shadow-pink-200/70"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Notification Settings
                  </Button>
                </div>
              </SectionCard>
            </div>
          )}

          {tab === 'features' && t && (
            <div className="space-y-6">
              <SectionCard
                title="Feature Toggles"
                subtitle="Enable or disable hotel modules. Disabled modules can be hidden from navigation."
                icon={Globe}
                gradient="from-orange-500 via-pink-500 to-fuchsia-500"
                right={
                  <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    {featureCount} enabled
                  </span>
                }
              >
                <div className="grid gap-3">
                  {FEATURE_LIST.map((feat) => {
                    const enabled = !!t.features?.[feat.key];
                    return (
                      <div
                        key={feat.key}
                        className={cn(
                          'flex items-center justify-between gap-4 rounded-[26px] border px-4 py-4 transition',
                          enabled
                            ? 'border-pink-200 bg-gradient-to-r from-orange-50 via-white to-pink-50'
                            : 'border-slate-100 bg-white/90'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-100 bg-white text-2xl shadow-sm">
                            {feat.icon}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{feat.label}</p>
                            <p className="mt-1 text-xs text-slate-500">{feat.desc}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {enabled ? (
                            <span className="hidden items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 md:inline-flex">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Enabled
                            </span>
                          ) : (
                            <span className="hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500 md:inline-flex">
                              Off
                            </span>
                          )}

                          <Toggle
                            checked={enabled}
                            disabled={updateFeatures.isPending || !canEditHotel}
                            onChange={(checked) => updateFeatures.mutate({ [feat.key]: checked })}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}