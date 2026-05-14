// ═══════════════════════════════════════════════════════════════════════
// FILE 1: web/src/app/checkout/[token]/page.tsx  — PUBLIC
// Guest reviews bill on phone and pays to check out
// ═══════════════════════════════════════════════════════════════════════
'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, CheckCircle, Receipt, CreditCard, QrCode } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const publicApi = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

export default function ExpressCheckoutPage() {
  const { token }   = useParams<{ token: string }>();
  const [step,      setStep]      = useState<'review'|'pay'|'done'>('review');
  const [payMode,   setPayMode]   = useState<'upi'|'razorpay'>('upi');
  const [qrData,    setQrData]    = useState<any>(null);
  const [loading,   setLoading]   = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['express-checkout', token],
    queryFn:  () => publicApi.get(`/api/express-checkout/${token}`).then(r => r.data.data),
  });

  const verifyMut = useMutation({
    mutationFn: (d: any) => publicApi.post(`/api/express-checkout/${token}/verify`, d),
    onSuccess:  () => setStep('done'),
  });

  async function handlePay() {
    setLoading(true);
    try {
      if (payMode === 'upi') {
        const { data: qr } = await publicApi.post(`/api/express-checkout/${token}/pay`, { paymentMode: 'upi' });
        setQrData(qr.data);
        setLoading(false);
        return;
      }
      const { data: order } = await publicApi.post(`/api/express-checkout/${token}/pay`, { paymentMode: 'razorpay' });
      const rzp = new (window as any).Razorpay({
        key:         order.data.key,
        amount:      order.data.amount,
        currency:    'INR',
        order_id:    order.data.orderId,
        name:        data.hotel?.hotelName,
        description: `Checkout — ${data.reservation?.roomNumber}`,
        handler:     (resp: any) => verifyMut.mutate(resp),
        theme:       { color: data.hotel?.brandColor || '#1B4FD8' },
      });
      rzp.open();
    } catch {
      alert('Payment failed. Please try again or contact reception.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmUPIPaid() {
    verifyMut.mutate({ paymentMode: 'upi', upiConfirmed: true });
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <div>
        <p className="text-xl font-bold text-gray-900">Link expired or invalid</p>
        <p className="text-gray-500 text-sm mt-2">Please contact reception desk.</p>
      </div>
    </div>
  );

  const { reservation, folio, hotel } = data;
  const brandColor = hotel?.brandColor || '#1B4FD8';

  if (step === 'done') return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-5 max-w-sm">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Checked Out! 👋</h2>
        <p className="text-gray-500 text-sm">Thank you for staying at {hotel?.hotelName}. Safe travels!</p>
        <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Room</span><span className="font-semibold">{reservation.roomNumber}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Stayed</span><span className="font-semibold">{reservation.nights} nights</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Total Paid</span><span className="font-bold text-green-600">{formatCurrency(folio.totalCharges)}</span></div>
        </div>
        <p className="text-xs text-gray-400">GST invoice will be emailed to you shortly.</p>
      </div>
    </div>
  );

  return (
    <>
      <script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: brandColor }}>
              {hotel?.hotelName?.[0]}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{hotel?.hotelName}</p>
              <p className="text-xs text-gray-400">Express Checkout · Room {reservation.roomNumber}</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Bill summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-5 h-5 text-gray-600" />
              <h3 className="font-bold text-gray-900">Your Bill</h3>
            </div>
            <div className="space-y-2 mb-4">
              {(folio.charges || []).filter((c: any) => !c.isVoid).map((c: any) => (
                <div key={c._id} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate flex-1 mr-3">{c.description}</span>
                  <span className="font-medium text-gray-900 whitespace-nowrap">
                    {formatCurrency(c.amount + c.taxAmount)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span className="font-medium">{formatCurrency(folio.totalCharges - folio.totalTax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">GST</span>
                <span className="font-medium text-amber-700">{formatCurrency(folio.totalTax)}</span>
              </div>
              {folio.totalPayments > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Already Paid</span>
                  <span className="font-medium text-green-600">−{formatCurrency(folio.totalPayments)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-1 border-t border-gray-200">
                <span>Balance Due</span>
                <span style={{ color: brandColor }}>{formatCurrency(folio.balance)}</span>
              </div>
            </div>
          </div>

          {folio.balance <= 0 ? (
            /* No balance — just confirm checkout */
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="font-semibold text-green-800">No balance due!</p>
              <p className="text-xs text-green-600 mt-1">Your bill is fully paid.</p>
            </div>
          ) : (
            /* Payment options */
            <>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'upi',      label: 'UPI / GPay / PhonePe', icon: QrCode    },
                  { value: 'razorpay', label: 'Card / Net Banking',   icon: CreditCard },
                ].map(m => (
                  <button key={m.value} onClick={() => setPayMode(m.value as any)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-sm font-semibold transition-all ${payMode === m.value ? 'border-current text-white' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300'}`}
                    style={payMode === m.value ? { backgroundColor: brandColor, borderColor: brandColor } : {}}>
                    <m.icon className="w-5 h-5" />
                    {m.label}
                  </button>
                ))}
              </div>

              {/* UPI QR after clicking pay */}
              {qrData && payMode === 'upi' && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center shadow-sm">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Scan to pay {formatCurrency(folio.balance)}</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrData.qrDataUrl} alt="UPI QR" className="w-48 h-48 mx-auto rounded-xl border border-gray-200" />
                  <p className="text-xs text-gray-400 mt-3 mb-4">Pay using GPay, PhonePe, Paytm, or any UPI app</p>
                  <button onClick={confirmUPIPaid}
                    disabled={verifyMut.isPending}
                    className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                    style={{ backgroundColor: brandColor }}>
                    {verifyMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '✓ I have paid'}
                  </button>
                </div>
              )}
            </>
          )}

          <button
            onClick={folio.balance <= 0 ? () => verifyMut.mutate({ noBill: true }) : handlePay}
            disabled={loading || verifyMut.isPending}
            className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: brandColor }}>
            {loading || verifyMut.isPending
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : folio.balance <= 0 ? '✓ Confirm Check Out' : `Pay ${formatCurrency(folio.balance)} & Check Out`
            }
          </button>

          <p className="text-xs text-center text-gray-400">
            Please drop your room key at reception after checkout.
          </p>
        </div>
      </div>
    </>
  );
}