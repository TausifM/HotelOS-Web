'use client';
import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button, Input, Select, Spinner } from '@/components/ui';
import { Upload, CheckCircle, AlertCircle, Hotel } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';


export default function SelfCheckInPage() {
  const { token } = useParams<{ token: string }>();
  const fileRef   = useRef<HTMLInputElement>(null);
  const [step, setStep]       = useState(1);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [form, setForm]       = useState({
    phone:      '',
    email:      '',
    idType:     'aadhaar',
    idNumber:   '',
    address:    { line1: '', city: '', state: '', pincode: '' },
    confirmDetails: false,
  });
const [guestChatUrl, setGuestChatUrl] = useState('');
  // Fetch reservation details from token
  const { data, isLoading, error } = useQuery({
    queryKey: ['self-checkin', token],
    queryFn:  () => api.get(`/api/self-checkin/verify/${token}`).then(r => r.data.data),
    retry:    false,
  });

const submitMutation = useMutation({
  mutationFn: (formData: FormData) =>
    api.post(`/api/self-checkin/submit/${token}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: async (response) => {
      try {
        const reservationId =
          response?.data?.data?.reservationId ||
          data?.reservation?._id;

        if (reservationId) {
          const chatRes = await api.post(`/api/chatbot/generate-link/${reservationId}`);
          setGuestChatUrl(chatRes.data.data.chatUrl);
        }
      } catch (err) {
        console.error('Failed to generate guest chat link', err);
      }

      setStep(4);
      toast.success('Check-in complete!');
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || 'Submission failed'),
  });

  function handleIdUpload(file: File) {
    const reader = new FileReader();
    reader.onload = e => setIdPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    if (!form.confirmDetails) { toast.error('Please confirm your details'); return; }
    if (!form.phone) { toast.error('Phone number is required'); return; }

    const formData = new FormData();
    formData.append('phone',          form.phone);
    formData.append('email',          form.email);
    formData.append('idType',         form.idType);
    formData.append('idNumber',       form.idNumber);
    formData.append('address',        JSON.stringify(form.address));
    formData.append('confirmDetails', 'true');

    if (fileRef.current?.files?.[0]) {
      formData.append('idImage', fileRef.current.files[0]);
    }

    submitMutation.mutate(formData);
  }

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <Spinner size="lg" />
        <p className="text-gray-500 text-sm">Loading your reservation...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-sm space-y-4">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">Link Expired or Invalid</h2>
        <p className="text-gray-500 text-sm">This check-in link has expired or is no longer valid. Please contact the hotel reception.</p>
      </div>
    </div>
  );

  if (data.alreadyCheckedIn) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-sm space-y-4">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">Already Checked In!</h2>
        <p className="text-gray-500 text-sm">Your check-in has already been processed. Welcome to {data.tenant?.hotelName}!</p>
      </div>
    </div>
  );

  const { reservation, tenant, guestDetails } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      {/* Hotel header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        {tenant?.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tenant.logo} alt={tenant.hotelName} className="h-10 w-10 rounded-xl object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: tenant?.brandColor || '#1D4ED8' }}>
            <Hotel className="w-5 h-5 text-white" />
          </div>
        )}
        <div>
          <p className="font-bold text-gray-900">{tenant?.hotelName}</p>
          <p className="text-xs text-gray-400">{tenant?.address?.city}</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Booking summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <h2 className="font-bold text-gray-900 text-lg mb-3">Your Booking</h2>
          <div className="space-y-2">
            {[
              { label: 'Guest',      value: `${guestDetails?.firstName} ${guestDetails?.lastName}` },
              { label: 'Ref',        value: reservation.bookingRef },
              { label: 'Room',       value: reservation.roomNumber },
              { label: 'Check-in',   value: new Date(reservation.checkIn).toLocaleDateString('en-IN') },
              { label: 'Check-out',  value: new Date(reservation.checkOut).toLocaleDateString('en-IN') },
              { label: 'Check-in Time', value: tenant?.checkInTime || '14:00' },
            ].map(item => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-gray-400">{item.label}</span>
                <span className="font-medium text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <p className="text-2xl mb-2">👋</p>
              <h2 className="text-xl font-bold text-gray-900">
                Welcome, {guestDetails?.firstName}!
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Complete your check-in in 2 minutes
              </p>
            </div>

            <div className="bg-blue-50 rounded-2xl p-4 space-y-3">
              <p className="font-semibold text-blue-900 text-sm">What you'll need:</p>
              {['📷 Photo of your ID card (Aadhaar/Passport etc.)', '📱 Your WhatsApp phone number', '✅ 2 minutes of your time'].map(item => (
                <p key={item} className="text-sm text-blue-800">{item}</p>
              ))}
            </div>

            <Button className="w-full" size="lg" onClick={() => setStep(2)}>
              Start Check-in →
            </Button>

            <p className="text-xs text-center text-gray-400">
              Your data is encrypted and stored securely
            </p>
          </div>
        )}

        {/* Step 2: ID Upload */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Upload Your ID</h2>

            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-brand-400 hover:bg-blue-50 transition-colors"
            >
              {idPreview ? (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={idPreview} alt="ID" className="max-h-40 mx-auto rounded-xl object-contain" />
                  <p className="text-xs text-gray-400">Tap to change</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 text-gray-300 mx-auto" />
                  <div>
                    <p className="font-medium text-gray-700">Take photo or upload</p>
                    <p className="text-xs text-gray-400 mt-1">Aadhaar · Passport · Driving Licence · Voter ID</p>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleIdUpload(e.target.files[0])}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select label="ID Type" value={form.idType} onChange={f('idType')}>
                <option value="aadhaar">Aadhaar</option>
                <option value="passport">Passport</option>
                <option value="driving_licence">Driving Licence</option>
                <option value="pan">PAN Card</option>
                <option value="voter_id">Voter ID</option>
                <option value="foreign_passport">Foreign Passport</option>
              </Select>
              <Input label="ID Number" value={form.idNumber} onChange={f('idNumber')} placeholder="Enter number" />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" onClick={() => setStep(3)}>Continue →</Button>
            </div>
          </div>
        )}

        {/* Step 3: Contact details */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Contact Details</h2>
            <p className="text-sm text-gray-500">We'll send your welcome message and updates here</p>

            <Input
              label="WhatsApp / Phone Number *"
              type="tel"
              value={form.phone}
              onChange={f('phone')}
              placeholder="+91 98765 43210"
              required
            />

            <Input
              label="Email (optional)"
              type="email"
              value={form.email}
              onChange={f('email')}
              placeholder="your@email.com"
            />

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              {[
                { label: 'Name',       value: `${guestDetails?.firstName} ${guestDetails?.lastName}` },
                { label: 'Room',       value: reservation.roomNumber },
                { label: 'Check-in',  value: new Date(reservation.checkIn).toLocaleDateString('en-IN') },
                { label: 'Check-out', value: new Date(reservation.checkOut).toLocaleDateString('en-IN') },
              ].map(item => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.confirmDetails}
                onChange={e => setForm(p => ({ ...p, confirmDetails: e.target.checked }))}
                className="w-4 h-4 mt-0.5 accent-brand-600"
              />
              <span className="text-sm text-gray-700">
                I confirm that the above details are correct and I agree to the hotel's terms and policies.
              </span>
            </label>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                loading={submitMutation.isPending}
                disabled={!form.confirmDetails || !form.phone}
              >
                Complete Check-in ✓
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="bg-blue-50 rounded-2xl p-4 text-sm text-blue-800 space-y-3">
            <div>
              <p className="font-semibold mb-1">🤖 Need anything during your stay?</p>
              <p>
                Use our guest chat for housekeeping, room service, wake-up calls, local tips and more.
              </p>
            </div>

            {guestChatUrl ? (
              <div className="flex flex-col gap-2">
                <a
                  href={guestChatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl bg-brand-600 text-white px-4 py-2 font-medium hover:bg-brand-700 transition-colors"
                >
                  Open Guest Chat
                </a>

                {tenant?.phone && (
                  <button
                    onClick={() =>
                      window.open(
                        `https://wa.me/${String(tenant.phone).replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Hi, I completed self check-in for ${reservation.bookingRef}. Here is my guest chat link: ${guestChatUrl}`
                        )}`,
                        '_blank'
                      )
                    }
                    className="inline-flex items-center justify-center rounded-xl border border-green-300 bg-green-50 text-green-700 px-4 py-2 font-medium hover:bg-green-100 transition-colors"
                  >
                    Open WhatsApp
                  </button>
                )}
              </div>
            ) : (
              <p>
                WhatsApp us at {tenant?.phone} — our assistant is available 24/7 for room service, housekeeping, local tips and more.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}