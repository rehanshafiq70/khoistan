import React, { useState, useEffect } from 'react';
import { API_BASE } from '../api';

function DriverApp({ onExit }) {
  const [activeTab,  setActiveTab]  = useState('home');
  const [routes,     setRoutes]     = useState([]);
  const [commissions,setCommissions]= useState([]);
  const [todayTrips, setTodayTrips] = useState([]);
  const [offline,    setOffline]    = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Fetch live data from the backend
    Promise.all([
      fetch(`${API_BASE}/routes`).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE}/commissions`).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE}/trips?date=${today}`).then(r => r.json()).catch(() => []),
    ]).then(([r, c, t]) => {
      if (!Array.isArray(r) && !Array.isArray(c) && !Array.isArray(t)) {
        setOffline(true);
      } else {
        setRoutes(Array.isArray(r) ? r : []);
        setCommissions(Array.isArray(c) ? c : []);
        setTodayTrips(Array.isArray(t) ? t : []);
        setOffline(false);
      }
    }).catch(() => setOffline(true));
  }, [today]);

  // Summary stats
  const pendingTotal = commissions
    .filter(c => c.status === 'pending' || c.status === 'partial')
    .reduce((s, c) => s + ((c.amount || 0) - (c.paid || 0)), 0);
  const paidTotal = commissions
    .filter(c => c.status === 'paid')
    .reduce((s, c) => s + (c.amount || 0), 0);

  const renderContent = () => {
    switch (activeTab) {

      case 'home':
        return (
          <div className="driver-section">
            {/* Offline alert */}
            {offline && (
              <div style={{
                background:'#fef2f2', border:'1px solid #fca5a5', borderLeft:'4px solid #ef4444',
                padding:'1rem', borderRadius:'0.6rem', marginBottom:'1rem',
                fontSize:'0.85rem', color:'#b91c1c', fontWeight:'600',
              }}>
                🔴 سرور آف لائن ہے — python app.py چلائیں
              </div>
            )}

            {/* Today's trips */}
            <div className="driver-route-card">
              <h3>🚚 آج کے ٹرپس (Today's Trips) — {today}</h3>
              {todayTrips.length === 0 ? (
                <p style={{ color:'#64748b', textAlign:'center', padding:'1rem 0' }}>
                  آج کوئی ٹرپ نہیں ہوا۔
                </p>
              ) : (
                todayTrips.map(tr => (
                  <div key={tr.id} style={{
                    padding:'0.75rem', borderRadius:'0.5rem', marginBottom:'0.5rem',
                    background:'#f8fafc', border:'1px solid #e2e8f0',
                  }}>
                    <div style={{ fontWeight:'700', color:'#1d4ed8' }}>
                      🚛 <bdi>{tr.vehicle_number || '—'}</bdi> — {tr.driver_name}
                    </div>
                    <div style={{ fontSize:'0.85rem', color:'#64748b', marginTop:'0.25rem' }}>
                      <span style={{ color:'#10b981' }}>{tr.from_city}</span>
                      {' → '}
                      <span style={{ color:'#ef4444' }}>{tr.to_city}</span>
                      &nbsp;|&nbsp; کمیشن: <strong style={{ color:'#ef4444' }}>Rs {Number(tr.commission_amount||0).toLocaleString()}</strong>
                    </div>
                    <div style={{ marginTop:'0.25rem' }}>
                      <span style={{
                        fontSize:'0.75rem', fontWeight:'700', padding:'0.15rem 0.6rem',
                        borderRadius:'9999px',
                        background: tr.status==='completed'?'#f0fdf4': tr.status==='on_trip'?'#fffbeb':'#eff6ff',
                        color:      tr.status==='completed'?'#16a34a': tr.status==='on_trip'?'#f59e0b':'#1d4ed8',
                      }}>
                        {tr.status==='completed'?'🟢 مکمل': tr.status==='on_trip'?'🟡 سفر میں':'🔵 لوڈنگ'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Commission summary */}
            <div className="driver-commission-card">
              <h3>💰 کمیشن خلاصہ (Commission Summary)</h3>
              <div className="comm-row">
                <span>🔴 بقایا (Pending):</span>
                <strong>Rs {pendingTotal.toLocaleString()}</strong>
              </div>
              <div className="comm-row" style={{ border:'none' }}>
                <span>🟢 ادا شدہ (Paid):</span>
                <strong>Rs {paidTotal.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        );

      case 'routes':
        return (
          <div className="driver-section">
            <h3>📍 روٹس کی فہرست ({routes.length})</h3>
            {routes.length === 0 ? (
              <p style={{ color:'#64748b', textAlign:'center', padding:'2rem' }}>
                {offline ? '🔴 سرور سے رابطہ نہیں' : 'کوئی روٹ نہیں ملا'}
              </p>
            ) : (
              <div className="list-card">
                {routes.map((r, i) => (
                  <div key={r.id} className="list-item" style={{ border: i===routes.length-1?'none':undefined }}>
                    <span style={{ fontWeight:'600' }}>{r.city_name}</span>
                    {r.city_name_ur && (
                      <span style={{ color:'#64748b', fontSize:'0.85rem', fontFamily:'Noto Nastaliq Urdu,serif', marginRight:'0.5rem' }}>
                        — {r.city_name_ur}
                      </span>
                    )}
                    {r.group_name && (
                      <span className="tag" style={{ marginRight:'auto' }}>{r.group_name}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'commission':
        return (
          <div className="driver-section">
            <h3>💰 کمیشن کا ریکارڈ ({commissions.length})</h3>
            {commissions.length === 0 ? (
              <p style={{ color:'#64748b', textAlign:'center', padding:'2rem' }}>
                {offline ? '🔴 سرور سے رابطہ نہیں' : 'کوئی کمیشن ریکارڈ نہیں'}
              </p>
            ) : (
              <div className="list-card">
                {commissions.slice(0, 20).map((c, i) => (
                  <div key={c.id} className="list-item flex-between"
                    style={{ border: i===Math.min(commissions.length,20)-1?'none':undefined }}>
                    <span>{c.driver_name || '—'}</span>
                    <span>
                      Rs {(c.amount||0).toLocaleString()}
                      <span style={{
                        fontSize:'0.78rem', marginRight:'0.5rem',
                        color: c.status==='paid'?'#16a34a': c.status==='partial'?'#f59e0b':'#ef4444',
                      }}>
                        &nbsp;{c.status==='paid'?'🟢 ادا':'c.status==="partial"?'🟡 جزوی':'🔴 بقایا'}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'contact':
        return (
          <div className="driver-section">
            <h3>📞 دفتر سے رابطہ کریں</h3>
            {[
              { name:'میاں محمد شفیق', phone:'0300-7045570' },
              { name:'میاں ریحان شفیق', phone:'0333-6569070' },
              { name:'میاں فرحان شفیق', phone:'0345-0509570' },
            ].map(c => (
              <div key={c.phone} className="contact-card">
                <h4>{c.name}</h4>
                <p style={{ margin:'0.2rem 0', color:'#64748b' }}><bdi>{c.phone}</bdi></p>
                <div className="contact-actions">
                  <a href={`tel:${c.phone}`} className="btn-call">📞 کال کریں</a>
                  <a href={`https://wa.me/92${c.phone.replace(/[-\s]/g,'').replace(/^0/,'')}`}
                    target="_blank" rel="noreferrer" className="btn-wa">
                    💬 واٹس ایپ
                  </a>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="driver-app-container urdu-mode" style={{ direction:'rtl' }}>
      <header className="driver-header">
        <h1 style={{ margin:0 }}>📱 ڈرائیور ایپ (Driver App)</h1>
        <button className="exit-btn" onClick={onExit}>بند کریں (Exit)</button>
      </header>

      <div className="driver-content">
        {renderContent()}
      </div>

      <nav className="driver-bottom-nav">
        <div className={`bottom-nav-item ${activeTab==='home'?'active':''}`} onClick={()=>setActiveTab('home')}>
          <div style={{fontSize:'1.5rem'}}>🏠</div>ہوم
        </div>
        <div className={`bottom-nav-item ${activeTab==='routes'?'active':''}`} onClick={()=>setActiveTab('routes')}>
          <div style={{fontSize:'1.5rem'}}>📍</div>روٹس
        </div>
        <div className={`bottom-nav-item ${activeTab==='commission'?'active':''}`} onClick={()=>setActiveTab('commission')}>
          <div style={{fontSize:'1.5rem'}}>💰</div>کمیشن
        </div>
        <div className={`bottom-nav-item ${activeTab==='contact'?'active':''}`} onClick={()=>setActiveTab('contact')}>
          <div style={{fontSize:'1.5rem'}}>📞</div>رابطہ
        </div>
      </nav>
    </div>
  );
}

export default DriverApp;
