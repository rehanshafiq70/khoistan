import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../api';

const API = API_BASE;

// ── Updated 28+ route list (English + Urdu) ─────────────────────────────────
const ALL_ROUTES = [
  // Base / Hub
  { city_name:'Faisalabad',       city_name_ur:'فیصل آباد',           group_name:'Base' },
  // Bhakkar Group
  { city_name:'Bhakkar',          city_name_ur:'بھکر',                group_name:'Bhakkar Group' },
  { city_name:'Darya Khan',       city_name_ur:'دریا خان',            group_name:'Bhakkar Group' },
  { city_name:'Mankera',          city_name_ur:'منکیرہ',              group_name:'Bhakkar Group' },
  // Mianwali Group
  { city_name:'Mianwali',         city_name_ur:'میانوالی',            group_name:'Mianwali Group' },
  { city_name:'Noor Pur Thal',    city_name_ur:'نور پور تھل',         group_name:'Mianwali Group' },
  { city_name:'Piplan',           city_name_ur:'پپلاں',               group_name:'Mianwali Group' },
  { city_name:'Khushab',          city_name_ur:'خوشاب',               group_name:'Mianwali Group' },
  { city_name:'Johar Abad',       city_name_ur:'جوہر آباد',           group_name:'Mianwali Group' },
  { city_name:'Quaidabad',        city_name_ur:'قائد آباد',           group_name:'Mianwali Group' },
  { city_name:'Daud Khel',        city_name_ur:'داؤد خیل',            group_name:'Mianwali Group' },
  { city_name:'Chakrala',         city_name_ur:'چکرالہ',              group_name:'Mianwali Group' },
  { city_name:'Nari',             city_name_ur:'ناڑی',                group_name:'Mianwali Group' },
  // Jhang Side
  { city_name:'Jhang',            city_name_ur:'جھنگ',                group_name:'Jhang Side' },
  { city_name:'Wal Buchran',      city_name_ur:'وال بچراں',           group_name:'Jhang Side' },
  { city_name:'Gojra',            city_name_ur:'گوجرہ',               group_name:'Jhang Side' },
  { city_name:'Lali Sun Karor',   city_name_ur:'لالی سن کروڑ',        group_name:'Jhang Side' },
  { city_name:'Noshera Soan Valley',city_name_ur:'نوشہرہ سون ویلی',  group_name:'Jhang Side' },
  { city_name:'Jhandirwana',      city_name_ur:'جھنڈیروانہ',          group_name:'Jhang Side' },
  { city_name:'Kot Shakar',       city_name_ur:'کوٹ شاکر',            group_name:'Jhang Side' },
  { city_name:'Garoth',           city_name_ur:'گروٹ',                group_name:'Jhang Side' },
  { city_name:'Kalur Kot',        city_name_ur:'کلور کوٹ',            group_name:'Jhang Side' },
  { city_name:'Garh Mor',         city_name_ur:'گڑھ موڑ',             group_name:'Jhang Side' },
  { city_name:'Lawa',             city_name_ur:'لاوہ',                group_name:'Jhang Side' },
  { city_name:'Monghi Bangla',    city_name_ur:'مونگی بنگلہ',         group_name:'Jhang Side' },
  { city_name:'Puchnand',         city_name_ur:'پچند',                group_name:'Jhang Side' },
  { city_name:'Mittha Towana',    city_name_ur:'مٹھہ ٹوانہ',          group_name:'Jhang Side' },
  { city_name:'Ada Bhawn',        city_name_ur:'اڈا بھوں',            group_name:'Jhang Side' },
  { city_name:'Jora Kalan',       city_name_ur:'جوڑا کلاں',           group_name:'Jhang Side' },
  { city_name:'Kassowal',         city_name_ur:'کسووال',              group_name:'Jhang Side' },
  { city_name:'Chenji',           city_name_ur:'چینجی',               group_name:'Jhang Side' },
  // KPK Side
  { city_name:'Dera Ismail Khan', city_name_ur:'ڈیرہ اسماعیل خان',   group_name:'KPK Side' },
  // Central Punjab
  { city_name:'Lahore',           city_name_ur:'لاہور',               group_name:'Central Punjab' },
  // South Punjab
  { city_name:'Chishtian',        city_name_ur:'چشتیاں',              group_name:'South Punjab' },
  { city_name:'Haroonabad',       city_name_ur:'ہارون آباد',          group_name:'South Punjab' },
  { city_name:'Multan',           city_name_ur:'ملتان',               group_name:'South Punjab' },
];

