import React, { useState, useEffect } from 'react';
import { API_BASE } from '../api';

const STATUS_COLORS = {
  completed:  { bg:'#f0fdf4', color:'#16a34a', dot:'🟢' },
  on_trip:    { bg:'#fffbeb', color:'#f59e0b', dot:'🟡' },
  available:  { bg:'#eff6ff', color:'#1d4ed8', dot:'🔵' },
  cancelled:  { bg:'#fef2f2', color:'#ef4444', dot:'🔴' },
};

function VehicleHistory({ lang, t }) {
  const [searchPlate,  setSearchPlate]  = useState('');
  const [searchDriver, setSearchDriver] = useState('');
  const [fromDate,     setFromDate]     = useState('');
  const [toDate,       setToDate]       = useState('');
  const [results,      setResults]      = useState([]);
  const [searched,     setSearched]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [offline,      setOffline]      = useState(false);
  const [vehicles,     setVehicles]     = useState([]); // for quick-select chips

  // Load registered vehicle plates for quick-select
  useEffect(() => {
    fetch(`${API_BASE}/vehicles`)
      .then(r => r.json())
      .then(d => setVehicles(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setOffline(false);
    setSearched(true);
    try {
      // Build query: if plate provided, use vehicle history endpoint; else fetch all trips and filter
      let url;
      if (searchPlate.trim()) {
        url = `${API_BASE}/vehicles/${encodeURIComponent(searchPlate.trim())}/history`;
      } else {
        url = `${API_BASE}/trips`;
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) throw new Error('bad');
      let data = await res.json();

      // Apply additional client-side filters
      if (searchDriver.trim()) {
        const dq = searchDriver.toLowerCase();
        data = data.filter(r => (r.driver_name || '').toLowerCase().includes(dq));
      }
      if (fromDate) {
        data = data.filter(r => (r.trip_date || r.date || '') >= fromDate);
      }
      if (toDate) {
        data = data.filter(r => (r.trip_date || r.date || '') <= toDate);
      }

      setResults(data);
    } catch (err) {
      setOffline(true);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchPlate('');
    setSearchDriver('');
    setFromDate('');
    setToDate('');
    setResults([]);
    setSearched(false);
    setOffline(false);
  };

  const totalFreight    = results.reduce((s, r) => s + Number(r.freight_amount    || r.freight    || 0), 0);
  const totalCommission = results.reduce((s, r) => s + Number(r.commission_amount || r.commission || 0), 0);

  return (
    <>
      <header className="header">
        <div>
          <h1 className={lang === 'ur' ? 'ur-text' : ''}>{t('Vehicle History', 'گاڑی کا ریکارڈ')}</h1>
          <p className={lang === 'ur' ? 'ur-text' : ''} style={{ color: 'var(--text-muted)' }}>
            {t('Search live trip history by vehicle plate, driver or date range', 'نمبر پلیٹ، ڈرائیور یا تاریخ سے ریکارڈ تلاش کریں')}
          </p>
        </div>
      </header>

      {/* Search Panel */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <h2 className={`section-title ${lang === 'ur' ? 'ur-text' : ''}`} style={{ marginBottom:'1.25rem' }}>
          {t('🔍 Search History', '🔍 ریکارڈ تلاش کریں')}
        </h2>
        <div className="form-grid">
          <div className="form-group">
            <label className={lang==='ur'?'ur-text':''}>🚛 {t('Vehicle Number Plate', 'گاڑی نمبر پلیٹ')}</label>
            <input
              type="text" className="form-input" placeholder="e.g. LES-1234"
              value={searchPlate}
              onChange={e => setSearchPlate(e.target.value.toUpperCase())}
              style={{ textTransform:'uppercase', fontWeight:'600', letterSpacing:'1px' }}
            />
          </div>
          <div className="form-group">
            <label className={lang==='ur'?'ur-text':''}>👨 {t('Driver Name', 'ڈرائیور کا نام')}</label>
            <input
              type="text" className="form-input"
              placeholder={t('e.g. Ali Raza', 'مثلاً: علی رضا')}
              value={searchDriver}
              onChange={e => setSearchDriver(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className={lang==='ur'?'ur-text':''}>📅 {t('From Date', 'تاریخ سے')}</label>
            <input type="date" className="form-input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className={lang==='ur'?'ur-text':''}>📅 {t('To Date', 'تاریخ تک')}</label>
            <input type="date" className="form-input" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
        </div>
        <div style={{ display:'flex', gap:'1rem', marginTop:'1.25rem' }}>
          <button className="primary-btn" onClick={handleSearch} disabled={loading}>
            {loading ? '⏳ ...' : `🔍 ${t('Search Records', 'تلاش کریں')}`}
          </button>
          <button className="secondary-btn" onClick={handleClear}>
            🔄 {t('Clear All', 'صاف کریں')}
          </button>
        </div>
      </div>

      {/* Quick Plates from registered vehicles */}
      {!searched && vehicles.length > 0 && (
        <div className="glass-panel" style={{ marginBottom:'1.5rem' }}>
          <h3 className={`section-title ${lang==='ur'?'ur-text':''}`} style={{ marginBottom:'1rem' }}>
            {t('🚛 Quick Search by Vehicle', '🚛 گاڑی سے فوری تلاش')}
          </h3>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'0.75rem' }}>
            {vehicles.map(v => (
              <button
                key={v.id} onClick={() => setSearchPlate(v.number_plate)}
                style={{
                  background: searchPlate === v.number_plate ? '#1d4ed8' : '#eff6ff',
                  color:      searchPlate === v.number_plate ? 'white'   : '#1d4ed8',
                  border:'1.5px solid #bfdbfe', padding:'0.5rem 1.25rem',
                  borderRadius:'0.5rem', fontWeight:'700', cursor:'pointer',
                  letterSpacing:'1px', transition:'all 0.2s', fontSize:'1rem',
                }}
              >
                🚛 {v.number_plate}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Offline banner */}
      {offline && (
        <div style={{
          background:'#fef2f2', border:'1px solid #fca5a5', borderLeft:'4px solid #ef4444',
          padding:'1.25rem 1.5rem', borderRadius:'0.75rem', marginBottom:'1.5rem',
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap'
        }}>
          <div style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
            <span style={{fontSize:'1.5rem'}}>🔴</span>
            <div>
              <div style={{fontWeight:'700', color:'#ef4444'}}>{t('Cannot reach backend server', 'سرور سے رابطہ ممکن نہیں')}</div>
              <div style={{fontSize:'0.82rem', color:'#b91c1c'}}>{t('Run: python app.py — then retry', 'چلائیں: python app.py — پھر دوبارہ')}</div>
            </div>
          </div>
          <button onClick={handleSearch} style={{padding:'0.5rem 1.25rem', background:'#ef4444', color:'white', border:'none', borderRadius:'0.5rem', fontWeight:'700', cursor:'pointer'}}>
            🔄 {t('Retry', 'دوبارہ')}
          </button>
        </div>
      )}

      {/* Results */}
      {searched && !offline && (
        <div className="glass-panel">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:'1rem' }}>
            <h2 className={`section-title ${lang==='ur'?'ur-text':''}`} style={{ marginBottom:0 }}>
              {t('📋 Search Results', '📋 تلاش کا نتیجہ')}
              <span className="count-badge">{results.length}</span>
            </h2>
            {searchPlate && (
              <div style={{ background:'#1d4ed8', color:'white', padding:'0.4rem 1rem', borderRadius:'0.5rem', fontWeight:'700', letterSpacing:'1px' }}>
                🚛 {searchPlate}
              </div>
            )}
          </div>

          {results.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔍</div>
              <p>{t('No records found. Try different search terms.', 'کوئی ریکارڈ نہیں ملا۔ مختلف الفاظ سے تلاش کریں۔')}</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('Date','تاریخ')}</th>
                      <th>{t('Vehicle','گاڑی')}</th>
                      <th>{t('Driver','ڈرائیور')}</th>
                      <th>{t('Route','روٹ')}</th>
                      <th>{t('Freight','کرایہ')}</th>
                      <th>{t('Commission','کمیشن')}</th>
                      <th>{t('Status','سٹیٹس')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(r => {
                      const s = STATUS_COLORS[r.status] || STATUS_COLORS.available;
                      const date   = r.trip_date || r.date || '—';
                      const plate  = r.vehicle_number || r.vehicle || '—';
                      const driver = r.driver_name || r.driver || '—';
                      const from   = r.from_city  || r.from   || '—';
                      const to     = r.to_city    || r.to     || '—';
                      const freight    = Number(r.freight_amount    || r.freight    || 0);
                      const commission = Number(r.commission_amount || r.commission || 0);
                      return (
                        <tr key={r.id}>
                          <td style={{ fontWeight:'600', color:'var(--text-muted)' }}>{date}</td>
                          <td><strong style={{ color:'#1d4ed8', letterSpacing:'1px' }}><bdi>{plate}</bdi></strong></td>
                          <td>{driver}</td>
                          <td>
                            <div style={{ display:'flex', alignItems:'center', gap:'0.3rem', fontSize:'0.9rem' }}>
                              <span style={{ color:'#10b981' }}>{from}</span>
                              <span style={{ color:'#94a3b8' }}>→</span>
                              <span style={{ color:'#ef4444' }}>{to}</span>
                            </div>
                          </td>
                          <td style={{ fontWeight:'600' }}>Rs {freight.toLocaleString()}</td>
                          <td style={{ fontWeight:'700', color:'#16a34a' }}>Rs {commission.toLocaleString()}</td>
                          <td>
                            <span style={{
                              background:s.bg, color:s.color,
                              padding:'0.3rem 0.75rem', borderRadius:'9999px',
                              fontSize:'0.8rem', fontWeight:'700'
                            }}>
                              {s.dot} {(r.status || 'unknown').replace('_',' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="trip-summary">
                <div className="summary-box">
                  <span>{t('Total Trips','کل ٹرپس')}</span>
                  <strong>{results.length}</strong>
                </div>
                <div className="summary-box">
                  <span>{t('Total Freight','کل کرایہ')}</span>
                  <strong>Rs {totalFreight.toLocaleString()}</strong>
                </div>
                <div className="summary-box">
                  <span>{t('Total Commission','کل کمیشن')}</span>
                  <strong style={{ color:'#ef4444' }}>Rs {totalCommission.toLocaleString()}</strong>
                </div>
                <div className="summary-box">
                  <span>{t('Net','خالص')}</span>
                  <strong style={{ color:'#1d4ed8' }}>Rs {(totalFreight - totalCommission).toLocaleString()}</strong>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default VehicleHistory;
