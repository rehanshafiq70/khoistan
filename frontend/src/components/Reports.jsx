import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../api';

const STATUS_STYLE = {
  completed: { color:'#16a34a', bg:'#f0fdf4', dot:'🟢' },
  on_trip:   { color:'#f59e0b', bg:'#fffbeb', dot:'🟡' },
  available: { color:'#1d4ed8', bg:'#eff6ff', dot:'🔵' },
  cancelled: { color:'#ef4444', bg:'#fef2f2', dot:'🔴' },
};

function ServerOfflineBanner({ onRetry, t }) {
  return (
    <div style={{
      background:'#fef2f2', border:'1px solid #fca5a5', borderLeft:'4px solid #ef4444',
      padding:'1.25rem 1.5rem', borderRadius:'0.75rem', marginBottom:'1.5rem',
      display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap'
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
        <span style={{ fontSize:'1.5rem' }}>🔴</span>
        <div>
          <div style={{ fontWeight:'700', color:'#ef4444', marginBottom:'0.2rem' }}>
            {t('Cannot reach backend server','بیک اینڈ سرور تک رسائی ممکن نہیں')}
          </div>
          <div style={{ fontSize:'0.82rem', color:'#b91c1c' }}>
            {t('Make sure the Flask server is running: python app.py','یقینی بنائیں کہ Flask سرور چل رہا ہے: python app.py')}
          </div>
        </div>
      </div>
      <button
        onClick={onRetry}
        style={{ padding:'0.5rem 1.25rem', background:'#ef4444', color:'white', border:'none',
          borderRadius:'0.5rem', fontWeight:'700', cursor:'pointer', fontSize:'0.88rem' }}
      >
        🔄 {t('Retry','دوبارہ کوشش')}
      </button>
    </div>
  );
}

function Reports({ lang, t }) {
  const [period, setPeriod]         = useState('daily');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);   // 'offline' | 'error' | null

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = period === 'daily'
        ? `${API_BASE}/reports/daily?date=${reportDate}`
        : `${API_BASE}/reports/summary?period=${period}`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setData(null);
      if (err.name === 'AbortError' || err.message === 'Failed to fetch' || err.message === 'Load failed') {
        setError('offline');
      } else {
        setError(err.message || 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [period, reportDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const printReport = () => window.print();

  const exportCSV = () => {
    if (!data?.trips?.length) return;
    const headers = ['Driver,Vehicle,From,To,Freight,Commission,Status'];
    const rows = data.trips.map(tr =>
      `${tr.driver_name},${tr.vehicle_number},${tr.from_city},${tr.to_city},${tr.freight_amount},${tr.commission_amount},${tr.status}`
    );
    const csv = [...headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `KKGT_Report_${reportDate}.csv`;
    a.click();
  };

  return (
    <>
      {/* Header */}
      <header className="header" style={{ flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 className={lang==='ur'?'ur-text':''}>{t('Reports', 'رپورٹس')}</h1>
          <p className={lang==='ur'?'ur-text':''} style={{ color:'var(--text-muted)' }}>
            {t('Daily, Weekly & Monthly Transport Reports', 'روزانہ، ہفتہ وار اور ماہانہ رپورٹ')}
          </p>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
          <button className="secondary-btn" onClick={printReport}>🖨️ {t('Print','پرنٹ')}</button>
          {period === 'daily' && data?.trips?.length > 0 && (
            <button className="primary-btn" style={{ background:'#16a34a' }} onClick={exportCSV}>
              📊 {t('Export CSV','CSV محفوظ')}
            </button>
          )}
        </div>
      </header>

      {/* Period Switcher */}
      <div className="glass-panel" style={{ marginBottom:'1.5rem', padding:'1.25rem' }}>
        <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'center' }}>
          {[
            { key:'daily',   label:t('📅 Daily','📅 روزانہ') },
            { key:'weekly',  label:t('📆 Weekly','📆 ہفتہ وار') },
            { key:'monthly', label:t('🗓️ Monthly','🗓️ ماہانہ') },
          ].map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)} style={{
              padding:'0.6rem 1.5rem', borderRadius:'0.5rem', border:'1.5px solid',
              fontWeight:'700', cursor:'pointer', transition:'all 0.2s',
              background: period === p.key ? '#1d4ed8' : 'white',
              color:       period === p.key ? 'white'   : 'var(--text-muted)',
              borderColor: period === p.key ? '#1d4ed8' : 'var(--border-color)',
            }}>
              {p.label}
            </button>
          ))}

          {period === 'daily' && (
            <input type="date" className="form-input" style={{ maxWidth:'180px' }}
              value={reportDate} onChange={e => setReportDate(e.target.value)} />
          )}

          <button className="primary-btn" onClick={fetchReport} disabled={loading}
            style={{ marginLeft:'auto' }}>
            {loading ? '⏳ ...' : `🔄 ${t('Refresh','تازہ کریں')}`}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'2.5rem', animation:'spin 1s linear infinite', display:'inline-block' }}>⚙️</div>
          <p style={{ marginTop:'0.75rem' }}>{t('Loading report...','رپورٹ لوڈ ہو رہی ہے...')}</p>
        </div>
      )}

      {/* Server offline banner */}
      {!loading && error === 'offline' && (
        <ServerOfflineBanner onRetry={fetchReport} t={t} />
      )}

      {/* Other error */}
      {!loading && error && error !== 'offline' && (
        <div style={{
          background:'#fef3c7', border:'1px solid #fde68a', borderLeft:'4px solid #f59e0b',
          padding:'1rem 1.5rem', borderRadius:'0.75rem', marginBottom:'1.5rem', display:'flex',
          alignItems:'center', gap:'0.75rem'
        }}>
          <span style={{ fontSize:'1.4rem' }}>⚠️</span>
          <span style={{ fontWeight:'600', color:'#92400e' }}>{t('Error loading report:','رپورٹ لوڈ میں خرابی:')} {error}</span>
          <button onClick={fetchReport} style={{ marginLeft:'auto', padding:'0.4rem 1rem',
            background:'#f59e0b', color:'white', border:'none', borderRadius:'0.4rem',
            fontWeight:'600', cursor:'pointer' }}>
            🔄 {t('Retry','دوبارہ')}
          </button>
        </div>
      )}

      {/* Summary Cards */}
      {!loading && !error && data && (
        <>
          <div className="stats-grid" style={{ marginBottom:'1.5rem' }}>
            <div className="stat-card blue">
              <div className="stat-title">{t('Total Trips','کل ٹرپس')} 🚚</div>
              <div className="stat-value">{data.total_trips ?? 0}</div>
            </div>
            <div className="stat-card green">
              <div className="stat-title">{t('Total Freight','کل کرایہ')} 💵</div>
              <div className="stat-value" style={{ fontSize:'1.6rem' }}>
                Rs {(data.total_freight ?? 0).toLocaleString()}
              </div>
            </div>
            <div className="stat-card" style={{ borderTop:'4px solid #ef4444' }}>
              <div className="stat-title">{t('Commission','کمیشن')} 💰</div>
              <div className="stat-value" style={{ fontSize:'1.6rem', color:'#ef4444' }}>
                Rs {(data.total_commission ?? 0).toLocaleString()}
              </div>
            </div>
            <div className="stat-card" style={{ borderTop:'4px solid #10b981' }}>
              <div className="stat-title">{t('Net Income','خالص آمدنی')} 📈</div>
              <div className="stat-value" style={{ fontSize:'1.6rem', color:'#10b981' }}>
                Rs {(data.net ?? 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Pending commission alert */}
          {(data.pending_commission ?? 0) > 0 && (
            <div style={{
              background:'#fef2f2', border:'1px solid #fca5a5', borderLeft:'4px solid #ef4444',
              padding:'1rem 1.5rem', borderRadius:'0.75rem', marginBottom:'1.5rem',
              display:'flex', alignItems:'center', gap:'1rem'
            }}>
              <span style={{ fontSize:'1.5rem' }}>🔴</span>
              <span className={lang==='ur'?'ur-text':''}>
                <strong>{t('Pending Commission:','بقایا کمیشن:')} </strong>
                Rs {data.pending_commission.toLocaleString()}
                {' — '}{t('needs to be paid to drivers','ڈرائیوروں کو ادا کرنا باقی')}
              </span>
            </div>
          )}

          {/* Daily trip details table */}
          {period === 'daily' && (
            <div className="glass-panel" id="print-area">
              <h2 className={`section-title ${lang==='ur'?'ur-text':''}`} style={{ marginBottom:'1.25rem' }}>
                {t('Trip Details','ٹرپ تفصیل')} — {data.date ?? reportDate}
                <span className="count-badge">{data.trips?.length ?? 0}</span>
              </h2>

              {!data.trips?.length ? (
                <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
                  <div style={{ fontSize:'3.5rem', opacity:0.2, marginBottom:'1rem' }}>🚚</div>
                  <p style={{ fontWeight:'600' }}>{t('No trips found for this date.','اس تاریخ کا کوئی ٹرپ نہیں۔')}</p>
                  <p style={{ fontSize:'0.85rem', marginTop:'0.3rem' }}>
                    {t('Go to Daily Trips to add trips.','ٹرپ شامل کرنے کے لیے Daily Trips پر جائیں۔')}
                  </p>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>{t('Driver','ڈرائیور')}</th>
                          <th>{t('Vehicle','گاڑی')}</th>
                          <th>{t('Route','روٹ')}</th>
                          <th>{t('Freight','کرایہ')}</th>
                          <th>{t('Commission','کمیشن')}</th>
                          <th>{t('Status','سٹیٹس')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.trips.map(trip => {
                          const s = STATUS_STYLE[trip.status] || STATUS_STYLE.available;
                          return (
                            <tr key={trip.id}>
                              <td style={{ fontWeight:'600' }}>{trip.driver_name}</td>
                              <td><strong style={{ color:'#1d4ed8' }}><bdi>{trip.vehicle_number || '—'}</bdi></strong></td>
                              <td style={{ fontSize:'0.9rem' }}>
                                <span style={{ color:'#10b981' }}>{trip.from_city}</span>
                                <span style={{ color:'#94a3b8', margin:'0 0.3rem' }}>→</span>
                                <span style={{ color:'#ef4444' }}>{trip.to_city}</span>
                              </td>
                              <td style={{ fontWeight:'600' }}>Rs {Number(trip.freight_amount).toLocaleString()}</td>
                              <td style={{ fontWeight:'700', color:'#ef4444' }}>Rs {Number(trip.commission_amount).toLocaleString()}</td>
                              <td>
                                <span style={{ background:s.bg, color:s.color, padding:'0.3rem 0.75rem',
                                  borderRadius:'9999px', fontSize:'0.8rem', fontWeight:'700' }}>
                                  {s.dot} {trip.status.replace('_',' ')}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="trip-summary">
                    <div className="summary-box">
                      <span>{t('Trips','ٹرپس')}</span>
                      <strong>{data.trips.length}</strong>
                    </div>
                    <div className="summary-box">
                      <span>{t('Freight','کرایہ')}</span>
                      <strong>Rs {data.trips.reduce((s,tr)=>s+Number(tr.freight_amount),0).toLocaleString()}</strong>
                    </div>
                    <div className="summary-box">
                      <span>{t('Commission','کمیشن')}</span>
                      <strong style={{ color:'#ef4444' }}>Rs {data.trips.reduce((s,tr)=>s+Number(tr.commission_amount),0).toLocaleString()}</strong>
                    </div>
                    <div className="summary-box">
                      <span>{t('Net','خالص')}</span>
                      <strong style={{ color:'#10b981' }}>
                        Rs {data.trips.reduce((s,tr)=>s+Number(tr.freight_amount)-Number(tr.commission_amount),0).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* No data + no error = genuinely empty */}
      {!loading && !error && data && data.total_trips === 0 && period !== 'daily' && (
        <div className="glass-panel" style={{ textAlign:'center', padding:'3rem' }}>
          <div style={{ fontSize:'3.5rem', opacity:0.2, marginBottom:'1rem' }}>📊</div>
          <p style={{ fontWeight:'600', color:'var(--text-muted)' }}>
            {t('No trip data for this period.','اس مدت کا کوئی ڈیٹا نہیں۔')}
          </p>
        </div>
      )}

      <style>{`
        @media print {
          .sidebar, .header button, .secondary-btn, .primary-btn { display: none !important; }
          .main-content { padding: 0 !important; }
          .glass-panel { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

export default Reports;
