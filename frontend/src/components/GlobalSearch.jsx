import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from '../api';

const STATUS_BADGE = {
  on_trip:   { label:'On Trip',   color:'#f59e0b', bg:'#fffbeb', dot:'🟡' },
  available: { label:'Available', color:'#1d4ed8', bg:'#eff6ff', dot:'🔵' },
  completed: { label:'Completed', color:'#16a34a', bg:'#f0fdf4', dot:'🟢' },
  off_duty:  { label:'Off Duty',  color:'#64748b', bg:'#f1f5f9', dot:'⚫' },
};

function GlobalSearch({ lang, t, onClose }) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const inputRef = useRef(null);

  // Pre-load all drivers + vehicles on mount for instant search
  const [allDrivers,  setAllDrivers]  = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);

  useEffect(() => {
    // Fetch live data silently — if offline, search simply returns nothing
    Promise.all([
      fetch(`${API_BASE}/drivers`).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE}/vehicles`).then(r => r.json()).catch(() => []),
    ]).then(([d, v]) => {
      setAllDrivers(Array.isArray(d) ? d : []);
      setAllVehicles(Array.isArray(v) ? v : []);
    });
  }, []);

  // Also search trips when query is long enough
  const searchTrips = useCallback(async (q) => {
    if (q.length < 2) return [];
    try {
      const res = await fetch(`${API_BASE}/trips`);
      if (!res.ok) return [];
      const trips = await res.json();
      const ql = q.toLowerCase();
      return (trips || []).filter(tr =>
        (tr.driver_name    || '').toLowerCase().includes(ql) ||
        (tr.vehicle_number || '').toLowerCase().includes(ql) ||
        (tr.from_city      || '').toLowerCase().includes(ql) ||
        (tr.to_city        || '').toLowerCase().includes(ql)
      ).slice(0, 5);
    } catch { return []; }
  }, []);

  const doSearch = useCallback(async (q) => {
    setQuery(q);
    if (q.length < 2) { setResults(null); setOffline(false); return; }

    const ql = q.toLowerCase();

    // Filter pre-loaded data
    const drivers = allDrivers.filter(d =>
      (d.name         || '').toLowerCase().includes(ql) ||
      (d.phone        || '').includes(q) ||
      (d.cnic         || '').includes(q) ||
      (d.license_no   || '').toLowerCase().includes(ql)
    );

    const vehicles = allVehicles.filter(v =>
      (v.number_plate || '').toLowerCase().includes(ql) ||
      (v.model        || '').toLowerCase().includes(ql) ||
      (v.owner_name   || '').toLowerCase().includes(ql)
    );

    // If no pre-loaded results and server seems down, flag offline
    if (allDrivers.length === 0 && allVehicles.length === 0) {
      setOffline(true);
    } else {
      setOffline(false);
    }

    // Also fetch live trips
    const trips = await searchTrips(q);

    setResults({ drivers, vehicles, trips, total: drivers.length + vehicles.length + trips.length });
  }, [allDrivers, allVehicles, searchTrips]);

  // Keyboard close
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div
      style={{
        position:'fixed', inset:0, zIndex:1000,
        background:'rgba(15,23,42,0.75)', backdropFilter:'blur(5px)',
        display:'flex', alignItems:'flex-start', justifyContent:'center',
        padding:'72px 1rem 1rem',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background:'var(--bg-card,white)', borderRadius:'1rem',
        width:'100%', maxWidth:'660px',
        boxShadow:'0 25px 60px rgba(0,0,0,0.35)', overflow:'hidden',
        border:'1px solid var(--border-color,#e2e8f0)',
        borderTop:'4px solid #1d4ed8',
      }}>
        {/* Search Input */}
        <div style={{
          display:'flex', alignItems:'center', gap:'0.75rem',
          padding:'1rem 1.25rem', borderBottom:'1px solid var(--border-color,#e2e8f0)',
        }}>
          <span style={{ fontSize:'1.3rem' }}>🔍</span>
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={query}
            onChange={e => doSearch(e.target.value)}
            placeholder={t('Search drivers, vehicles, routes...', 'ڈرائیور، گاڑی، روٹ تلاش کریں...')}
            style={{
              flex:1, border:'none', outline:'none', fontSize:'1.1rem',
              color:'var(--text-main,#0f172a)', background:'transparent',
            }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults(null); inputRef.current?.focus(); }}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem', color:'#94a3b8' }}>
              ✕
            </button>
          )}
          <kbd style={{
            background:'#f1f5f9', padding:'0.2rem 0.5rem', borderRadius:'0.3rem',
            fontSize:'0.75rem', color:'#64748b', border:'1px solid #e2e8f0',
          }}>ESC</kbd>
        </div>

        <div style={{ maxHeight:'460px', overflowY:'auto' }}>

          {/* Offline notice */}
          {offline && (
            <div style={{ padding:'1rem 1.25rem', background:'#fef2f2', borderBottom:'1px solid #fca5a5',
              display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.85rem', color:'#b91c1c' }}>
              🔴 {t('Backend server is offline. Start python app.py to enable live search.', 'سرور آف لائن ہے۔ python app.py چلائیں۔')}
            </div>
          )}

          {/* Idle prompt */}
          {!results && !offline && (
            <div style={{ padding:'2rem', textAlign:'center', color:'var(--text-muted,#64748b)' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>🚛</div>
              <p>{t('Type at least 2 characters to search', 'تلاش کے لیے کم از کم 2 حروف لکھیں')}</p>
              {(allDrivers.length > 0 || allVehicles.length > 0) && (
                <p style={{ fontSize:'0.8rem', marginTop:'0.5rem', color:'#10b981' }}>
                  ✅ {t(`${allDrivers.length} drivers, ${allVehicles.length} vehicles loaded`, `${allDrivers.length} ڈرائیور، ${allVehicles.length} گاڑیاں لوڈ`)}
                </p>
              )}
            </div>
          )}

          {/* No results */}
          {results && results.total === 0 && (
            <div style={{ padding:'2rem', textAlign:'center', color:'var(--text-muted,#64748b)' }}>
              <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>😕</div>
              <p>{t('No results for', 'کوئی نتیجہ نہیں ملا')} "<strong>{query}</strong>"</p>
            </div>
          )}

          {/* ── Driver Results ── */}
          {results?.drivers?.length > 0 && (
            <div>
              <div style={{
                padding:'0.5rem 1.25rem', background:'#f8fafc',
                fontSize:'0.72rem', fontWeight:'700', color:'var(--text-muted,#64748b)',
                letterSpacing:'0.06em', borderBottom:'1px solid #f1f5f9',
              }}>
                👤 {t('DRIVERS', 'ڈرائیورز')} ({results.drivers.length})
              </div>
              {results.drivers.map(d => {
                const s = STATUS_BADGE[d.status] || STATUS_BADGE.available;
                const initials = (d.name || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
                return (
                  <div key={d.id} style={{
                    display:'flex', alignItems:'center', gap:'1rem',
                    padding:'0.85rem 1.25rem', borderBottom:'1px solid #f8fafc',
                    cursor:'default', transition:'background 0.1s',
                  }}
                    onMouseOver={e => e.currentTarget.style.background='#f8fafc'}
                    onMouseOut={e  => e.currentTarget.style.background=''}
                  >
                    <div style={{
                      width:'40px', height:'40px', borderRadius:'50%', flexShrink:0,
                      background:'linear-gradient(135deg,#1e3a8a,#3b82f6)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color:'white', fontWeight:'800', fontSize:'0.9rem',
                    }}>
                      {initials}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:'700', fontSize:'0.95rem' }}>{d.name}</div>
                      <div style={{ fontSize:'0.79rem', color:'var(--text-muted,#64748b)', marginTop:'0.15rem' }}>
                        {d.phone && <><bdi>{d.phone}</bdi> &nbsp;|&nbsp;</>}
                        {d.cnic  && <>🪪 <bdi>{d.cnic}</bdi></>}
                      </div>
                    </div>
                    <span style={{
                      background:s.bg, color:s.color,
                      padding:'0.2rem 0.65rem', borderRadius:'9999px',
                      fontSize:'0.72rem', fontWeight:'700', flexShrink:0,
                    }}>
                      {s.dot} {lang === 'ur'
                        ? ({ on_trip:'سفر میں', available:'دستیاب', completed:'مکمل', off_duty:'چھٹی' }[d.status] || s.label)
                        : s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Vehicle Results ── */}
          {results?.vehicles?.length > 0 && (
            <div>
              <div style={{
                padding:'0.5rem 1.25rem', background:'#f8fafc',
                fontSize:'0.72rem', fontWeight:'700', color:'var(--text-muted,#64748b)',
                letterSpacing:'0.06em', borderBottom:'1px solid #f1f5f9',
              }}>
                🚛 {t('VEHICLES', 'گاڑیاں')} ({results.vehicles.length})
              </div>
              {results.vehicles.map(v => {
                const cond = v.condition || 'good';
                const condColor = { good:'#10b981', average:'#f59e0b', poor:'#ef4444' };
                return (
                  <div key={v.id} style={{
                    display:'flex', alignItems:'center', gap:'1rem',
                    padding:'0.85rem 1.25rem', borderBottom:'1px solid #f8fafc',
                    cursor:'default', transition:'background 0.1s',
                  }}
                    onMouseOver={e => e.currentTarget.style.background='#f8fafc'}
                    onMouseOut={e  => e.currentTarget.style.background=''}
                  >
                    <div style={{
                      width:'40px', height:'40px', borderRadius:'50%', flexShrink:0,
                      background:'#eff6ff', display:'flex', alignItems:'center',
                      justifyContent:'center', fontSize:'1.3rem',
                    }}>🚛</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:'800', color:'#1d4ed8', letterSpacing:'1px', fontSize:'0.95rem' }}>
                        <bdi>{v.number_plate}</bdi>
                      </div>
                      <div style={{ fontSize:'0.79rem', color:'var(--text-muted,#64748b)', marginTop:'0.15rem' }}>
                        {v.model && <>{v.model} &nbsp;|&nbsp;</>}
                        {v.owner_name && <>👤 {v.owner_name}</>}
                      </div>
                    </div>
                    <span style={{
                      background:`${condColor[cond]}22`, color:condColor[cond],
                      border:`1px solid ${condColor[cond]}44`,
                      padding:'0.2rem 0.65rem', borderRadius:'9999px',
                      fontSize:'0.72rem', fontWeight:'700', flexShrink:0,
                    }}>
                      {cond === 'good' ? '✅ Good' : cond === 'average' ? '⚠️ Avg' : '❌ Poor'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Recent Trip Results ── */}
          {results?.trips?.length > 0 && (
            <div>
              <div style={{
                padding:'0.5rem 1.25rem', background:'#f8fafc',
                fontSize:'0.72rem', fontWeight:'700', color:'var(--text-muted,#64748b)',
                letterSpacing:'0.06em', borderBottom:'1px solid #f1f5f9',
              }}>
                🚚 {t('TRIPS', 'ٹرپس')} ({results.trips.length})
              </div>
              {results.trips.map(tr => (
                <div key={tr.id} style={{
                  display:'flex', alignItems:'center', gap:'1rem',
                  padding:'0.85rem 1.25rem', borderBottom:'1px solid #f8fafc',
                  cursor:'default', transition:'background 0.1s',
                }}
                  onMouseOver={e => e.currentTarget.style.background='#f8fafc'}
                  onMouseOut={e  => e.currentTarget.style.background=''}
                >
                  <div style={{
                    width:'40px', height:'40px', borderRadius:'50%', flexShrink:0,
                    background:'#f0fdf4', display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:'1.3rem',
                  }}>🚚</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:'700', fontSize:'0.9rem' }}>
                      {tr.driver_name} &nbsp;
                      <span style={{ color:'#1d4ed8', fontWeight:'800', letterSpacing:'0.05em' }}>
                        <bdi>{tr.vehicle_number || ''}</bdi>
                      </span>
                    </div>
                    <div style={{ fontSize:'0.79rem', color:'var(--text-muted,#64748b)', marginTop:'0.15rem' }}>
                      <span style={{ color:'#10b981' }}>{tr.from_city}</span>
                      {' → '}
                      <span style={{ color:'#ef4444' }}>{tr.to_city}</span>
                      &nbsp;|&nbsp; {tr.trip_date}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:'0.82rem', fontWeight:'700', color:'#10b981' }}>
                      Rs {Number(tr.freight_amount || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted,#64748b)' }}>freight</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding:'0.6rem 1.25rem', background:'#f8fafc',
          borderTop:'1px solid var(--border-color,#e2e8f0)',
          display:'flex', gap:'1.5rem', fontSize:'0.72rem',
          color:'var(--text-muted,#64748b)',
        }}>
          <span>ESC {t('to close', 'بند کریں')}</span>
          {results && <span>💡 {results.total} {t('results', 'نتائج')}</span>}
        </div>
      </div>
    </div>
  );
}

export default GlobalSearch;
