/**
 * src/components/guest-chat/CheckoutOverdueCard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Rendered inside the guest chat bubble when message.action.type === 'checkout_overdue'
 *
 * Drop this component into your existing GuestChatPage.tsx MessageBubble
 * renderer — same pattern as your existing OrderCardBubble.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client';

import { useState } from 'react';

interface ActionOption {
  label:   string;
  url:     string;
  style:   'primary' | 'secondary' | 'ghost';
  tooltip?: string;
}

interface CheckoutOverdueAction {
  type:        'checkout_overdue';
  title:       string;
  options:     ActionOption[];
  minutesLate: number;
  roomNumber:  string;
}

interface Props {
  action: CheckoutOverdueAction;
}

const theme = {
  bg:       '#FFFFFF',
  border:   '#F0C8BF',
  text:     '#261815',
  muted:    '#7A5A53',
  faint:    '#B58C84',
  orange:   '#FF7A45',
  red:      '#D94B4B',
  green:    '#1F7A5A',
  shadow:   '0 8px 28px rgba(243,129,96,0.14)',
};

function humanLate(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min overdue`;
  if (m === 0) return `${h}h overdue`;
  return `${h}h ${m}m overdue`;
}

export default function CheckoutOverdueCard({ action }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [done,    setDone]    = useState<string | null>(null);

  function handleClick(opt: ActionOption) {
    // For tel: links just navigate immediately
    if (opt.url.startsWith('tel:')) {
      window.location.href = opt.url;
      return;
    }

    setLoading(opt.label);

    // Open in same tab (guest-facing link — token in URL)
    window.location.href = opt.url;

    // Fallback reset after 3s in case navigation is blocked
    setTimeout(() => {
      setLoading(null);
      setDone(opt.label);
    }, 3000);
  }

  const styleMap: Record<ActionOption['style'], React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, #1F7A5A, #16A34A)',
      color:      '#fff',
      border:     'none',
      boxShadow:  '0 6px 18px rgba(31,122,90,0.28)',
    },
    secondary: {
      background: 'linear-gradient(135deg, #FF7A45, #EA5D28)',
      color:      '#fff',
      border:     'none',
      boxShadow:  '0 6px 18px rgba(255,122,69,0.28)',
    },
    ghost: {
      background: '#FFF8F4',
      color:      theme.muted,
      border:     `1.5px solid ${theme.border}`,
    },
  };

  return (
    <div
      style={{
        background: theme.bg,
        border:     `1.5px solid ${theme.border}`,
        borderRadius: 24,
        overflow:   'hidden',
        maxWidth:   320,
        boxShadow:  theme.shadow,
      }}
    >
      {/* ── Header stripe ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #D94B4B, #B91C1C)',
          padding:    '14px 16px 12px',
          color:      '#fff',
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', opacity: 0.8, textTransform: 'uppercase' }}>
          Auto Checkout Alert
        </div>
        <div style={{ marginTop: 4, fontSize: 16, fontWeight: 700 }}>
          ⏰ {action.title}
        </div>
        <div
          style={{
            marginTop:    6,
            display:      'inline-flex',
            alignItems:   'center',
            gap:          6,
            background:   'rgba(255,255,255,0.18)',
            borderRadius: 20,
            padding:      '4px 12px',
            fontSize:     12,
            fontWeight:   600,
          }}
        >
          Room {action.roomNumber} · {humanLate(action.minutesLate)}
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div style={{ padding: '14px 14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {action.options.map((opt) => {
          const isLoading = loading === opt.label;
          const isDone    = done    === opt.label;

          return (
            <button
              key={opt.label}
              onClick={() => handleClick(opt)}
              disabled={!!loading || isDone}
              title={opt.tooltip}
              style={{
                ...styleMap[opt.style],
                borderRadius: 20,
                padding:      '12px 18px',
                fontSize:     14,
                fontWeight:   700,
                cursor:       loading ? 'not-allowed' : 'pointer',
                opacity:      loading && !isLoading ? 0.5 : 1,
                transition:   'all 0.18s ease',
                textAlign:    'center',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                gap:          8,
              }}
            >
              {isLoading ? '⏳ Opening…' : isDone ? '✅ Opened' : opt.label}
            </button>
          );
        })}
      </div>

      {/* ── Footer hint ── */}
      <div
        style={{
          borderTop:  `1px solid ${theme.border}`,
          padding:    '8px 14px',
          fontSize:   11,
          color:      theme.faint,
          textAlign:  'center',
          background: '#FFF8F4',
        }}
      >
        You can also walk to the front desk anytime
      </div>
    </div>
  );
}