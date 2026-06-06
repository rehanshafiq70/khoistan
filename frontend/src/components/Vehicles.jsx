import React, { useState, useEffect } from 'react';
import { API_BASE } from '../api';

const API  = API_BASE;
const EMPTY = { number_plate:'', model:'', capacity:'', owner_name:'', condition:'good', notes:'' };
const COND  = { good:'#10b981', average:'#f59e0b', poor:'#ef4444' };
const COND_LABEL = { good:'✅ اچھی / Good', average:'⚠️ اوسط / Average', poor:'❌ خراب / Poor' };

/* ── Small helpers ─────────────────────────────────────────── */
function Flash({ msg }) {
  if (!msg) return null;
  const ok = msg.startsWith('✅');
  return (
    <div className={ok ? 'alert-success' : 'alert-error'} style={{ marginBottom:'1rem' }}>
      {msg}
    </div>
  );
}

function EditModal({ vehicle, onSave, onClose, t }) {
  const [form, setForm] = useState({ ...vehicle });
  const [saving, setSaving] = useState(false);
  const [err, setErr]     = useState('');

  const handleSave = async () => {
    setSaving(true); setErr('');
    try {
      const res = await fetch(`${API}/vehicles/${vehicle.id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form),
      });
      const d = await res.json();
      if (res.ok) { onSave(d.vehicle); }
      else { setErr(d.error || t('Update failed','اپ ڈیٹ نہ ہو سکا')); }
    } catch { setErr(t('Server offline','سرور آف لائن')); }
    setSaving(false);
  };

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:500, background:'rgba(15,23,42,0.65)',
      backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem',
    }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{
        background:'white', borderRadius:'1rem', width:'100%', maxWidth:'520px',
        boxShadow:'0 25px 60px rgba(0,0,0,0.3)', borderTop:'4px solid #1d4ed8', overflow:'hidden',
      }}>
        <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ margin:0, fontWeight:'800', color:'#1e3a8a' }}>✏️ {t('Edit Vehicle','گاڑی ترمیم')}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:'#94a3b8' }}>✕</button>
        </div>
        <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
          {err && <div className="alert-error">{err}</div>}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">🚛 {t('Number Plate','نمبر پلیٹ')} *</label>
              <input className="form-input" style={{textTransform:'uppercase'}} value={form.number_plate}
                onChange={e=>setForm({...form,number_plate:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">🔧 {t('Model','ماڈل')}</label>
              <input className="form-input" value={form.model} onChange={e=>setForm({...form,model:e.target.value})} placeholder="Hino 500, Isuzu FTR..." />
            </div>
            <div className="form-group">
              <label className="form-label">⚖️ {t('Capacity','گنجائش')}</label>
              <input className="form-input" value={form.capacity} onChange={e=>setForm({...form,capacity:e.target.value})} placeholder="20 Tons" />
            </div>
            <div className="form-group">
              <label className="form-label">👤 {t('Owner Name','مالک کا نام')}</label>
              <input className="form-input" value={form.owner_name} onChange={e=>setForm({...form,owner_name:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">⚙️ {t('Condition','حالت')}</label>
              <select className="form-input" value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})}>
                <option value="good">✅ اچھی / Good</option>
                <option value="average">⚠️ اوسط / Average</option>
                <option value="poor">❌ خراب / Poor</option>
              </select>
            </div>
            <div className="form-group form-group-full">
              <label className="form-label">📝 {t('Notes','نوٹ')}</label>
              <textarea className="form-input" rows="2" value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} />
            </div>
          </div>
          <div style={{ display:'flex', gap:'0.75rem' }}>
            <button className="primary-btn" onClick={handleSave} disabled={saving}>
              {saving ? '⏳...' : `💾 ${t('Save Changes','تبدیلیاں محفوظ کریں')}`}
            </button>
            <button className="secondary-btn" onClick={onClose}>{t('Cancel','منسوخ')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Vehicles({ lang, t }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY);
  const [msg,      setMsg]      = useState('');
  const [editVehicle, setEditVehicle] = useState(null);

  const flash = (m) => { setMsg(m); setTimeout(()=>setMsg(''), 3500); };

  useEffect(() => {
    fetch(`${API}/vehicles`).then(r=>r.json())
      .then(d=>{setVehicles(d);setLoading(false);}).catch(()=>setLoading(false));
  }, []);

  /* ── ADD ── */
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/vehicles`,{
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form),
      });
      const d = await res.json();
      if(res.ok){ setVehicles(p=>[d.vehicle,...p]); setForm(EMPTY); setShowForm(false); flash('✅ گاڑی شامل / Vehicle added!'); }
      else flash('❌ '+(d.error||t('Error','خرابی')));
    } catch(err){
      flash('❌ '+t('Server offline — start python app.py','سرور آف — python app.py چلائیں'));
    }
  };

  /* ── UPDATE ── */
  const handleUpdate = (updated) => {
    setVehicles(p=>p.map(v=>v.id===updated.id?updated:v));
    setEditVehicle(null);
    flash('✅ گاڑی اپ ڈیٹ / Vehicle updated!');
  };

  /* ── DELETE ── */
  const handleDelete = async (id, plate) => {
    if(!window.confirm(`${plate} — ${t('Delete this vehicle permanently?','یہ گاڑی مستقل حذف کریں؟')}`)) return;
    try {
      const res = await fetch(`${API}/vehicles/${id}`,{method:'DELETE'});
      if(res.ok){ setVehicles(p=>p.filter(v=>v.id!==id)); flash('✅ گاڑی حذف / Vehicle deleted!'); }
      else flash('❌ '+t('Delete failed','حذف نہ ہو سکی'));
    } catch { flash('❌ '+t('Server offline','سرور آف')); }
  };

  return (
    <>
      {editVehicle && (
        <EditModal vehicle={editVehicle} onSave={handleUpdate} onClose={()=>setEditVehicle(null)} t={t} />
      )}

      <header className="header">
        <div>
          <h1>🚛 {t('Fleet Vehicles','فلیٹ کی گاڑیاں')}</h1>
          <p style={{color:'var(--text-muted)',fontSize:'0.88rem'}}>
            {vehicles.length} {t('vehicles registered','گاڑیاں رجسٹرڈ')}
          </p>
        </div>
        <button className="primary-btn" onClick={()=>setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : `➕ ${t('Add Vehicle','گاڑی شامل کریں')}`}
        </button>
      </header>

      <Flash msg={msg} />

      {/* ── Add Form ── */}
      {showForm && (
        <div className="glass-panel" style={{marginBottom:'1.5rem',borderLeft:'4px solid #1d4ed8'}}>
          <h3 style={{marginBottom:'1.25rem',fontWeight:'800',color:'#1e3a8a'}}>
            ➕ {t('New Vehicle','نئی گاڑی')}
          </h3>
          <form onSubmit={handleAdd}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">🚛 {t('Number Plate','نمبر پلیٹ')} *</label>
                <input className="form-input" required value={form.number_plate}
                  style={{textTransform:'uppercase'}}
                  onChange={e=>setForm({...form,number_plate:e.target.value})} placeholder="LES-1234" />
              </div>
              <div className="form-group">
                <label className="form-label">🔧 {t('Model','ماڈل')}</label>
                <input className="form-input" value={form.model}
                  onChange={e=>setForm({...form,model:e.target.value})} placeholder="Hino 500" />
              </div>
              <div className="form-group">
                <label className="form-label">⚖️ {t('Capacity','گنجائش')}</label>
                <input className="form-input" value={form.capacity}
                  onChange={e=>setForm({...form,capacity:e.target.value})} placeholder="20 Tons / 20 ٹن" />
              </div>
              <div className="form-group">
                <label className="form-label">👤 {t('Owner Name','مالک کا نام')}</label>
                <input className="form-input" value={form.owner_name}
                  onChange={e=>setForm({...form,owner_name:e.target.value})} placeholder="e.g. محمد علی / Ali" />
              </div>
              <div className="form-group">
                <label className="form-label">⚙️ {t('Condition','حالت')}</label>
                <select className="form-input" value={form.condition}
                  onChange={e=>setForm({...form,condition:e.target.value})}>
                  <option value="good">✅ اچھی / Good</option>
                  <option value="average">⚠️ اوسط / Average</option>
                  <option value="poor">❌ خراب / Poor</option>
                </select>
              </div>
              <div className="form-group form-group-full">
                <label className="form-label">📝 {t('Notes','نوٹ')}</label>
                <textarea className="form-input" rows="2" value={form.notes}
                  onChange={e=>setForm({...form,notes:e.target.value})}
                  placeholder={t('Any notes... / کوئی نوٹ...','کوئی نوٹ...')} />
              </div>
            </div>
            <div style={{display:'flex',gap:'0.75rem',marginTop:'1.25rem'}}>
              <button type="submit" className="primary-btn">💾 {t('Save','محفوظ کریں')}</button>
              <button type="button" className="secondary-btn" onClick={()=>{setShowForm(false);setForm(EMPTY);}}>
                {t('Cancel','منسوخ')}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && (
        <div style={{textAlign:'center',padding:'4rem',color:'var(--text-muted)'}}>⏳ {t('Loading...','لوڈ ہو رہا ہے...')}</div>
      )}

      {!loading && vehicles.length === 0 && !showForm && (
        <div style={{textAlign:'center',padding:'5rem 2rem'}}>
          <div style={{fontSize:'5rem',opacity:0.25,marginBottom:'1rem'}}>🚛</div>
          <h2 style={{fontSize:'1.4rem',fontWeight:'800',marginBottom:'0.75rem'}}>
            {t('No Vehicles Added Yet','ابھی کوئی گاڑی نہیں')}
          </h2>
          <button className="primary-btn" onClick={()=>setShowForm(true)} style={{padding:'0.85rem 2rem',fontSize:'1rem'}}>
            ➕ {t('Add First Vehicle','پہلی گاڑی شامل کریں')}
          </button>
        </div>
      )}

      {!loading && vehicles.length > 0 && (
        <div className="glass-panel">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('Number Plate','نمبر پلیٹ')}</th>
                  <th>{t('Model','ماڈل')}</th>
                  <th>{t('Capacity','گنجائش')}</th>
                  <th>{t('Owner','مالک')}</th>
                  <th>{t('Condition','حالت')}</th>
                  <th>{t('Notes','نوٹ')}</th>
                  <th>{t('Actions','عمل')}</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v, i) => (
                  <tr key={v.id}>
                    <td style={{color:'var(--text-muted)',fontSize:'0.82rem'}}>{i+1}</td>
                    <td style={{fontWeight:'800',color:'#1d4ed8',letterSpacing:'1px'}}>
                      <bdi>{v.number_plate}</bdi>
                    </td>
                    <td>{v.model || '—'}</td>
                    <td>{v.capacity || '—'}</td>
                    <td>{v.owner_name || '—'}</td>
                    <td>
                      <span style={{
                        background:`${COND[v.condition]||'#10b981'}22`,
                        color:COND[v.condition]||'#10b981',
                        border:`1px solid ${COND[v.condition]||'#10b981'}44`,
                        padding:'0.22rem 0.65rem',borderRadius:'9999px',
                        fontSize:'0.75rem',fontWeight:'700',whiteSpace:'nowrap',
                      }}>
                        {COND_LABEL[v.condition]||'✅ Good'}
                      </span>
                    </td>
                    <td style={{color:'var(--text-muted)',fontSize:'0.85rem',maxWidth:'140px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {v.notes||'—'}
                    </td>
                    <td>
                      <div style={{display:'flex',gap:'0.4rem'}}>
                        <button onClick={()=>setEditVehicle(v)}
                          style={{padding:'0.32rem 0.7rem',background:'#eff6ff',color:'#1d4ed8',
                            border:'1px solid #bfdbfe',borderRadius:'0.4rem',cursor:'pointer',fontSize:'0.8rem',fontWeight:'600'}}>
                          ✏️ {t('Edit','ترمیم')}
                        </button>
                        <button onClick={()=>handleDelete(v.id,v.number_plate)}
                          style={{padding:'0.32rem 0.7rem',background:'#fef2f2',color:'#ef4444',
                            border:'1px solid #fca5a5',borderRadius:'0.4rem',cursor:'pointer',fontSize:'0.8rem',fontWeight:'600'}}>
                          🗑️ {t('Delete','حذف')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

export default Vehicles;