const GROUP_COLORS = {
  'Base':           { bg:'#fef3c7', border:'#f59e0b', text:'#92400e' },
  'Bhakkar Group':  { bg:'#eff6ff', border:'#1d4ed8', text:'#1e3a8a' },
  'Mianwali Group': { bg:'#f0fdf4', border:'#10b981', text:'#065f46' },
  'Jhang Side':     { bg:'#fdf4ff', border:'#8b5cf6', text:'#4c1d95' },
  'Central Punjab': { bg:'#fff1f2', border:'#ef4444', text:'#991b1b' },
  'South Punjab':   { bg:'#fff7ed', border:'#f97316', text:'#7c2d12' },
  'KPK Side':       { bg:'#ecfdf5', border:'#059669', text:'#064e3b' },
};
const GROUP_ICONS = {
  'Base':'🏭', 'Bhakkar Group':'🚛', 'Mianwali Group':'🏔️',
  'Jhang Side':'🌊', 'Central Punjab':'🏙️', 'South Punjab':'🌾', 'KPK Side':'⛰️',
};
const EMPTY_FORM = { city_name:'', city_name_ur:'', group_name:'' };

/* ── Edit modal ─────────────────────────────────────────────── */
function EditModal({ route, onSave, onClose, t }) {
  const [form, setForm] = useState({ ...route });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  const handleSave = async () => {
    if(!form.city_name.trim()){ setErr(t('City name is required','شہر کا نام ضروری ہے')); return; }
    setSaving(true); setErr('');
    try {
      const res = await fetch(`${API}/routes/${route.id}`,{
        method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form),
      });
      const d = await res.json();
      if(res.ok) onSave(d.route);
      else setErr(d.error||t('Update failed','اپ ڈیٹ نہ ہو سکا'));
    } catch { setErr(t('Server offline','سرور آف')); }
    setSaving(false);
  };

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:500, background:'rgba(15,23,42,0.65)',
      backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem',
    }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{
        background:'white', borderRadius:'1rem', width:'100%', maxWidth:'480px',
        boxShadow:'0 25px 60px rgba(0,0,0,0.3)', borderTop:'4px solid #8b5cf6',
      }}>
        <div style={{padding:'1.25rem 1.5rem',borderBottom:'1px solid #e2e8f0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h3 style={{margin:0,fontWeight:'800',color:'#4c1d95'}}>✏️ {t('Edit Route','روٹ ترمیم')}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:'1.3rem',cursor:'pointer',color:'#94a3b8'}}>✕</button>
        </div>
        <div style={{padding:'1.5rem',display:'flex',flexDirection:'column',gap:'1rem'}}>
          {err && <div className="alert-error">{err}</div>}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">📍 {t('City Name (English)','شہر انگریزی')} *</label>
              <input className="form-input" value={form.city_name}
                onChange={e=>setForm({...form,city_name:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">📍 {t('City Name (Urdu)','شہر اردو')}</label>
              <input className="form-input" dir="rtl" value={form.city_name_ur}
                onChange={e=>setForm({...form,city_name_ur:e.target.value})} />
            </div>
            <div className="form-group form-group-full">
              <label className="form-label">🗂️ {t('Group / Region','گروپ / علاقہ')}</label>
              <select className="form-input" value={form.group_name}
                onChange={e=>setForm({...form,group_name:e.target.value})}>
                <option value="">-- {t('Select Group','گروپ منتخب کریں')} --</option>
                {Object.keys(GROUP_COLORS).map(g=><option key={g} value={g}>{GROUP_ICONS[g]} {g}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:'flex',gap:'0.75rem'}}>
            <button className="primary-btn" onClick={handleSave} disabled={saving}>
              {saving ? '⏳...' : `💾 ${t('Save Changes','تبدیلیاں محفوظ')}`}
            </button>
            <button className="secondary-btn" onClick={onClose}>{t('Cancel','منسوخ')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Routes({ lang, t }) {
  const [routes,    setRoutes]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [offline,   setOffline]   = useState(false);
  const [search,    setSearch]    = useState('');
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [msg,       setMsg]       = useState('');
  const [editRoute, setEditRoute] = useState(null);

  const flash = (m) => { setMsg(m); setTimeout(()=>setMsg(''),3500); };

  const loadRoutes = useCallback(async () => {
    setLoading(true); setOffline(false);
    try {
      const controller = new AbortController();
      const timer = setTimeout(()=>controller.abort(), 8000);
      const res = await fetch(`${API}/routes`,{signal:controller.signal});
      clearTimeout(timer);
      if(!res.ok) throw new Error();
      const data = await res.json();
      if(data.length === 0) {
        // Seed default routes on first use
        await fetch(`${API}/routes/seed`,{
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify(ALL_ROUTES),
        });
        const res2 = await fetch(`${API}/routes`);
        setRoutes(await res2.json());
      } else {
        setRoutes(data);
      }
    } catch {
      setOffline(true); setRoutes([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(()=>{ loadRoutes(); },[loadRoutes]);

  const filtered = routes.filter(r =>
    r.city_name.toLowerCase().includes(search.toLowerCase()) ||
    (r.city_name_ur||'').includes(search) ||
    (r.group_name||'').toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc,r)=>{
    const g = r.group_name||'Other';
    if(!acc[g]) acc[g]=[];
    acc[g].push(r);
    return acc;
  },{});

  /* ── ADD ── */
  const handleAdd = async (e) => {
    e.preventDefault();
    if(!form.city_name.trim()){ flash('❌ '+t('City name is required','شہر کا نام ضروری ہے')); return; }
    try {
      const res = await fetch(`${API}/routes`,{
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form),
      });
      const d = await res.json();
      if(res.ok){
        setRoutes(p=>[...p, d.route]);
        setForm(EMPTY_FORM); setShowForm(false);
        flash('✅ روٹ شامل / Route added!');
      } else flash('❌ '+(d.error||t('Error','خرابی')));
    } catch { flash('❌ '+t('Server offline','سرور آف')); }
  };

  /* ── UPDATE ── */
  const handleUpdate = (updated) => {
    setRoutes(p=>p.map(r=>r.id===updated.id?updated:r));
    setEditRoute(null);
    flash('✅ روٹ اپ ڈیٹ / Route updated!');
  };

  /* ── DELETE ── */
  const handleDelete = async (r) => {
    if(!window.confirm(`${r.city_name} (${r.city_name_ur||'—'}) — ${t('Delete permanently?','مستقل حذف کریں؟')}`)) return;
    try {
      const res = await fetch(`${API}/routes/${r.id}`,{method:'DELETE'});
      if(res.ok){ setRoutes(p=>p.filter(x=>x.id!==r.id)); flash('✅ روٹ حذف / Route deleted!'); }
      else flash('❌ '+t('Delete failed','حذف نہ ہو سکا'));
    } catch { flash('❌ '+t('Server offline','سرور آف')); }
  };

  return (
    <>
      {editRoute && (
        <EditModal route={editRoute} onSave={handleUpdate} onClose={()=>setEditRoute(null)} t={t} />
      )}

      <header className="header">
        <div>
          <h1 className={lang==='ur'?'ur-text':''}>
            📍 {t('Transport Routes','ٹرانسپورٹ روٹس')}
          </h1>
          <p style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>
            {routes.length} {t('destinations','منزلیں')}
          </p>
        </div>
        <button className="primary-btn" onClick={()=>setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : `➕ ${t('Add Route','نیا روٹ')}`}
        </button>
      </header>

      {msg && <div className={msg.startsWith('✅')?'alert-success':'alert-error'} style={{marginBottom:'1rem'}}>{msg}</div>}

      {/* Loading */}
      {loading && (
        <div style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>
          <div style={{fontSize:'2.5rem',animation:'spin 1s linear infinite',display:'inline-block'}}>⚙️</div>
          <p style={{marginTop:'0.75rem'}}>{t('Loading routes...','روٹس لوڈ ہو رہے ہیں...')}</p>
        </div>
      )}

      {/* Offline */}
      {!loading && offline && (
        <div style={{
          background:'#fef2f2',border:'1px solid #fca5a5',borderLeft:'4px solid #ef4444',
          padding:'1.25rem 1.5rem',borderRadius:'0.75rem',marginBottom:'1.5rem',
          display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem',flexWrap:'wrap',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
            <span style={{fontSize:'1.5rem'}}>🔴</span>
            <div>
              <div style={{fontWeight:'700',color:'#ef4444'}}>{t('Server offline','سرور آف لائن')}</div>
              <div style={{fontSize:'0.82rem',color:'#b91c1c'}}>python app.py {t('is not running','نہیں چل رہا')}</div>
            </div>
          </div>
          <button onClick={loadRoutes} style={{padding:'0.5rem 1.25rem',background:'#ef4444',color:'white',border:'none',borderRadius:'0.5rem',fontWeight:'700',cursor:'pointer'}}>
            🔄 {t('Retry','دوبارہ')}
          </button>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="glass-panel" style={{marginBottom:'1.5rem',borderLeft:'4px solid #8b5cf6'}}>
          <h3 style={{marginBottom:'1rem',color:'#4c1d95',fontWeight:'800'}}>
            ➕ {t('New Route','نئی منزل')}
          </h3>
          <form onSubmit={handleAdd}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">📍 {t('City Name (English)','شہر انگریزی')} *</label>
                <input className="form-input" required value={form.city_name}
                  onChange={e=>setForm({...form,city_name:e.target.value})} placeholder="e.g. Bhakkar" />
              </div>
              <div className="form-group">
                <label className="form-label">📍 {t('City Name (Urdu)','شہر اردو')}</label>
                <input className="form-input" dir="rtl" value={form.city_name_ur}
                  onChange={e=>setForm({...form,city_name_ur:e.target.value})} placeholder="مثلاً بھکر" />
              </div>
              <div className="form-group form-group-full">
                <label className="form-label">🗂️ {t('Group / Region','گروپ / علاقہ')}</label>
                <select className="form-input" value={form.group_name}
                  onChange={e=>setForm({...form,group_name:e.target.value})}>
                  <option value="">-- {t('Select Group','گروپ منتخب کریں')} --</option>
                  {Object.keys(GROUP_COLORS).map(g=><option key={g} value={g}>{GROUP_ICONS[g]} {g}</option>)}
                </select>
              </div>
            </div>
            <div style={{marginTop:'1rem',display:'flex',gap:'0.75rem'}}>
              <button type="submit" className="primary-btn">💾 {t('Save','محفوظ کریں')}</button>
              <button type="button" className="secondary-btn" onClick={()=>setShowForm(false)}>
                {t('Cancel','منسوخ')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      {!loading && !offline && (
        <div style={{marginBottom:'1.5rem',display:'flex',gap:'0.75rem',flexWrap:'wrap',alignItems:'center'}}>
          <input className="form-input"
            placeholder={t('🔍 Search city (English or Urdu)...','🔍 شہر تلاش کریں...')}
            value={search} onChange={e=>setSearch(e.target.value)}
            style={{maxWidth:'380px',fontSize:'1rem'}} />
          {search && (
            <button onClick={()=>setSearch('')}
              style={{padding:'0.45rem 0.85rem',background:'#f1f5f9',border:'1px solid #e2e8f0',
                borderRadius:'0.4rem',cursor:'pointer',fontSize:'0.82rem',color:'#64748b'}}>
              ✕ {t('Clear','صاف')}
            </button>
          )}
          <span style={{marginLeft:'auto',fontSize:'0.85rem',color:'var(--text-muted)'}}>
            {filtered.length} {t('routes','روٹس')}
          </span>
        </div>
      )}

      {/* Grouped route cards */}
      {!loading && !offline && Object.entries(grouped).map(([group, groupRoutes]) => {
        const clr  = GROUP_COLORS[group] || {bg:'#f8fafc',border:'#e2e8f0',text:'#475569'};
        const icon = GROUP_ICONS[group]  || '📍';
        return (
          <div key={group} style={{marginBottom:'2rem'}}>
            <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'1rem',
              paddingBottom:'0.5rem',borderBottom:`2px solid ${clr.border}`}}>
              <span style={{fontSize:'1.4rem'}}>{icon}</span>
              <h2 style={{fontSize:'1.1rem',fontWeight:'800',color:clr.text,margin:0}}>{group}</h2>
              <span style={{background:clr.border,color:'white',fontSize:'0.75rem',
                fontWeight:'700',padding:'0.15rem 0.6rem',borderRadius:'9999px'}}>
                {groupRoutes.length}
              </span>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'0.75rem'}}>
              {groupRoutes.map(route => (
                <div key={route.id} style={{
                  display:'flex',alignItems:'center',gap:'0.85rem',
                  padding:'0.85rem 1rem',borderRadius:'0.75rem',
                  borderLeft:`4px solid ${clr.border}`,background:clr.bg,
                  border:`1px solid ${clr.border}44`,
                }}>
                  {/* Route info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:'700',fontSize:'0.95rem',color:'var(--text-main)'}}>
                      {route.city_name}
                    </div>
                    {route.city_name_ur && (
                      <div style={{
                        fontSize:'0.85rem',color:clr.text,
                        fontFamily:'Noto Nastaliq Urdu,serif',direction:'rtl',
                        marginTop:'0.15rem',
                      }}>
                        {route.city_name_ur}
                      </div>
                    )}
                  </div>
                  {/* Action buttons */}
                  <div style={{display:'flex',gap:'0.3rem',flexShrink:0}}>
                    <button onClick={()=>setEditRoute(route)}
                      title={t('Edit','ترمیم')}
                      style={{padding:'0.3rem 0.55rem',background:'white',color:clr.text,
                        border:`1px solid ${clr.border}`,borderRadius:'0.4rem',
                        cursor:'pointer',fontSize:'0.78rem',fontWeight:'700'}}>
                      ✏️
                    </button>
                    <button onClick={()=>handleDelete(route)}
                      title={t('Delete','حذف')}
                      style={{padding:'0.3rem 0.55rem',background:'#fef2f2',color:'#ef4444',
                        border:'1px solid #fca5a5',borderRadius:'0.4rem',
                        cursor:'pointer',fontSize:'0.78rem',fontWeight:'700'}}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {!loading && !offline && filtered.length===0 && routes.length>0 && (
        <div style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>
          <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🔍</div>
          <p>{t('No routes found for','کوئی نتیجہ نہیں:')} "<strong>{search}</strong>"</p>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}

export default Routes;
