import React, { useState, useEffect } from 'react';
import { API_BASE } from '../api';
const API = API_BASE;
const EMPTY = { name:'', name_ur:'', phone:'', cnic:'', license_no:'', status:'available', notes:'' };
const S = {
  on_trip:  { label:'On Trip',   label_ur:'سفر میں', color:'#d97706', bg:'#fffbeb', border:'#fde68a' },
  available:{ label:'Available', label_ur:'دستیاب',  color:'#1d4ed8', bg:'#eff6ff', border:'#bfdbfe' },
  off_duty: { label:'Off Duty',  label_ur:'چھٹی',    color:'#64748b', bg:'#f1f5f9', border:'#e2e8f0' },
};

function Drivers({ lang, t }) {
  const [drivers,    setDrivers]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState(EMPTY);
  const [msg,        setMsg]        = useState('');
  const [search,     setSearch]     = useState('');
  const [expanded,   setExpanded]   = useState(null);
  const [editDriver, setEditDriver] = useState(null);
  const [editForm,   setEditForm]   = useState(EMPTY);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/drivers`).then(r=>r.json()).then(d=>{setDrivers(d);setLoading(false);}).catch(()=>setLoading(false));
  }, []);

  const flash = (m) => { setMsg(m); setTimeout(()=>setMsg(''),3000); };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/drivers`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      const d = await res.json();
      if(res.ok){
        setDrivers(p=>[d.driver,...p]);
        setForm(EMPTY);
        setShowForm(false);
        flash('✅ '+t('Driver added successfully!','ڈرائیور کامیابی سے شامل!'));
      } else {
        flash('❌ '+(d.error||t('Failed to save. Check fields.','محفوظ نہ ہو سکا۔')));
      }
    } catch (err) {
      if(err.name==='AbortError'||err.message==='Failed to fetch'||err.message==='Load failed'){
        flash('❌ '+t('Server offline — start python app.py first','سرور آف لائن — پہلے python app.py چلائیں'));
      } else {
        flash('❌ '+t('Connection error','کنکشن خرابی'));
      }
    }
  };

  const handleDelete = async (id, name) => {
    if(!window.confirm(`${name} — ${t('Delete this driver permanently?','یہ ڈرائیور مستقل حذف کریں؟')}`)) return;
    try {
      await fetch(`${API}/drivers/${id}`,{method:'DELETE'});
      setDrivers(p=>p.filter(d=>d.id!==id));
      flash('✅ '+t('Driver deleted','ڈرائیور حذف'));
    } catch { flash('❌ '+t('Delete failed','حذف نہ ہو سکا')); }
  };

  const openEdit = (d, e) => {
    e.stopPropagation();
    setEditDriver(d);
    setEditForm({ name:d.name||'', name_ur:d.name_ur||'', phone:d.phone||'',
      cnic:d.cnic||'', license_no:d.license_no||'', status:d.status||'available', notes:d.notes||'' });
  };

  const handleUpdate = async () => {
    setEditSaving(true);
    try {
      const res = await fetch(`${API}/drivers/${editDriver.id}`,{
        method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(editForm),
      });
      const d = await res.json();
      if(res.ok){
        setDrivers(p=>p.map(x=>x.id===editDriver.id?d.driver:x));
        setEditDriver(null);
        flash('✅ '+t('Driver updated!','ڈرائیور اپ ڈیٹ!'));
      } else flash('❌ '+(d.error||t('Update failed','اپ ڈیٹ نہ ہوا')));
    } catch { flash('❌ '+t('Server offline','سرور آف')); }
    setEditSaving(false);
  };

  const filtered = drivers.filter(d => {
    const q = search.toLowerCase();
    return !q || d.name?.toLowerCase().includes(q) || d.phone?.includes(q) || d.cnic?.includes(q);
  });

  return (
    <>
      {/* ── Edit modal ── */}
      {editDriver && (
        <div style={{
          position:'fixed', inset:0, zIndex:500, background:'rgba(15,23,42,0.65)',
          backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem',
        }} onClick={e=>e.target===e.currentTarget&&setEditDriver(null)}>
          <div style={{
            background:'white', borderRadius:'1rem', width:'100%', maxWidth:'520px',
            boxShadow:'0 25px 60px rgba(0,0,0,0.3)', borderTop:'4px solid #1d4ed8',
          }}>
            <div style={{padding:'1.25rem 1.5rem',borderBottom:'1px solid #e2e8f0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h3 style={{margin:0,fontWeight:'800',color:'#1e3a8a'}}>✏️ {t('Edit Driver','ڈرائیور ترمیم')}</h3>
              <button onClick={()=>setEditDriver(null)} style={{background:'none',border:'none',fontSize:'1.3rem',cursor:'pointer',color:'#94a3b8'}}>✕</button>
            </div>
            <div style={{padding:'1.5rem',display:'flex',flexDirection:'column',gap:'0.85rem'}}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">{t('Name (English)','نام (انگریزی)')} *</label>
                  <input className="form-input" value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('Name (Urdu)','نام (اردو)')}</label>
                  <input className="form-input" dir="rtl" value={editForm.name_ur} onChange={e=>setEditForm({...editForm,name_ur:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">📞 {t('Phone','فون')}</label>
                  <input className="form-input" value={editForm.phone} onChange={e=>setEditForm({...editForm,phone:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">🪹 CNIC</label>
                  <input className="form-input" value={editForm.cnic} onChange={e=>setEditForm({...editForm,cnic:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">📋 {t('License No.','لائسنس نمبر')}</label>
                  <input className="form-input" value={editForm.license_no} onChange={e=>setEditForm({...editForm,license_no:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">🚦 {t('Status','سٹیٹس')}</label>
                  <select className="form-input" value={editForm.status} onChange={e=>setEditForm({...editForm,status:e.target.value})}>
                    <option value="available">{t('Available','دستیاب')}</option>
                    <option value="on_trip">{t('On Trip','سفر میں')}</option>
                    <option value="off_duty">{t('Off Duty','چھٹی')}</option>
                  </select>
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">📝 {t('Notes','نوٹ')}</label>
                  <textarea className="form-input" rows="2" value={editForm.notes} onChange={e=>setEditForm({...editForm,notes:e.target.value})} />
                </div>
              </div>
              <div style={{display:'flex',gap:'0.75rem'}}>
                <button className="primary-btn" onClick={handleUpdate} disabled={editSaving}>
                  {editSaving?'⏳...':`💾 ${t('Save Changes','تبدیلیاں محفوظ')}`}
                </button>
                <button className="secondary-btn" onClick={()=>setEditDriver(null)}>{t('Cancel','منسوخ')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <header className="header">
        <div>
          <h1>👨‍✈️ {t('Driver Profiles','ڈرائیور پروفائلز')}</h1>
          <p style={{color:'var(--text-muted)',fontSize:'0.88rem'}}>{drivers.length} {t('drivers registered','ڈرائیورز رجسٹرڈ')}</p>
        </div>
        <button className="primary-btn" onClick={()=>setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : `➕ ${t('Add Driver','ڈرائیور شامل کریں')}`}
        </button>
      </header>

      {msg && <div className={msg.startsWith('✅')?'alert-success':'alert-error'}>{msg}</div>}

      {showForm && (
        <div className="glass-panel" style={{marginBottom:'1.5rem',borderLeft:'4px solid #1d4ed8'}}>
          <h3 style={{marginBottom:'1.25rem',fontWeight:'700'}}>➕ {t('New Driver','نیا ڈرائیور')}</h3>
          <form onSubmit={handleAdd}>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">{t('Name (English)','نام (انگریزی)')} *</label>
                <input className="form-input" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ali Raza"/></div>
              <div className="form-group"><label className="form-label">{t('Name (Urdu)','نام (اردو)')}</label>
                <input className="form-input" dir="rtl" value={form.name_ur} onChange={e=>setForm({...form,name_ur:e.target.value})} placeholder="علی رضا"/></div>
              <div className="form-group"><label className="form-label">📞 {t('Phone','فون')}</label>
                <input className="form-input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="0300-XXXXXXX"/></div>
              <div className="form-group"><label className="form-label">🪪 CNIC</label>
                <input className="form-input" value={form.cnic} onChange={e=>setForm({...form,cnic:e.target.value})} placeholder="XXXXX-XXXXXXX-X"/></div>
              <div className="form-group"><label className="form-label">📋 {t('License No.','لائسنس نمبر')}</label>
                <input className="form-input" value={form.license_no} onChange={e=>setForm({...form,license_no:e.target.value})}/></div>
              <div className="form-group"><label className="form-label">🚦 {t('Status','سٹیٹس')}</label>
                <select className="form-input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                  <option value="available">{t('Available','دستیاب')}</option>
                  <option value="on_trip">{t('On Trip','سفر میں')}</option>
                  <option value="off_duty">{t('Off Duty','چھٹی')}</option>
                </select></div>
              <div className="form-group form-group-full"><label className="form-label">📝 {t('Notes','نوٹ')}</label>
                <textarea className="form-input" rows="2" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder={t('Any notes...','کوئی نوٹ...')}/></div>
            </div>
            <div style={{display:'flex',gap:'0.75rem',marginTop:'1.25rem'}}>
              <button type="submit" className="primary-btn">💾 {t('Save','محفوظ کریں')}</button>
              <button type="button" className="secondary-btn" onClick={()=>{setShowForm(false);setForm(EMPTY);}}>{t('Cancel','منسوخ')}</button>
            </div>
          </form>
        </div>
      )}

      {loading && <div style={{textAlign:'center',padding:'4rem',color:'var(--text-muted)'}}>⏳ {t('Loading...','لوڈ ہو رہا ہے...')}</div>}

      {!loading && drivers.length===0 && !showForm && (
        <div style={{textAlign:'center',padding:'5rem 2rem'}}>
          <div style={{fontSize:'5rem',opacity:0.25,marginBottom:'1rem'}}>👨‍✈️</div>
          <h2 style={{fontSize:'1.4rem',fontWeight:'800',marginBottom:'0.75rem'}}>{t('No Drivers Added Yet','ابھی کوئی ڈرائیور نہیں')}</h2>
          <p style={{color:'var(--text-muted)',maxWidth:'320px',margin:'0 auto 1.5rem',lineHeight:1.7}}>
            {t('Start by adding your first driver. All records will appear here.','پہلا ڈرائیور شامل کریں۔ تمام ریکارڈ یہاں ظاہر ہوں گے۔')}
          </p>
          <button className="primary-btn" onClick={()=>setShowForm(true)} style={{padding:'0.85rem 2rem',fontSize:'1rem'}}>
            ➕ {t('Add First Driver','پہلا ڈرائیور شامل کریں')}
          </button>
        </div>
      )}

      {!loading && drivers.length>0 && (
        <>
          <div style={{marginBottom:'1.25rem'}}>
            <input className="form-input" style={{maxWidth:'300px'}} placeholder={t('🔍 Search name, phone...','🔍 نام، فون...')}
              value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:'1rem'}}>
            {filtered.map(d => {
              const s = S[d.status]||S.available;
              const initials = (d.name||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
              return (
                <div key={d.id} onClick={()=>setExpanded(expanded===d.id?null:d.id)}
                  style={{background:'var(--bg-card)',borderRadius:'1rem',padding:'1.25rem',cursor:'pointer',
                    border:`1.5px solid ${expanded===d.id?s.color:'var(--border-color)'}`,
                    boxShadow:expanded===d.id?'0 8px 24px rgba(0,0,0,0.1)':'var(--shadow-sm)',transition:'all 0.2s'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
                    <div style={{width:'48px',height:'48px',borderRadius:'50%',flexShrink:0,
                      background:'linear-gradient(135deg,#1e3a8a,#3b82f6)',
                      display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'800',fontSize:'1rem'}}>
                      {initials}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'0.5rem'}}>
                        <div style={{fontWeight:'800',fontSize:'0.98rem'}}>
                        {d.name}
                        {d.name_ur && (
                          <span style={{fontFamily:'Noto Nastaliq Urdu,serif',fontSize:'0.82rem',color:'#64748b',marginRight:'0.5rem',direction:'rtl'}}>
                            &nbsp;/ {d.name_ur}
                          </span>
                        )}
                      </div>
                        <span style={{background:s.bg,color:s.color,border:`1px solid ${s.border}`,
                          padding:'0.18rem 0.6rem',borderRadius:'9999px',fontSize:'0.72rem',fontWeight:'700',flexShrink:0}}>
                          {lang==='ur'?s.label_ur:s.label}
                        </span>
                      </div>
                      <div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginTop:'0.2rem'}}><bdi>{d.phone||'—'}</bdi></div>
                      {d.cnic && <div style={{fontSize:'0.75rem',color:'#64748b',marginTop:'0.15rem'}}>🪪 <bdi>{d.cnic}</bdi></div>}
                    </div>
                  </div>
                  {expanded===d.id && (
                    <div style={{marginTop:'1rem',paddingTop:'1rem',borderTop:'1px solid var(--border-color)',display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
                      {d.phone && <a href={`tel:${d.phone}`} onClick={e=>e.stopPropagation()}
                        style={{padding:'0.45rem 1rem',background:'#1d4ed8',color:'white',borderRadius:'0.5rem',fontWeight:'600',fontSize:'0.82rem',textDecoration:'none'}}>📞 {t('Call','کال')}</a>}
                      {d.phone && <a href={`https://wa.me/92${(d.phone||'').replace(/[-\s]/g,'').replace(/^0/,'')}`}
                        target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                        style={{padding:'0.45rem 1rem',background:'#16a34a',color:'white',borderRadius:'0.5rem',fontWeight:'600',fontSize:'0.82rem',textDecoration:'none'}}>💬 WhatsApp</a>}
                      <button onClick={e=>openEdit(d,e)}
                        style={{padding:'0.45rem 1rem',background:'#eff6ff',color:'#1d4ed8',border:'1px solid #bfdbfe',borderRadius:'0.5rem',fontWeight:'600',fontSize:'0.82rem',cursor:'pointer'}}>
                        ✏️ {t('Edit','ترمیم')}
                      </button>
                      <button onClick={e=>{e.stopPropagation();handleDelete(d.id,d.name);}}
                        style={{padding:'0.45rem 1rem',background:'#fef2f2',color:'#ef4444',border:'1px solid #fca5a5',borderRadius:'0.5rem',fontWeight:'600',fontSize:'0.82rem',cursor:'pointer'}}>
                        🗑️ {t('Delete','حذف')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length===0 && (
              <div style={{gridColumn:'1/-1',textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>
                🔍 {t('No drivers match your search','کوئی نتیجہ نہیں')}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
export default Drivers;
