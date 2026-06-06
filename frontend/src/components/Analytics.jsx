import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../api';

// ── Pure CSS chart components ───────────────────────────────────────────────

function BarChart({ data, valueKey, labelKey, color = '#1d4ed8', height = 160, formatValue }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:'6px', height:`${height}px`, padding:'0 4px' }}>
      {data.map((d, i) => {
        const pct = (d[valueKey] / max) * 100;
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', height:'100%', justifyContent:'flex-end' }}>
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:'600', textAlign:'center' }}>
              {formatValue ? formatValue(d[valueKey]) : d[valueKey]}
            </div>
            <div
              style={{
                width:'100%', background:color, borderRadius:'4px 4px 0 0',
                height:`${pct}%`, minHeight: pct > 0 ? '4px' : '0',
                transition:'height 0.6s ease', opacity:0.85, cursor:'pointer',
              }}
              onMouseOver={e => { e.currentTarget.style.opacity='1'; }}
              onMouseOut={e  => { e.currentTarget.style.opacity='0.85'; }}
              title={`${d[labelKey]}: ${d[valueKey]}`}
            />
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', textAlign:'center', whiteSpace:'nowrap' }}>
              {d[labelKey]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.trips, 0) || 1;
  let offset = 0;
  const r = 54, cx = 70, cy = 70, circumference = 2 * Math.PI * r;

  return (
    <div style={{ display:'flex', alignItems:'center', gap:'1.5rem', flexWrap:'wrap' }}>
      <svg width="140" height="140" style={{ flexShrink:0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-color)" strokeWidth="16" />
        {data.map((d, i) => {
          const len = (d.trips / total) * circumference;
          const dash = `${len} ${circumference - len}`;
          const seg = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={d.color} strokeWidth="16"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              style={{ transition:'stroke-dashoffset 0.5s ease', transform:'rotate(-90deg)', transformOrigin:'center' }}
            />
          );
          offset += len;
          return seg;
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize:'18px', fontWeight:'800', fill:'var(--text-main)' }}>{total === 1 && data.length === 0 ? 0 : data.reduce((s,d)=>s+d.trips,0)}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize:'10px', fill:'var(--text-muted)' }}>Trips</text>
      </svg>
      <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
        {data.slice(0,6).map((d, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <div style={{ width:'10px', height:'10px', borderRadius:'2px', background:d.color, flexShrink:0 }}/>
            <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{d.name}</span>
            <span style={{ fontSize:'0.78rem', fontWeight:'700', color:'var(--text-main)', marginLeft:'auto' }}>{d.trips}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────

function EmptyAnalytics({ t }) {
  return (
    <div className="glass-panel" style={{ textAlign:'center', padding:'4rem 2rem', borderLeft:'4px solid #f59e0b' }}>
      <div style={{ fontSize:'4rem', marginBottom:'1rem', opacity:0.4 }}>📊</div>
      <h3 style={{ fontSize:'1.2rem', fontWeight:'800', marginBottom:'0.75rem' }}>
        {t('No data yet','ابھی کوئی ڈیٹا نہیں')}
      </h3>
      <p style={{ color:'var(--text-muted)', maxWidth:'360px', margin:'0 auto', lineHeight:1.7 }}>
        {t(
          'Analytics will populate automatically as you add trips, drivers, and routes.',
          'جیسے جیسے آپ ٹرپس، ڈرائیور اور روٹ شامل کریں گے، تجزیہ خود بخود ظاہر ہو گا۔'
        )}
      </p>
    </div>
  );
}

// ── Server offline banner ───────────────────────────────────────────────────

function OfflineBanner({ onRetry, t }) {
  return (
    <div style={{
      background:'#fef2f2', border:'1px solid #fca5a5', borderLeft:'4px solid #ef4444',
      padding:'1.25rem 1.5rem', borderRadius:'0.75rem', marginBottom:'1.5rem',
      display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
        <span style={{ fontSize:'1.5rem' }}>🔴</span>
        <div>
          <div style={{ fontWeight:'700', color:'#ef4444', marginBottom:'0.2rem' }}>
            {t('Cannot reach backend server','بیک اینڈ سرور تک رسائی ممکن نہیں')}
          </div>
          <div style={{ fontSize:'0.82rem', color:'#b91c1c' }}>
            {t('Run: python app.py — then retry','چلائیں: python app.py — پھر دوبارہ کوشش کریں')}
          </div>
        </div>
      </div>
      <button onClick={onRetry} style={{
        padding:'0.5rem 1.25rem', background:'#ef4444', color:'white', border:'none',
        borderRadius:'0.5rem', fontWeight:'700', cursor:'pointer', fontSize:'0.88rem',
      }}>
        🔄 {t('Retry','دوبارہ')}
      </button>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

function Analytics({ lang, t }) {
  const [period,  setPeriod]  = useState('monthly');
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);

  const fmt = (n) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : String(n);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setOffline(false);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_BASE}/analytics?period=${period}`, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setOffline(false);
    } catch (err) {
      setOffline(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const kpi          = data?.kpi          || {};
  const monthlyData  = data?.monthly_data || [];
  const routeData    = data?.route_data   || [];
  const vehicleData  = data?.vehicle_data || [];
  const hasData      = (kpi.total_trips   || 0) > 0;

  return (
    <>
      <header className="header">
        <div>
          <h1 className={lang==='ur'?'ur-text':''}>{t('Analytics & Statistics','تجزیہ اور اعداد و شمار')}</h1>
          <p style={{ color:'var(--text-muted)' }}>{t('Live performance overview — updated from database','لائیو کارکردگی کا جائزہ — ڈیٹا بیس سے اپ ڈیٹ')}</p>
        </div>
        <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
          {['monthly','weekly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding:'0.5rem 1rem', borderRadius:'0.5rem', border:'1.5px solid',
              fontWeight:'600', cursor:'pointer', fontSize:'0.85rem',
              background:    period===p ? '#1d4ed8' : 'white',
              color:         period===p ? 'white'   : 'var(--text-muted)',
              borderColor:   period===p ? '#1d4ed8' : 'var(--border-color)',
            }}>
              {p==='monthly' ? t('Monthly','ماہانہ') : t('Weekly','ہفتہ وار')}
            </button>
          ))}
          <button onClick={fetchAnalytics} disabled={loading} style={{
            padding:'0.5rem 1rem', borderRadius:'0.5rem', border:'1.5px solid #1d4ed8',
            background:'white', color:'#1d4ed8', fontWeight:'700', cursor:'pointer', fontSize:'0.85rem',
          }}>
            {loading ? '⏳' : '🔄'}
          </button>
        </div>
      </header>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'2.5rem', animation:'spin 1s linear infinite', display:'inline-block' }}>⚙️</div>
          <p style={{ marginTop:'0.75rem' }}>{t('Loading analytics...','تجزیہ لوڈ ہو رہا ہے...')}</p>
        </div>
      )}

      {/* Server offline */}
      {!loading && offline && <OfflineBanner onRetry={fetchAnalytics} t={t} />}

      {/* No data yet */}
      {!loading && !offline && data && !hasData && <EmptyAnalytics t={t} />}

      {/* Full analytics */}
      {!loading && !offline && data && hasData && (
        <>
          {/* KPI Cards */}
          <div className="stats-grid" style={{ marginBottom:'1.5rem' }}>
            {[
              { label:t('Total Trips','کل ٹرپس'),           value: kpi.total_trips,                          icon:'🚚', color:'#1d4ed8' },
              { label:t('Total Revenue','کل آمدنی'),         value:`Rs ${fmt(kpi.total_revenue || 0)}`,       icon:'💵', color:'#16a34a' },
              { label:t('Commission Paid','کمیشن ادا'),      value:`Rs ${fmt(kpi.total_commission || 0)}`,    icon:'💰', color:'#ef4444' },
              { label:t('Net Income','خالص آمدنی'),          value:`Rs ${fmt(kpi.net_income || 0)}`,          icon:'📈', color:'#10b981' },
            ].map((k, i) => (
              <div key={i} className="stat-card" style={{ borderTop:`4px solid ${k.color}` }}>
                <div className="stat-title">
                  <span className={lang==='ur'?'ur-text':''}>{k.label}</span>
                  <span style={{ fontSize:'1.5rem' }}>{k.icon}</span>
                </div>
                <div className="stat-value" style={{ color:k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Revenue & Trips charts */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1.5rem' }}>
            <div className="glass-panel">
              <h3 className={`section-title ${lang==='ur'?'ur-text':''}`} style={{ marginBottom:'1.25rem' }}>
                💵 {t(period==='monthly'?'Monthly Revenue':'Weekly Revenue', period==='monthly'?'ماہانہ آمدنی':'ہفتہ وار آمدنی')}
              </h3>
              <BarChart data={monthlyData} valueKey="revenue" labelKey="month"
                color="#1d4ed8" height={150} formatValue={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${(v/1000).toFixed(0)}K`} />
            </div>
            <div className="glass-panel">
              <h3 className={`section-title ${lang==='ur'?'ur-text':''}`} style={{ marginBottom:'1.25rem' }}>
                🚚 {t(period==='monthly'?'Monthly Trips':'Weekly Trips', period==='monthly'?'ماہانہ ٹرپس':'ہفتہ وار ٹرپس')}
              </h3>
              <BarChart data={monthlyData} valueKey="trips" labelKey="month" color="#10b981" height={150} />
            </div>
          </div>

          {/* Route breakdown */}
          {routeData.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1.5rem' }}>
              <div className="glass-panel">
                <h3 className={`section-title ${lang==='ur'?'ur-text':''}`} style={{ marginBottom:'1.25rem' }}>
                  📍 {t('Trips by Route','روٹ کے مطابق ٹرپس')}
                </h3>
                <DonutChart data={routeData} />
              </div>

              <div className="glass-panel">
                <h3 className={`section-title ${lang==='ur'?'ur-text':''}`} style={{ marginBottom:'1.25rem' }}>
                  📊 {t('Revenue by Route','روٹ کے مطابق آمدنی')}
                </h3>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                  {routeData.map(r => {
                    const maxR = Math.max(...routeData.map(d => d.revenue), 1);
                    return (
                      <div key={r.name}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.25rem' }}>
                          <span style={{ fontSize:'0.82rem', fontWeight:'600', color:'var(--text-main)' }}>{r.name}</span>
                          <span style={{ fontSize:'0.82rem', fontWeight:'700', color:r.color }}>
                            Rs {r.revenue >= 1000 ? `${(r.revenue/1000).toFixed(0)}K` : r.revenue}
                          </span>
                        </div>
                        <div style={{ background:'var(--border-color)', borderRadius:'9999px', height:'10px', overflow:'hidden' }}>
                          <div style={{ width:`${(r.revenue/maxR)*100}%`, height:'100%', background:r.color, borderRadius:'9999px', transition:'width 0.7s ease' }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Top vehicles & commission trend */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
            {vehicleData.length > 0 && (
              <div className="glass-panel">
                <h3 className={`section-title ${lang==='ur'?'ur-text':''}`} style={{ marginBottom:'1.25rem' }}>
                  🚛 {t('Most Active Vehicles','سب سے زیادہ فعال گاڑیاں')}
                </h3>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                  {vehicleData.map((v, i) => (
                    <div key={v.vehicle} style={{
                      display:'flex', alignItems:'center', gap:'0.75rem',
                      padding:'0.7rem', borderRadius:'0.65rem',
                      background: i===0 ? 'linear-gradient(90deg,#eff6ff,#dbeafe)' : 'var(--bg-main)',
                      border: i===0 ? '1.5px solid #bfdbfe' : '1px solid var(--border-color)',
                    }}>
                      <div style={{ width:'28px', height:'28px', borderRadius:'50%',
                        background: i===0?'#1d4ed8':'var(--border-color)', color:'white',
                        display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'800', fontSize:'0.8rem', flexShrink:0 }}>
                        {i+1}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:'700', color:'#1d4ed8', letterSpacing:'0.05em' }}>{v.vehicle}</div>
                        <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{v.trips} {t('trips','ٹرپس')}</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontWeight:'700', color:'#ef4444', fontSize:'0.9rem' }}>
                          Rs {v.commission >= 1000 ? `${(v.commission/1000).toFixed(0)}K` : v.commission}
                        </div>
                        <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{t('commission','کمیشن')}</div>
                      </div>
                      {i===0 && <span title="Top Vehicle">🏆</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="glass-panel">
              <h3 className={`section-title ${lang==='ur'?'ur-text':''}`} style={{ marginBottom:'1.25rem' }}>
                💰 {t('Commission Trend','کمیشن رجحان')}
              </h3>
              <BarChart data={monthlyData} valueKey="commission" labelKey="month"
                color="#ef4444" height={150}
                formatValue={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
              <div className="trip-summary" style={{ marginTop:'1rem' }}>
                <div className="summary-box">
                  <span>{t('Avg Commission','اوسط کمیشن')}</span>
                  <strong style={{ color:'#ef4444' }}>
                    Rs {fmt(Math.round((kpi.total_commission || 0) / Math.max(monthlyData.length, 1)))}
                  </strong>
                </div>
                <div className="summary-box">
                  <span>{t('Net Kept','خالص')}</span>
                  <strong style={{ color:'#16a34a' }}>Rs {fmt(kpi.net_income || 0)}</strong>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

export default Analytics;
