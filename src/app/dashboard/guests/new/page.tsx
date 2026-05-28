'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Spinner } from '@/components/ui';
import api from '@/lib/api';
import {
  ShieldCheck,
  Upload,
  User,
  Phone,
  CheckCircle,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  MapPin,
  Mail,
  Calendar,
  CreditCard,
  Loader2,
  Star,
  PartyPopper,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/components/components/WhatsAppButton';

interface AddressForm {
  line1: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface GuestForm {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  nationality: string;
  dob: string;
  idType: string;
  idNumber: string;
  address: AddressForm;
  idVerified: boolean;
  whatsappOptIn: boolean;
  idExtractedData: any;
}

function openWhatsApp(phone: string, message: string) {
  const cleaned = phone.replace(/\D/g, '');
  const number = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
}

const EMPTY_FORM: GuestForm = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  nationality: 'Indian',
  dob: '',
  idType: 'aadhaar',
  idNumber: '',
  address: { line1: '', city: '', state: '', pincode: '', country: 'India' },
  idVerified: true,
  whatsappOptIn: true,
  idExtractedData: null,
};

const ID_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving_licence', label: 'Driving Licence' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'foreign_passport', label: 'Foreign Passport' },
  { value: 'other', label: 'Other' },
];

function Field({
  label,
  required,
  highlighted,
  children,
}: {
  label: string;
  required?: boolean;
  highlighted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* ✅ Fix 1: was "abel" — restored opening < */}
      <label className="flex items-center gap-1 text-xs font-semibold text-gray-500">
        {label}
        {required && <span className="text-red-400">*</span>}
        {highlighted && (
          <span
            className="ml-1 rounded-full px-1.5 py-0.5 text-xs font-bold"
            style={{ background: '#dcfce7', color: '#16a34a' }}
          >
            Auto-filled
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

const inputBase =
  'w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all';
const inputNormal = `${inputBase} border-gray-200 bg-white text-gray-900 placeholder:text-gray-400`;
const inputHighlight = `${inputBase} border-green-300 bg-green-50 text-gray-900`;

export default function NewGuestPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { tenant } = useAuth();
  console.log(tenant, "tenant")

  const hotelName = tenant?.hotelName || 'Your Hotel';
  'Your Hotel';
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);
  const [form, setForm] = useState<GuestForm>(EMPTY_FORM);
  const [createdGuest, setCreatedGuest] = useState<any>(null);

  const f =
    (k: keyof GuestForm) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((p) => ({ ...p, [k]: e.target.value }));

  const fAddr =
    (k: keyof AddressForm) =>
      (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((p) => ({ ...p, address: { ...p.address, [k]: e.target.value } }));

  async function handleIdUpload(file: File) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => setIdPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    const b64reader = new FileReader();
    b64reader.onload = async () => {
      setOcrLoading(true);
      try {
        const formData = new FormData();
        formData.append('image', file);

        const { data } = await api.post('/api/ai/ocr/id-card', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const extracted = data.data;

        let firstName = '';
        let lastName = '';
        if (extracted.name) {
          const parts = extracted.name.trim().split(/\s+/);
          firstName = parts[0] || '';
          lastName = parts.slice(1).join(' ') || '';
        }

        let dob = '';
        if (extracted.dob) {
          const parts = extracted.dob.split(/[\/\-]/);
          if (parts.length === 3) {
            dob =
              parts[2].length === 4
                ? `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
                : extracted.dob;
          }
        }

        setForm((p) => ({
          ...p,
          firstName: firstName || p.firstName,
          lastName: lastName || p.lastName,
          idType: extracted.idType || p.idType,
          idNumber: extracted.idNumber || p.idNumber,
          nationality: extracted.nationality || p.nationality,
          dob: dob || p.dob,
          idVerified: true,
          address: {
            ...p.address,
            line1: extracted.address?.split(',')[0]?.trim() || p.address.line1,
            city: extracted.address?.split(',')[1]?.trim() || p.address.city,
            state: extracted.address?.split(',')[2]?.trim() || p.address.state,
            pincode: extracted.pincode || p.address.pincode,
          },
          idExtractedData: extracted,
        }));

        setOcrDone(true);
        toast.success('ID scanned successfully! Please verify the details.');
        setStep(2);
      } catch {
        toast.error('OCR failed — please fill details manually');
        setStep(2);
      } finally {
        setOcrLoading(false);
      }
    };

    b64reader.readAsDataURL(file);
  }

  const createGuest = useMutation({
    mutationFn: (payload: any) => api.post('/api/guests', payload),
    onSuccess: (res) => {
      const guest = res.data.data;
      setCreatedGuest(guest);
      setStep(3);

      if (form.phone && form.whatsappOptIn) {
        const message =
          `🌟 *Welcome to ${hotelName}!*` +
          `\n\nHello ${form.firstName}!` +
          `\n\nYou've been registered as a guest with us.` +
          `\n\n🪪 *Membership ID:* ${guest.loyalty?.membershipId || 'Assigned'}` +
          `\n🏆 *Loyalty Tier:* Bronze` +
          `\n\nYou'll earn points on every stay, redeemable for discounts.` +
          `\n\nWe look forward to hosting you! 🏨` +
          `\n\n_Reply to this message anytime for assistance._`;

        openWhatsApp(form.phone, message);
        toast.success('Guest registered! WhatsApp welcome opened.');
      } else {
        toast.success('Guest registered successfully!');
      }
    },
    onError: (e: any) => {
      if (e.response?.status === 409 || e.response?.data?.message?.includes('exists')) {
        toast('Guest already registered — loading profile', { icon: 'ℹ️' });
        router.push('/dashboard/guests');
      } else {
        toast.error(e.response?.data?.message || 'Failed to create guest');
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.phone) {
      toast.error('Name and phone are required');
      return;
    }
    createGuest.mutate({
      ...form,
      whatsappNumber: form.phone,
      idVerified: form.idVerified,
      idExtractedData: form.idExtractedData,
    });
  }

  const Steps = () => (
    <div className="flex items-center gap-2">
      {[
        { n: 1, label: 'Scan ID' },
        { n: 2, label: 'Details' },
        { n: 3, label: 'Done' },
      ].map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all"
              style={
                step > s.n
                  ? { background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff' }
                  : step === s.n
                    ? { background: 'linear-gradient(135deg,#F97316,#F43F5E)', color: '#fff' }
                    : { background: '#f1f5f9', color: '#94a3b8' }
              }
            >
              {step > s.n ? <CheckCircle className="h-3.5 w-3.5" /> : s.n}
            </div>
            <span
              className="hidden text-xs font-semibold sm:inline"
              style={{ color: step === s.n ? 'black' : step > s.n ? '#059669' : '#94a3b8' }}
            >
              {s.label}
            </span>
          </div>
          {i < 2 && (
            <div
              className="h-px w-6 sm:w-10"
              style={{ background: step > s.n ? '#10b981' : '#e2e8f0' }}
            />
          )}
        </div>
      ))}
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // STEP 1 — Scan ID
  // ══════════════════════════════════════════════════════════════
  if (step === 1) {
    return (
      <DashboardLayout title="Register Guest">
        <div className="max-w-2xl space-y-6 pb-10">

          {/* Header */}
          <div
            className="relative overflow-hidden rounded-2xl px-5 py-6 text-white sm:rounded-3xl sm:px-8 sm:py-7"
            style={{ background: 'linear-gradient(135deg,#F97316 0%,#F43F5E 100%)' }}
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-20"
              style={{ background: 'rgba(255,255,255,0.3)' }} />
            <div className="pointer-events-none absolute -bottom-4 left-16 h-20 w-20 rounded-full opacity-10"
              style={{ background: 'rgba(255,255,255,0.5)' }} />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                    Guest Registration
                  </span>
                </div>
                <h1 className="text-2xl font-bold leading-tight sm:text-3xl">Register New Guest</h1>
                <p className="mt-1 text-sm opacity-80">Scan ID card for instant AI-powered extraction</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                <Steps />
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all"
                  style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
              </div>
            </div>
          </div>

          {/* Upload Card */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-50 px-5 py-4"
              style={{ background: '#fafafa' }}>
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}>
                <ShieldCheck className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Scan Guest ID Card</p>
                <p className="text-xs text-gray-400">AI will extract all details automatically</p>
              </div>
              <div
                className="ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', color: '#7c3aed' }}
              >
                <Sparkles className="h-3 w-3" /> AI-Powered OCR
              </div>
            </div>

            <div className="space-y-5 p-5">
              <p className="text-sm text-gray-500">
                Upload a clear photo of the guest&apos;s government ID — Aadhaar, Passport,
                Driving Licence, Voter ID, or PAN. The AI will extract name, address, and ID
                number instantly.
              </p>

              {/* Drop zone */}
              <div
                onClick={() => !ocrLoading && fileRef.current?.click()}
                className="relative cursor-pointer overflow-hidden rounded-2xl transition-all"
                style={{
                  border: ocrLoading ? '2px dashed #F97316' : '2px dashed #e2e8f0',
                  background: ocrLoading ? '#fff7ed' : '#fafafa',
                }}
              >
                <div className="flex flex-col items-center gap-4 p-10">
                  {ocrLoading ? (
                    <>
                      <div className="flex h-16 w-16 items-center justify-center rounded-3xl"
                        style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}>
                        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-orange-700">Scanning ID with AI...</p>
                        <p className="mt-1 text-xs text-orange-400">Extracting name, address &amp; ID number</p>
                      </div>
                      <div className="h-1.5 w-48 overflow-hidden rounded-full bg-orange-100">
                        <div className="h-full animate-pulse rounded-full"
                          style={{ width: '70%', background: 'linear-gradient(90deg,#F97316,#F43F5E)' }} />
                      </div>
                    </>
                  ) : idPreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={idPreview} alt="ID preview"
                        className="max-h-52 rounded-xl border border-gray-100 object-contain shadow-sm" />
                      <p className="flex items-center gap-1.5 text-xs text-gray-400">
                        <RefreshCw className="h-3 w-3" /> Click to change image
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex h-16 w-16 items-center justify-center rounded-3xl"
                        style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}>
                        <Upload className="h-8 w-8 text-orange-400" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-700">Click to upload ID card photo</p>
                        <p className="mt-1 text-xs text-gray-400">Supports Aadhaar · Passport · DL · PAN · Voter ID</p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {['Aadhaar', 'Passport', 'DL', 'PAN', 'Voter ID'].map((t) => (
                          <span key={t} className="rounded-full px-2.5 py-1 text-xs font-medium"
                            style={{ background: '#f1f5f9', color: '#64748b' }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {!ocrLoading && (
                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity hover:opacity-100"
                    style={{ background: 'linear-gradient(135deg,rgba(249,115,22,0.04),rgba(244,63,94,0.04))' }}
                  />
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleIdUpload(e.target.files[0])}
              />

              <div className="pt-1 text-center">
                <button
                  onClick={() => setStep(2)}
                  className="mx-auto flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-orange-500"
                >
                  Skip scan — enter details manually <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </DashboardLayout>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 2 — Guest Details Form
  // ══════════════════════════════════════════════════════════════
  if (step === 2) {
    return (
      <DashboardLayout title="Register Guest">
        <div className="max-w-2xl space-y-5 pb-10">

          {/* Header */}
          <div
            className="relative overflow-hidden rounded-2xl px-5 py-6 text-white sm:rounded-3xl sm:px-8 sm:py-7"
            style={{ background: 'linear-gradient(135deg,#F97316 0%,#F43F5E 100%)' }}
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-20"
              style={{ background: 'rgba(255,255,255,0.3)' }} />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                    Guest Registration
                  </span>
                </div>
                <h1 className="text-2xl font-bold leading-tight sm:text-3xl">Guest Details</h1>
                <p className="mt-1 text-sm opacity-80">
                  {ocrDone
                    ? 'ID scanned — verify and confirm the details below'
                    : 'Fill in the guest details manually'}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                <Steps />
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all"
                  style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Rescan
                </button>
              </div>
            </div>
          </div>

          {/* OCR success banner */}
          {ocrDone && (
            <div className="flex items-center gap-3 rounded-2xl border px-4 py-3.5"
              style={{ background: '#ecfdf5', borderColor: '#bbf7d0' }}>
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: '#dcfce7' }}>
                <ShieldCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-green-800">ID scanned successfully</p>
                <p className="text-xs text-green-600">Details extracted — review and correct if needed</p>
              </div>
              <div className="ml-auto rounded-full px-2.5 py-1 text-xs font-bold"
                style={{ background: '#dcfce7', color: '#16a34a' }}>
                AI Verified
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ID Information */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-50 px-5 py-4"
                style={{ background: '#fafafa' }}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)' }}>
                  <CreditCard className="h-4 w-4 text-violet-600" />
                </div>
                <p className="text-sm font-bold text-gray-900">ID Information</p>
                {idPreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={idPreview} alt="ID"
                    className="ml-auto h-10 rounded-lg border border-gray-100 object-contain" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 p-5">
                <Field label="ID Type">
                  <select value={form.idType} onChange={f('idType')} className={inputNormal}>
                    {ID_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="ID Number" highlighted={ocrDone && !!form.idNumber}>
                  <input
                    className={ocrDone && form.idNumber ? inputHighlight : inputNormal}
                    value={form.idNumber}
                    onChange={f('idNumber')}
                    placeholder="Enter ID number"
                  />
                </Field>

                <Field label="ID Verification">
                  <div
                    className="flex items-center gap-3 rounded-xl border px-3.5 py-2.5"
                    style={{
                      background: form.idVerified ? '#ecfdf5' : '#f8fafc',
                      borderColor: form.idVerified ? '#bbf7d0' : '#e2e8f0',
                    }}
                  >
                    <input
                      type="checkbox"
                      id="idVerified"
                      checked={form.idVerified}
                      onChange={(e) => setForm((p) => ({ ...p, idVerified: e.target.checked }))}
                      className="h-4 w-4 flex-shrink-0 accent-green-600"
                    />
                    {/* ✅ Fix 2: was "abel" — restored opening < */}
                    <label
                      htmlFor="idVerified"
                      className="cursor-pointer text-xs font-semibold"
                      style={{ color: form.idVerified ? '#166534' : '#64748b' }}
                    >
                      {ocrDone ? 'ID verified by AI scan' : 'Physically verified ID'}
                    </label>
                  </div>
                </Field>
              </div>
            </div>

            {/* Personal Information */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-50 px-5 py-4"
                style={{ background: '#fafafa' }}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)' }}>
                  <User className="h-4 w-4 text-orange-500" />
                </div>
                <p className="text-sm font-bold text-gray-900">Personal Information</p>
                {ocrDone && (
                  <span className="ml-auto rounded-full px-2.5 py-1 text-xs font-bold"
                    style={{ background: '#dcfce7', color: '#16a34a' }}>
                    Auto-filled from ID
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 p-5">
                <Field label="First Name" required highlighted={ocrDone && !!form.firstName}>
                  <input
                    className={ocrDone && form.firstName ? inputHighlight : inputNormal}
                    value={form.firstName}
                    onChange={f('firstName')}
                    placeholder="First name"
                    required
                  />
                </Field>

                <Field label="Last Name" required highlighted={ocrDone && !!form.lastName}>
                  <input
                    className={ocrDone && form.lastName ? inputHighlight : inputNormal}
                    value={form.lastName}
                    onChange={f('lastName')}
                    placeholder="Last name"
                    required
                  />
                </Field>

                <Field label="Date of Birth" highlighted={ocrDone && !!form.dob}>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      className={`${ocrDone && form.dob ? inputHighlight : inputNormal} pl-10`}
                      value={form.dob}
                      onChange={f('dob')}
                    />
                  </div>
                </Field>

                <Field label="Nationality" highlighted={ocrDone && !!form.nationality}>
                  <input
                    className={ocrDone && form.nationality ? inputHighlight : inputNormal}
                    value={form.nationality}
                    onChange={f('nationality')}
                    placeholder="Indian"
                  />
                </Field>

                <Field label="Email">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      className={`${inputNormal} pl-10`}
                      value={form.email}
                      onChange={f('email')}
                      placeholder="guest@example.com"
                    />
                  </div>
                </Field>
              </div>
            </div>

            {/* Address */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-50 px-5 py-4"
                style={{ background: '#fafafa' }}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)' }}>
                  <MapPin className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-sm font-bold text-gray-900">Address</p>
                {ocrDone && (
                  <span className="ml-auto rounded-full px-2.5 py-1 text-xs font-bold"
                    style={{ background: '#dcfce7', color: '#16a34a' }}>
                    From ID
                  </span>
                )}
              </div>

              <div className="space-y-4 p-5">
                <Field label="Address Line 1" highlighted={ocrDone && !!form.address.line1}>
                  <input
                    className={ocrDone && form.address.line1 ? inputHighlight : inputNormal}
                    value={form.address.line1}
                    onChange={fAddr('line1')}
                    placeholder="Street address"
                  />
                </Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="City" highlighted={ocrDone && !!form.address.city}>
                    <input
                      className={ocrDone && form.address.city ? inputHighlight : inputNormal}
                      value={form.address.city}
                      onChange={fAddr('city')}
                      placeholder="City"
                    />
                  </Field>
                  <Field label="State" highlighted={ocrDone && !!form.address.state}>
                    <input
                      className={ocrDone && form.address.state ? inputHighlight : inputNormal}
                      value={form.address.state}
                      onChange={fAddr('state')}
                      placeholder="State"
                    />
                  </Field>
                  <Field label="Pincode" highlighted={ocrDone && !!form.address.pincode}>
                    <input
                      className={ocrDone && form.address.pincode ? inputHighlight : inputNormal}
                      value={form.address.pincode}
                      onChange={fAddr('pincode')}
                      placeholder="000000"
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* Contact & WhatsApp */}
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm"
              style={{ borderColor: '#fed7aa' }}>
              <div className="flex items-center gap-3 border-b px-5 py-4"
                style={{ background: '#fff7ed', borderColor: '#fed7aa' }}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)' }}>
                  <Phone className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Contact &amp; WhatsApp</p>
                  <p className="text-xs text-orange-600">Staff fills this section</p>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <Field label="Phone / WhatsApp Number" required>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      className={`${inputNormal} pl-10`}
                      value={form.phone}
                      onChange={f('phone')}
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                </Field>

                <div
                  className="cursor-pointer rounded-xl border px-4 py-3"
                  style={{
                    background: form.whatsappOptIn ? '#ecfdf5' : '#f8fafc',
                    borderColor: form.whatsappOptIn ? '#bbf7d0' : '#e2e8f0',
                  }}
                  onClick={() => setForm((p) => ({ ...p, whatsappOptIn: !p.whatsappOptIn }))}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="whatsappOptIn"
                      checked={form.whatsappOptIn}
                      onChange={(e) => setForm((p) => ({ ...p, whatsappOptIn: e.target.checked }))}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 flex-shrink-0 accent-green-600"
                    />
                    <div>
                      {/* ✅ Fix 3: was "abel" — restored opening < */}
                      <label
                        htmlFor="whatsappOptIn"
                        className="cursor-pointer text-sm font-semibold"
                        style={{ color: form.whatsappOptIn ? '#166534' : '#475569' }}
                      >
                        Send WhatsApp welcome message after registration
                      </label>
                      <p className="mt-0.5 text-xs text-gray-400">
                        Opens WhatsApp with a pre-filled welcome message
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-400">
                  💡 This number will be used for booking confirmations, check-in notifications
                  and checkout reminders.
                </p>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={createGuest.isPending}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg,#F97316,#F43F5E)',
                boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
              }}
            >
              {createGuest.isPending ? (
                <><Spinner size="sm" /> Registering...</>
              ) : (
                <><ShieldCheck className="h-4 w-4" /> Register Guest &amp; Send Welcome</>
              )}
            </button>
          </form>
        </div>
      </DashboardLayout>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 3 — Success
  // ══════════════════════════════════════════════════════════════
  return (
    <DashboardLayout title="Guest Registered">
      <div className="mx-auto max-w-md space-y-6 pb-16 pt-10">

        <div
          className="relative overflow-hidden rounded-3xl px-6 py-10 text-center text-white"
          style={{ background: 'linear-gradient(135deg,#F97316 0%,#F43F5E 100%)' }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20"
            style={{ background: 'rgba(255,255,255,0.3)' }} />
          <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full opacity-10"
            style={{ background: 'rgba(255,255,255,0.5)' }} />

          <div className="relative">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl"
              style={{ background: 'rgba(255,255,255,0.25)' }}>
              <PartyPopper className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Guest Registered!</h2>
            <p className="mt-1 text-sm opacity-80">{form.firstName} {form.lastName}</p>

            {createdGuest?.loyalty?.membershipId && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                <span className="font-mono text-sm font-bold">{createdGuest.loyalty.membershipId}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {form.phone && (
            <button
              onClick={() =>
                openWhatsApp(
                  form.phone,
                  `🌟 *Welcome ${form.firstName}!*\n\nYou're registered at ${hotelName}.\nMembership ID: ${createdGuest?.loyalty?.membershipId || '—'}\n\nWe look forward to hosting you! 🏨`
                )
              }
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.99]"
              style={{
                background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                boxShadow: '0 4px 16px rgba(34,197,94,0.3)',
              }}
            >
              Send Welcome WhatsApp
            </button>
          )}

          <button
            onClick={() => router.push(`/dashboard/guests/${createdGuest?._id}`)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.99]"
            style={{ background: 'linear-gradient(135deg,#F97316,#F43F5E)', boxShadow: '0 4px 16px rgba(249,115,22,0.3)' }}
          >
            View Guest Profile <ChevronRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => router.push('/dashboard/reservations/new')}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-3.5 text-sm font-bold text-slate-600 transition-all hover:border-orange-300 hover:text-orange-500"
          >
            <Calendar className="h-4 w-4" /> Create Reservation for this Guest
          </button>

          <div className="pt-2 text-center">
            <button
              onClick={() => { setStep(1); setIdPreview(null); setOcrDone(false); setForm(EMPTY_FORM); }}
              className="text-sm text-gray-400 transition-colors hover:text-orange-500"
            >
              + Register another guest
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}