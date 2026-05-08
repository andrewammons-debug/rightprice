// Public facing — no auth required. Shareable link sent via SMS to customers.
// Server component: fetches data server-side, no "use client" needed.

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Vehicle = {
  id: string;
  vin: string;
  year: string;
  make: string;
  model: string;
  body: string;
  miles: string;
  color: string;
  transmission: string;
  price: number;
  remarks: string;
  photo_urls: string[] | null;
};

function fmtPrice(p: number): string {
  if (!p) return 'Call for Price';
  return '$' + p.toLocaleString();
}

function fmtMiles(m: string | number): string {
  const n = typeof m === 'string' ? parseFloat(m.replace(/[^0-9.]/g, '')) : m;
  if (isNaN(n)) return '—';
  return n.toLocaleString() + ' miles';
}

export default async function SharePage({ params }: { params: Promise<{ vin: string }> }) {
  const { vin } = await params;

  const { data, error } = await supabaseAdmin
    .from('inspections')
    .select('id, vin, year, make, model, body, miles, color, transmission, price, remarks, photo_urls')
    .eq('vin', vin)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a1020', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚗</div>
          <div style={{ fontSize: 20, fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', color: '#e6ecf6', marginBottom: 8 }}>
            Vehicle Not Found
          </div>
          <div style={{ fontSize: 13 }}>VIN: {vin}</div>
          <div style={{ marginTop: 12, fontSize: 13 }}>
            Call us at{' '}
            <a href="tel:6158931727" style={{ color: '#720009', fontWeight: 800, textDecoration: 'none' }}>
              615-893-1727
            </a>
          </div>
        </div>
      </div>
    );
  }

  const v = data as Vehicle;
  const photos: string[] = Array.isArray(v.photo_urls) ? v.photo_urls : [];
  const heroPhoto = photos[0] ?? null;
  const galleryPhotos = photos.slice(1, 5);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a1020',
        color: '#e6ecf6',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        WebkitFontSmoothing: 'antialiased',
        paddingBottom: 80,
      }}
    >
      {/* Hero */}
      <div
        style={{
          width: '100%',
          aspectRatio: '16/7',
          maxHeight: 420,
          background: heroPhoto
            ? `linear-gradient(180deg, rgba(10,16,32,.1) 0%, rgba(10,16,32,.5) 60%, #0a1020 100%), url(${heroPhoto}) center/cover no-repeat`
            : 'linear-gradient(135deg, #131c34, #1a2440)',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '0 24px 32px',
          position: 'relative',
        }}
      >
        {/* Dealer badge */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 24,
            background: '#720009',
            color: 'white',
            fontSize: 10,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            padding: '6px 12px',
            borderRadius: 3,
          }}
        >
          Right Price Auto Sales · Murfreesboro, TN
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px' }}>
        {/* Title & Price */}
        <div style={{ padding: '24px 0 20px', borderBottom: '3px solid #720009' }}>
          <div style={{ fontSize: 'clamp(28px, 7vw, 48px)', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1.05, color: '#e6ecf6' }}>
            {v.year} {v.make}
            <br />
            <span style={{ color: '#94a3b8' }}>{v.model}</span>
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 'clamp(32px, 8vw, 52px)',
              fontWeight: 900,
              fontStyle: 'italic',
              color: '#e6ecf6',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {fmtPrice(v.price)}
          </div>
        </div>

        {/* Specs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'rgba(148,163,184,.08)', margin: '24px 0', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(148,163,184,.10)' }}>
          {[
            { label: 'Mileage',      value: fmtMiles(v.miles) },
            { label: 'Color',        value: v.color || '—' },
            { label: 'Transmission', value: v.transmission || '—' },
            { label: 'Body Style',   value: v.body || '—' },
            { label: 'VIN',          value: v.vin, mono: true },
          ].map(({ label, value, mono }) => (
            <div
              key={label}
              style={{
                background: '#131c34',
                padding: '16px 20px',
              }}
            >
              <div style={{ fontSize: 9, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: mono ? 11 : 14, fontWeight: 700, color: '#e6ecf6', fontFamily: mono ? 'monospace' : undefined }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Remarks */}
        {v.remarks && (
          <div
            style={{
              background: '#131c34',
              border: '1px solid rgba(148,163,184,.10)',
              borderRadius: 6,
              padding: '20px 24px',
              marginBottom: 28,
            }}
          >
            <div style={{ fontSize: 9, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
              Notes
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#94a3b8', lineHeight: 1.7 }}>{v.remarks}</div>
          </div>
        )}

        {/* Gallery */}
        {galleryPhotos.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
              More Photos
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {galleryPhotos.map((url, i) => (
                <div key={i} style={{ aspectRatio: '4/3', borderRadius: 6, overflow: 'hidden', background: '#131c34' }}>
                  <img src={url} alt={`${v.year} ${v.make} ${v.model} photo ${i + 2}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <a
            href="tel:6158931727"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '20px 0',
              background: '#720009',
              borderRadius: 6,
              color: 'white',
              fontSize: 'clamp(16px, 4vw, 22px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              textDecoration: 'none',
              boxShadow: '0 8px 32px -8px rgba(114,0,9,.5)',
            }}
          >
            📞 Call Us: 615-893-1727
          </a>

          <a
            href="sms:6158931727"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '18px 0',
              background: 'rgba(255,255,255,.06)',
              border: '2px solid rgba(255,255,255,.12)',
              borderRadius: 6,
              color: '#e6ecf6',
              fontSize: 'clamp(14px, 3.5vw, 18px)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              textDecoration: 'none',
            }}
          >
            💬 Text Us: 615-893-1727
          </a>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 48, textAlign: 'center', color: '#475569', fontSize: 11, fontWeight: 600 }}>
          <div style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginBottom: 4 }}>
            Right Price Auto Sales
          </div>
          <div>Murfreesboro, TN · Financing Available · All Credit Considered</div>
        </div>
      </div>
    </div>
  );
}
