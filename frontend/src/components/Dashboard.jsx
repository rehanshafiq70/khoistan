import React, { useState, useEffect, useCallback } from 'react';
import heroTruck from '../assets/hero_truck.png';
import { API_BASE } from '../api';

const API = API_BASE;

function Dashboard({ lang, t }) {
  const [stats, setStats]         = useState(null);
  const [trips, setTrips]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [offline, setOffline]     = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const todayLabel = new Date().toLocaleDateString('en-GB',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setOffline(false);
    try {
      const [s, tr] = await Promise.all([
        fetch(`${API}/dashboard`).then(r => { if(!r.ok) throw new Error(); return r.json(); }),
        fetch(`${API}/trips?date=${today}`).then(r => { if(!r.ok) throw new Error(); return r.json(); }),
      ]);
      setStats(s);
      setTrips(Array.isArray(tr) ? tr : []);
      setOffline(false);
    } catch {
      setOffline(true);
      setStats(null);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const STATUS_MAP = {
    on_trip:   { label:'On Trip',   label_ur:'سفر میں', color:'#d97706', bg:'#fffbeb', badge:'badge-yellow', pulse:true  },
    available: { label:'Loading',   label_ur:'لوڈنگ',  color:'#1d4ed8', bg:'#eff6ff', badge:'badge-blue',   pulse:false },
    completed: { label:'Completed', label_ur:'مکمل',   color:'#059669', bg:'#f0fdf4', badge:'badge-green',  pulse:false },
    cancelled: { label:'Cancelled', label_ur:'منسوخ',  color:'#ef4444', bg:'#fee2e2', badge:'badge-red',    pulse:false },
  };

  const CARDS = stats ? [
    { icon:'🚛', label:t('Total Vehicles','کل گاڑیاں'),       value:stats.total_vehicles??0,     color:'#1d4ed8', bg:'#eff6ff', card:'blue'  },
    { icon:'🟡', label:t('Active Trips','چلتے ٹرپس'),         value:stats.active_trips??0,       color:'#d97706', bg:'#fffbeb', card:'gold'  },
    { icon:'💰', label:t('Pending Commission','بقایا کمیشن'), value:`Rs ${(stats.pending_commission||0).toLocaleString()}`, color:'#ef4444', bg:'#fee2e2', card:'red'  },
    { icon:'💵', label:t("Today's Revenue","آج کی آمدنی"),    value:`Rs ${(stats.today_revenue||0).toLocaleString()}`,    color:'#059669', bg:'#f0fdf4', card:'green' },
  ] : null;

  return (
    <>
      {/* Hero Banner */}
      <div className="dashboard-hero">
        <div className="hero-bg" style={{backgroundImage:`url(${heroTruck})`}}/>
        <div className="hero-overlay"/>
        <div className="hero-content">
          <h1 style={{fontSize:'1.85rem',fontWeight:900,color:'white',textShadow:'0 2px 12px rgba(0,0,0,0.7)',marginBottom:'0.35rem'}}>
            🚛 {t('Kohistan Kashmir Goods Transport','کوہستان کشمیر گڈز ٹرانسپورٹ')}
          </h1>
          <p style={{color:'rgba(255,255,255,0.72)',fontSize:'0.9rem'}}>
            {t('Managing Routes, Vehicles & Commissions Efficiently','روٹس، گاڑیاں اور کمیشن کا موثر انتظام')}
          </p>
          <div style={{display:'flex',alignItems:'center',gap:'0.6rem',marginTop:'1rem'}}>
            <span className="pulse-dot"/>
            <span style={{color:'#10b981',fontSize:'0.82rem',fontWeight:700}}>{t('LIVE DISPATCH','لائیو ڈسپیچ')}</span>
            <span style={{color:'rgba(255,255,255,0.4)',fontSize:'0.78rem',marginLeft:'0.5rem'}}>📅 {todayLabel}</span>
          </div>
        </div>
        <div className="hero-badge">
          <div className="hero-badge-title">📞 {t('Contact Numbers','رابطہ نمبرز')}</div>
          {[
            {name:'میاں محمد شفیق', phone:'0300-7045570'},
            {name:'میاں ریحان شفیق',phone:'0333-6569070'},
            {name:'میاں فرحان شفیق',phone:'0345-0509570'},
          ].map(c=>(
            <div key={c.phone} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.4rem'}}>
              <span style={{fontSize:'0.75rem',color:'rgba(255,255,255,0.8)',fontFamily:'Noto Nastaliq Urdu,serif'}}>{c.name}</span>
              <a href={`tel:${c.phone}`} style={{color:'#f59e0b',fontWeight:700,fontSize:'0.8rem',textDecoration:'none'}}><bdi>{c.phone}</bdi></a>
            </div>
          ))}
        </div>
      </div>

      {/* Server offline banner */}
      {!loading && offline && (
        <div style={{
          background:'#fef2f2', border:'1px solid #fca5a5', borderLeft:'4px solid #ef4444',
          padding:'1.25rem 1.5rem', borderRadius:'0.75rem', margin:'1rem 0',
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap'
        }}>
          <div style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
            <span style={{fontSize:'1.5rem'}}>🔴</span>
            <div>
              <div style={{fontWeight:'700', color:'#ef4444', marginBottom:'0.2rem'}}>
                {t('Backend server is not running','بیک اینڈ سرور نہیں چل رہا')}
              </div>
              <div style={{fontSize:'0.82rem', color:'#b91c1c'}}>
                {t('Open a terminal in the backend folder and run: python app.py','بیک اینڈ فولڈر میں ٹرمینل کھولیں اور چلائیں: python app.py')}
              </div>
            </div>
          </div>
          <button onClick={loadDashboard} style={{
            padding:'0.5rem 1.25rem', background:'#ef4444', color:'white',
            border:'none', borderRadius:'0.5rem', fontWeight:'700', cursor:'pointer'
          }}>
            🔄 {t('Retry','دوبارہ')}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>
          <div style={{fontSize:'2.5rem',animation:'spin 1s linear infinite',display:'inline-block'}}>⚙️</div>
          <p style={{marginTop:'0.75rem'}}>{t('Loading dashboard...','ڈیش بورڈ لوڈ ہو رہا ہے...')}</p>
        </div>
      )}

      {/* Stat Cards */}
      {!loading && CARDS && (
        <div className="stats-grid">
          {CARDS.map((s,i)=>(
            <div key={i} className={`stat-card ${s.card}`}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div className="stat-title">{s.label}</div>
                  <div className="stat-value" style={{color:s.color}}>{s.value}</div>
                </div>
                <div className="stat-icon-wrap" style={{background:s.bg}}>
                  <span style={{fontSize:'1.5rem'}}>{s.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No data yet — onboarding prompt */}
      {!loading && stats && stats.total_vehicles===0 && stats.active_trips===0 && trips.length===0 && (
        <div className="glass-panel" style={{textAlign:'center',padding:'3rem 2rem',borderLeft:'4px solid #f59e0b',marginBottom:'1.5rem'}}>
          <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🚀</div>
          <h2 style={{fontSize:'1.3rem',fontWeight:'800',marginBottom:'0.75rem'}}>
            {t('Welcome to KKGT System!','KKGT سسٹم میں خوش آمدید!')}
          </h2>
          <p style={{color:'var(--text-muted)',lineHeight:1.8,maxWidth:'400px',margin:'0 auto 1.5rem'}}>
            {t('Your system is ready. Start by adding:','آپ کا سسٹم تیار ہے۔ شروع کریں:')}
          </p>
          <div style={{display:'flex',gap:'0.75rem',justifyContent:'center',flexWrap:'wrap'}}>
            {[
              {icon:'👨‍✈️',label:t('Add Drivers','ڈرائیور'),tab:'drivers'},
              {icon:'🚛',label:t('Add Vehicles','گاڑیاں'),tab:'vehicles'},
              {icon:'📍',label:t('Add Routes','روٹس'),tab:'routes'},
            ].map(item=>(
              <div key={item.tab} style={{background:'#f8fafc',border:'1px solid var(--border-color)',borderRadius:'0.75rem',padding:'1rem 1.5rem',textAlign:'center',minWidth:'120px'}}>
                <div style={{fontSize:'2rem',marginBottom:'0.4rem'}}>{item.icon}</div>
                <div style={{fontWeight:'700',fontSize:'0.88rem'}}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Dispatch */}
      {!loading && (
        <div className="glass-panel">
          <h2 className="section-title">
            🚚 {t("Today's Dispatch","آج کے ٹرپس")}
            <span className="count-badge">{trips.length}</span>
          </h2>

          {trips.length===0 ? (
            <div style={{textAlign:'center',padding:'2.5rem',color:'var(--text-muted)'}}>
              <div style={{fontSize:'3rem',opacity:0.2,marginBottom:'0.75rem'}}>🚚</div>
              <p style={{fontWeight:'600'}}>{t('No trips recorded today.','آج کوئی ٹرپ نہیں ہوا۔')}</p>
              <p style={{fontSize:'0.85rem',marginTop:'0.3rem'}}>{t('Go to Daily Trips to add one.','ٹرپ شامل کرنے کے لیے Daily Trips پر جائیں۔')}</p>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'0.65rem'}}>
              {trips.map(tr=>{
                const s = STATUS_MAP[tr.status]||STATUS_MAP.available;
                return (
                  <div key={tr.id} style={{display:'flex',alignItems:'center',gap:'0.9rem',padding:'0.85rem 1rem',
                    borderRadius:'0.75rem',background:s.bg,border:`1.5px solid ${s.color}22`,flexWrap:'wrap'}}>
                    <div style={{minWidth:'100px'}}>
                      <div style={{fontWeight:'800',color:'#1d4ed8',fontSize:'0.9rem',letterSpacing:'1px'}}>🚛 {tr.vehicle_number||'—'}</div>
                    </div>
                    <div style={{flex:1,fontWeight:'600',fontSize:'0.875rem'}}>👤 {tr.driver_name}</div>
                    <div style={{flex:2,fontSize:'0.82rem'}}>
                      <span style={{color:'#10b981',fontWeight:'700'}}>{tr.from_city}</span>
                      <span style={{color:'#94a3b8',margin:'0 0.35rem'}}>→</span>
                      <span style={{color:'#ef4444',fontWeight:'700'}}>{tr.to_city}</span>
                    </div>
                    <span className={`status-badge ${s.badge}`}>
                      {s.pulse&&<span style={{width:'6px',height:'6px',borderRadius:'50%',background:s.color,animation:'pulse 1s infinite',display:'inline-block',marginRight:'4px'}}/>}
                      {lang==='ur'?s.label_ur:s.label}
                    </span>
                    <div style={{textAlign:'right',minWidth:'70px'}}>
                      <div style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>{t('Comm','کمیشن')}</div>
                      <div style={{fontWeight:'800',color:'#ef4444',fontSize:'0.88rem'}}>Rs {Number(tr.commission_amount||0).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.3)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
export default Dashboard;
