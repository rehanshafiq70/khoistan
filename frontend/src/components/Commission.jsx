import React, { useState, useEffect } from 'react';
import { API_BASE } from '../api';
const API = API_BASE;

const STATUS_CFG = {
  pending: { label:'Pending', label_ur:'بقایا',    bg:'#fef2f2', color:'#ef4444', border:'#fca5a5', dot:'🔴' },
  partial: { label:'Partial', label_ur:'جزوی ادا', bg:'#fffbeb', color:'#f59e0b', border:'#fcd34d', dot:'🟡' },
  paid:    { label:'Paid',    label_ur:'ادا شدہ',  bg:'#f0fdf4', color:'#16a34a', border:'#86efac', dot:'🟢' },
};

function Commission({ lang, t }) {
  const [comms, setComms]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [offline, setOffline]   = useState(false);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [editId, setEditId]     = useState(null);
  const [editPaid, setEditPaid] = useState('');
  const [msg, setMsg]           = useState('');

  const loadCommissions = async () => {
    setLoading(true);
    setOffline(false);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API}/commissions`, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error('bad');
      const d = await res.json();
      setComms(Array.isArray(d) ? d : []);
    } catch {
      setOffline(true);
      setComms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCommissions(); }, []);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleSave = async (id, amount) => {
    const paid = Number(editPaid);
    try {
      const res = await fetch(`${API}/commissions/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid }),
      });
      const d = await res.json();
      if (res.ok) {
        setComms(p => p.map(c => c.id === id ? d.commission : c));
        setEditId(null);
        flash('✅ ' + t('Commission updated!', 'کمیشن اپ ڈیٹ!'));
      } else {
        flash('❌ ' + (d.error || t('Update failed', 'اپ ڈیٹ نہ ہو سکا')));
      }
    } catch {
      flash('❌ ' + t('Server offline — start python app.py', 'سرور آف — python app.py چلائیں'));
    }
  };

  const markPaid = async (id, amount) => {
    try {
      const res = await fetch(`${API}/commissions/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      });
      const d = await res.json();
      if (res.ok) setComms(p => p.map(c => c.id === id ? d.commission : c));
    } catch {}
  };

  const filtered = comms.filter(c => {
    const matchF = filter === 'all' || c.status === filter;
    const q = search.toLowerCase();
    const matchS = !q || c.driver_name?.toLowerCase().includes(q) || c.vehicle_number?.toLowerCase().includes(q);
    return matchF && matchS;
  });

  const totalPending = comms.filter(c => c.status === 'pending').reduce((s, c) => s + (c.amount || 0), 0);
  const totalPartial = comms.filter(c => c.status === 'partial').reduce((s, c) => s + ((c.amount || 0) - (c.paid || 0)), 0);
  const totalPaid    = comms.filter(c => c.status === 'paid').reduce((s, c) => s + (c.amount || 0), 0);

  return (
    <>
      <header className="header">
        <div>
          <h1>💰 {t('Commission Board', 'کمیشن بورڈ')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {comms.length} {t('commission records', 'کمیشن ریکارڈز')}
          </p>
        </div>
      </header>

      {msg && <div className={msg.startsWith('✅') ? 'alert-success' : 'alert-error'}>{msg}</div>}

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { key: 'pending', label: t('🔴 Pending', '🔴 بقایا'),    value: totalPending, color: '#ef4444', card: 'red'   },
          { key: 'partial', label: t('🟡 Partial', '🟡 جزوی'),     value: totalPartial, color: '#f59e0b', card: 'gold'  },
          { key: 'paid',    label: t('🟢 Paid',    '🟢 ادا شدہ'),  value: totalPaid,    color: '#16a34a', card: 'green' },
          { key: 'all',     label: t('💰 Total Due','💰 کل واجب'),  value: totalPending + totalPartial, color: '#1d4ed8', card: 'blue' },
        ].map(s => (
          <div key={s.key} className={`stat-card ${s.card}`} style={{ cursor: 'pointer', opacity: filter === s.key || (s.key === 'all' && filter === 'all') ? 1 : 0.75 }}
            onClick={() => setFilter(filter === s.key ? 'all' : s.key)}>
            <div className="stat-title"><span>{s.label}</span></div>
            <div className="stat-value" style={{ color: s.color }}>Rs {s.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>⏳ {t('Loading...', 'لوڈ...')}</div>}

      {/* Offline banner */}
      {!loading && offline && (
        <div style={{
          background:'#fef2f2', border:'1px solid #fca5a5', borderLeft:'4px solid #ef4444',
          padding:'1.25rem 1.5rem', borderRadius:'0.75rem', marginBottom:'1.5rem',
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap'
        }}>
          <div style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
            <span style={{fontSize:'1.5rem'}}>🔴</span>
            <div>
              <div style={{fontWeight:'700', color:'#ef4444'}}>{t('Cannot reach backend server', 'سرور سے رابطہ نہیں')}</div>
              <div style={{fontSize:'0.82rem', color:'#b91c1c'}}>{t('Run: python app.py in the backend folder', 'بیک اینڈ فولڈر میں: python app.py چلائیں')}</div>
            </div>
          </div>
          <button onClick={loadCommissions} style={{padding:'0.5rem 1.25rem', background:'#ef4444', color:'white', border:'none', borderRadius:'0.5rem', fontWeight:'700', cursor:'pointer'}}>
            🔄 {t('Retry', 'دوبارہ')}
          </button>
        </div>
      )}

      {!loading && comms.length === 0 && (
        <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{ fontSize: '5rem', opacity: 0.2, marginBottom: '1rem' }}>💰</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.75rem' }}>
            {t('No Commission Records Yet', 'ابھی کوئی کمیشن ریکارڈ نہیں')}
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '360px', margin: '0 auto', lineHeight: 1.7 }}>
            {t('Commission records are created automatically when you add a Trip in Daily Trips.', 'جب آپ Daily Trips میں ٹرپ شامل کریں گے، کمیشن خود بخود بن جائے گا۔')}
          </p>
        </div>
      )}

      {!loading && comms.length > 0 && (
        <div className="glass-panel">
          {/* Search + Filter */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem' }}>
            <input className="form-input" style={{ maxWidth: '260px' }}
              placeholder={t('🔍 Search driver, vehicle...', '🔍 ڈرائیور، گاڑی...')}
              value={search} onChange={e => setSearch(e.target.value)} />
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {['all', 'pending', 'partial', 'paid'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '0.4rem 0.9rem', borderRadius: '9999px', border: '1.5px solid',
                  fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.15s',
                  background: filter === f ? (f === 'pending' ? '#ef4444' : f === 'partial' ? '#f59e0b' : f === 'paid' ? '#16a34a' : '#1d4ed8') : 'var(--bg-card)',
                  color: filter === f ? 'white' : 'var(--text-muted)',
                  borderColor: f === 'pending' ? '#ef4444' : f === 'partial' ? '#f59e0b' : f === 'paid' ? '#16a34a' : '#1d4ed8',
                }}>
                  {f === 'all' ? t('All', 'سب') : STATUS_CFG[f]?.[lang === 'ur' ? 'label_ur' : 'label']}
                </button>
              ))}
            </div>
            <span className="count-badge" style={{ marginLeft: 'auto' }}>{filtered.length}</span>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr>
                <th>{t('Driver', 'ڈرائیور')}</th>
                <th>{t('Vehicle', 'گاڑی')}</th>
                <th>{t('Route', 'روٹ')}</th>
                <th>{t('Date', 'تاریخ')}</th>
                <th>{t('Total', 'کل')}</th>
                <th>{t('Paid', 'ادا')}</th>
                <th>{t('Remaining', 'باقی')}</th>
                <th>{t('Status', 'سٹیٹس')}</th>
                <th>{t('Action', 'عمل')}</th>
              </tr></thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    {t('No records match your filter', 'کوئی نتیجہ نہیں')}
                  </td></tr>
                )}
                {filtered.map(c => {
                  const cfg = STATUS_CFG[c.status] || STATUS_CFG.pending;
                  const remaining = (c.amount || 0) - (c.paid || 0);
                  const isEditing = editId === c.id;
                  return (
                    <tr key={c.id} style={{ background: isEditing ? '#f0f9ff' : undefined }}>
                      <td style={{ fontWeight: '700' }}>{c.driver_name || '—'}</td>
                      <td style={{ fontWeight: '800', color: '#1d4ed8' }}><bdi>{c.vehicle_number || '—'}</bdi></td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{c.route || '—'}</td>
                      <td style={{ fontSize: '0.82rem' }}>{c.date || '—'}</td>
                      <td style={{ fontWeight: '600' }}>Rs {(c.amount || 0).toLocaleString()}</td>
                      <td>
                        {isEditing ? (
                          <input type="number" className="form-input" style={{ width: '100px', padding: '0.35rem' }}
                            value={editPaid} onChange={e => setEditPaid(e.target.value)} min="0" max={c.amount} />
                        ) : (
                          <span style={{ color: '#16a34a', fontWeight: '600' }}>Rs {(c.paid || 0).toLocaleString()}</span>
                        )}
                      </td>
                      <td>
                        <span style={{ color: remaining > 0 ? '#ef4444' : '#16a34a', fontWeight: '700' }}>
                          Rs {remaining.toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                          padding: '0.22rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700' }}>
                          {cfg.dot} {lang === 'ur' ? cfg.label_ur : cfg.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {isEditing ? (
                            <>
                              <button className="primary-btn" style={{ padding: '0.32rem 0.7rem', fontSize: '0.78rem' }}
                                onClick={() => handleSave(c.id, c.amount)}>✅ {t('Save', 'محفوظ')}</button>
                              <button className="secondary-btn" style={{ padding: '0.32rem 0.7rem', fontSize: '0.78rem' }}
                                onClick={() => setEditId(null)}>✕</button>
                            </>
                          ) : (
                            <>
                              {c.status !== 'paid' && (
                                <button onClick={() => markPaid(c.id, c.amount)}
                                  style={{ padding: '0.32rem 0.7rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '0.4rem', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}>
                                  🟢 {t('Mark Paid', 'ادا')}
                                </button>
                              )}
                              <button className="secondary-btn" style={{ padding: '0.32rem 0.7rem', fontSize: '0.78rem' }}
                                onClick={() => { setEditId(c.id); setEditPaid(c.paid || 0); }}>
                                ✏️
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Summary */}
          <div className="trip-summary">
            <div className="summary-box"><span>{t('Records', 'ریکارڈ')}</span><strong>{filtered.length}</strong></div>
            <div className="summary-box"><span>{t('Total Commission', 'کل کمیشن')}</span><strong>Rs {filtered.reduce((s, c) => s + (c.amount || 0), 0).toLocaleString()}</strong></div>
            <div className="summary-box"><span>{t('Total Paid', 'ادا')}</span><strong style={{ color: '#16a34a' }}>Rs {filtered.reduce((s, c) => s + (c.paid || 0), 0).toLocaleString()}</strong></div>
            <div className="summary-box"><span>{t('Total Remaining', 'باقی')}</span><strong style={{ color: '#ef4444' }}>Rs {filtered.reduce((s, c) => s + ((c.amount || 0) - (c.paid || 0)), 0).toLocaleString()}</strong></div>
          </div>
        </div>
      )}
    </>
  );
}
export default Commission;
