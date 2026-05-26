/**
 * src/app/guest/extend/page.tsx  (Next.js App Router)
 * ─────────────────────────────────────────────────────────────────────────────
 * Extend stay page — opened when guest taps "🌙 Extend My Stay"
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams }     from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

const theme = {
  bg:     '#FFF4EC',
  card:   '#FFFFFF',
  border: '#F0C8BF',
  text:   '#261815',
  muted:  '#7A5A53',
  orange: '#FF7A45',
  red:    '#D94B4B',
};

const OPTIONS = [
  { label: '+ 3 hours',    value: 3,  price: 'Free (subject to availability)' },
  { label: '+ 6 hours',    value: 6,  price: '50% of nightly rate' },
  { label: '+ 1 full day', value: 24, price: 'Full nightly rate' },
];

export default function GuestExtendPage() {
  const params = useSearchParams();
  const token  = params.get('token') ?? '';

  const [step,      setStep]      = useState<'loading' | 'pick' | 'submitting' | 'done' | 'error'>('loading');
  const [selected,  setSelected]  = useState<number | null>(null);
  const [guestName, setGuestName] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [roomNumber,setRoomNumber]= useState('');
  const [errMsg,    setErrMsg]    = useState('');
  const [note,      setNote]      = useState('');

  useEffect(() => {
    if (!token) { setStep('error'); setErrMsg('No token provided.'); return; }
    fetch(`${API_URL}/api/chatbot/guest/checkout/preview?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) throw new Error(json.message);
        setGuestName(json.data.guestName);
        setHotelName(json.data.hotelName);
        setRoomNumber(json.data.roomNumber);
        setStep('pick');
      })
      .catch((e) => { setErrMsg(e.message); setStep('error'); });
  }, [token]);

  async function submitRequest() {
    if (selected === null) return;
    setStep('submitting');
    try {
      const res  = await fetch(`${API_URL}/api/chatbot/guest/extend`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, hours: selected, note }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setStep('done');
    } catch (e: any) {
      setErrMsg(e.message);
      setStep('error');
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420, background: theme.card, borderRadius: 32, border: `1.5px solid ${theme.border}`, overflow: 'hidden', boxShadow: '0 20px 60px rgba(225,117,92,0.14)' }}>

        <div style={{ background: 'linear-gradient(135deg, #FF8B5E, #EC5B94)', padding: '24px 24px 20px', color: '#fff' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', opacity: 0.8, textTransform: 'uppercase' }}>Extend Stay</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>🌙 How much longer?</h1>
          {hotelName && <p style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>{hotelName} · Room {roomNumber}</p>}
        </div>

        <div style={{ padding: 24 }}>

          {step === 'loading' && <p style={{ textAlign: 'center', color: theme.muted, fontSize: 14 }}>Loading…</p>}

          {step === 'pick' && (
            <>
              <p style={{ fontSize: 14, color: theme.muted, marginBottom: 16 }}>Hi {guestName}! Select how long you'd like to stay:</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => setSelected(opt.value)}
                    style={{
                      textAlign:     'left',
                      padding:       '14px 18px',
                      borderRadius:  20,
                      border:        selected === opt.value ? '2px solid #FF7A45' : `1.5px solid ${theme.border}`,
                      background:    selected === opt.value ? '#FFF4EC' : '#fff',
                      cursor:        'pointer',
                      display:       'flex',
                      justifyContent:'space-between',
                      alignItems:    'center',
                    }}>
                    <span style={{ fontWeight: 700, color: theme.text }}>{opt.label}</span>
                    <span style={{ fontSize: 12, color: theme.muted }}>{opt.price}</span>
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Any special note? (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                style={{ width: '100%', borderRadius: 16, border: `1.5px solid ${theme.border}`, padding: '10px 14px', fontSize: 13, color: theme.text, outline: 'none', resize: 'none', marginBottom: 16, background: '#FFFAF8', boxSizing: 'border-box' }}
              />

              <button onClick={submitRequest} disabled={selected === null}
                style={{ width: '100%', background: selected !== null ? 'linear-gradient(135deg, #FF8B5E, #EC5B94)' : '#EEE', color: selected !== null ? '#fff' : '#999', border: 'none', borderRadius: 20, padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: selected !== null ? 'pointer' : 'not-allowed', boxShadow: selected !== null ? '0 8px 22px rgba(255,122,69,0.28)' : 'none' }}>
                Request Extension
              </button>
            </>
          )}

          {step === 'submitting' && <p style={{ textAlign: 'center', color: theme.muted, fontSize: 14 }}>Sending your request…</p>}

          {step === 'done' && (
            <div style={{ textAlign: 'center', paddingBottom: 8 }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🌙</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.orange }}>Request Sent!</h2>
              <p style={{ marginTop: 8, fontSize: 14, color: theme.muted }}>Our team will confirm availability and reach out shortly. You'll see the update here in your chat.</p>
            </div>
          )}

          {step === 'error' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
              <p style={{ fontSize: 14, color: theme.red }}>{errMsg || 'Something went wrong. Please visit the front desk.'}</p>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}