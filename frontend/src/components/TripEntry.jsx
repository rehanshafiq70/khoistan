import React, { useState, useEffect } from 'react';
import { API_BASE } from '../api';
const API = API_BASE;
const today = new Date().toISOString().split('T')[0];
const EMPTY = { driver_name:'', driver_phone:'', vehicle_number:'', from_city:'', to_city:'', trip_date:today, freight_amount:'', commission_amount:'', status:'available', notes:'' };
const STATUS_COLOR = { available:'#10b981', on_trip:'#f59e0b', completed:'#3b82f6', cancelled:'#ef4444' };

const CITY_LIST = [
  'Adda 217','Adda Sheikhan','Ahmed Pur Sial','18-Hazari',
  'Bhakkar T','Chakrallah','Chinji','Chowk Azam','Chund Bharwana',
  'Darya Khan','Dulewala','Fateh Pur','Garh Morr','Girote','Gojra',
  'Harnoli','Hyderabad Thal','Janiwala','Jaranwala','Jhang T',
  'Joharabad','Kala Bagh','Kaloor Kot','Karoor Lal Eson','Khushab T',
  'Kot Shahkir','Kundian','Lawa','Layyah','Mianwali T','Mongi Banglow',
  'Morr Khunda','Noshehra Soon','NP Thal','Pichnand','Piplan',
  'Pir Mahal','Pirkot','Quaid Abad','Saray Muhajir','Shah Jewna',
  'Shorkot','Shorkot Cantt.','Toba Tek Singh','Wan Bhachran','Wariam Wala',
  'Faisalabad',
].sort();

function TripEntry({ lang, t }) {
  const [form,      setForm]      = useState(EMPTY);
  const [trips,     setTrips]     = useState([]);
  const [routes,    setRoutes]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [msg,       setMsg]       = useState('');
  const [date,      setDate]      = useState(today);
  const [editTrip,  setEditTrip]  = useState(null);
  const [editForm,  setEditForm]  = useState({});
  const [editSaving,setEditSaving]= useState(false);

  useEffect(() => {
    fetch(`${API}/routes`).then(r=>r.json()).then(setRoutes).catch(()=>{});
    loadTrips(today);
  }, []);

  const loadTrips = (d) => {
    setLoading(true);
    fetch(`${API}/trips?date=${d}`).then(r=>r.json()).then(data=>{setTrips(data);setLoading(false);}).catch(()=>setLoading(false));
  };

  const flash = (m) => { setMsg(m); setTimeout(()=>setMsg(''),3500); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/trips`,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          ...form,
          freight_amount:   parseFloat(form.freight_amount)   || 0,
          commission_amount:parseFloat(form.commission_amount)|| 0,
        })
      });
      const d = await res.json();
      if(res.ok){
        setTrips(p=>[d.trip,...p]);
        setForm({...EMPTY, trip_date:date});
        flash('✅ '+t('Trip saved successfully!','ٹرپ کامیابی سے محفوظ!'));
      } else {
        flash('❌ '+(d.error||t('Failed to save trip','ٹرپ محفوظ نہ ہوا')));
      }
    } catch (err) {
      if(err.name==='AbortError'||err.message==='Failed to fetch'||err.message==='Load failed'){
        flash('❌ '+t('Server offline — start python app.py first','سرور آف — python app.py چلائیں'));
      } else {
        flash('❌ '+(err.message||t('Connection error','کنکشن خرابی')));
      }
    }
  };

  const updateStatus = async (id, status) => {
    await fetch(`${API}/trips/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})}).catch(()=>{});
    setTrips(p=>p.map(tr=>tr.id===id?{...tr,status}:tr));
  };

  const deleteTrip = async (id, driverName) => {
    if(!window.confirm(`${driverName} — ${t('Delete this trip permanently?','یہ ٹرپ مستقل حذف کریں؟')}`)) return;
    await fetch(`${API}/trips/${id}`,{method:'DELETE'}).catch(()=>{});
    setTrips(p=>p.filter(tr=>tr.id!==id));
    flash('✅ '+t('Trip deleted','ٹرپ حذف'));
  };

  const openEditTrip = (tr) => {
    setEditTrip(tr);
    setEditForm({
      driver_name:tr.driver_name||'', driver_phone:tr.driver_phone||'',
      vehicle_number:tr.vehicle_number||'', from_city:tr.from_city||'',
      to_city:tr.to_city||'', trip_date:tr.trip_date||today,
      freight_amount:tr.freight_amount||'', commission_amount:tr.commission_amount||'',
      status:tr.status||'available', notes:tr.notes||'',
    });
  };

  const handleUpdateTrip = async () => {
    setEditSaving(true);
    try {
      const res = await fetch(`${API}/trips/${editTrip.id}`,{
        method:'PATCH', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          ...editForm,
          freight_amount:   parseFloat(editForm.freight_amount)   || 0,
          commission_amount:parseFloat(editForm.commission_amount)|| 0,
        }),
      });
      const d = await res.json();
      if(res.ok){
        setTrips(p=>p.map(tr=>tr.id===editTrip.id?d.trip:tr));
        setEditTrip(null);
        flash('✅ '+t('Trip updated!','ٹرپ اپ ڈیٹ!'));
      } else flash('❌ '+(d.error||t('Update failed','اپ ڈیٹ نہ ہوا')));
    } catch { flash('❌ '+t('Server offline','سرور آف')); }
    setEditSaving(false);
  };

  // Merge backend routes with hardcoded cities, deduplicate
  const backendCities = routes.map(r => r.city_name);
  const allCities = [...new Set([...CITY_LIST, ...backendCities])].sort();
  const routeOptions = allCities.map(c => <option key={c} value={c}>{c}</option>);

  const totalFreight    = trips.reduce((s,tr)=>s+Number(tr.freight_amount||0),0);
  const totalCommission = trips.reduce((s,tr)=>s+Number(tr.commission_amount||0),0);

  return (
    <>
      {/* ── Edit Modal ── */}
      {editTrip && (
        <div style={{
          position:'fixed', inset:0, zIndex:500, background:'rgba(15,23,42,0.65)',
          backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem',
        }} onClick={e=>e.target===e.currentTarget&&setEditTrip(null)}>
          <div style={{
            background:'white', borderRadius:'1rem', width:'100%', maxWidth:'600px',
            boxShadow:'0 25px 60px rgba(0,0,0,0.3)', borderTop:'4px solid #3b82f6',
          }}>
            <div style={{padding:'1.25rem 1.5rem',borderBottom:'1px solid #e2e8f0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h3 style={{margin:0,fontWeight:'800',color:'#1e3a8a'}}>✏️ {t('Edit Trip','ٹرپ ترمیم')}</h3>
              <button onClick={()=>setEditTrip(null)} style={{background:'none',border:'none',fontSize:'1.3rem',cursor:'pointer',color:'#94a3b8'}}>✕</button>
            </div>
            <div style={{padding:'1.5rem',display:'flex',flexDirection:'column',gap:'0.85rem'}}>
              <div className="form-grid">
                <div className="form-group"><label className="form-label">👤 {t('Driver Name','ڈرائیور نام')} *</label>
                  <input className="form-input" required value={editForm.driver_name} onChange={e=>setEditForm({...editForm,driver_name:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">📞 {t('Phone','فون')}</label>
                  <input className="form-input" value={editForm.driver_phone} onChange={e=>setEditForm({...editForm,driver_phone:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">🚛 {t('Vehicle No.','گاڑی نمبر')}</label>
                  <input className="form-input" value={editForm.vehicle_number} style={{textTransform:'uppercase'}} onChange={e=>setEditForm({...editForm,vehicle_number:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">📅 {t('Date','تاریخ')} *</label>
                  <input className="form-input" type="date" required value={editForm.trip_date} onChange={e=>setEditForm({...editForm,trip_date:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">📍 {t('From City','کہاں سے')} *</label>
                  <select className="form-input" required value={editForm.from_city} onChange={e=>setEditForm({...editForm,from_city:e.target.value})}>
                    <option value="">{t('-- Select --','-- منتخب کریں --')}</option>
                    {routeOptions}
                  </select></div>
                <div className="form-group"><label className="form-label">🏁 {t('To City','کہاں تک')} *</label>
                  <select className="form-input" required value={editForm.to_city} onChange={e=>setEditForm({...editForm,to_city:e.target.value})}>
                    <option value="">{t('-- Select --','-- منتخب کریں --')}</option>
                    {routeOptions}
                  </select></div>
                <div className="form-group"><label className="form-label">💵 {t('Freight (Rs)','کرایہ')}</label>
                  <input className="form-input" type="number" min="0" value={editForm.freight_amount} onChange={e=>setEditForm({...editForm,freight_amount:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">💰 {t('Commission (Rs)','کمیشن')}</label>
                  <input className="form-input" type="number" min="0" value={editForm.commission_amount} onChange={e=>setEditForm({...editForm,commission_amount:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">🚦 {t('Status','سٹیٹس')}</label>
                  <select className="form-input" value={editForm.status} onChange={e=>setEditForm({...editForm,status:e.target.value})}>
                    <option value="available">{t('Loading','لوڈنگ')}</option>
                    <option value="on_trip">{t('On Trip','سفر میں')}</option>
                    <option value="completed">{t('Completed','مکمل')}</option>
                    <option value="cancelled">{t('Cancelled','منسوخ')}</option>
                  </select></div>
                <div className="form-group form-group-full"><label className="form-label">📝 {t('Notes','نوٹ')}</label>
                  <textarea className="form-input" rows="2" value={editForm.notes} onChange={e=>setEditForm({...editForm,notes:e.target.value})} /></div>
              </div>
              <div style={{display:'flex',gap:'0.75rem',marginTop:'1rem'}}>
                <button className="primary-btn" onClick={handleUpdateTrip} disabled={editSaving}>
                  {editSaving?'⏳...':`💾 ${t('Save Changes','تبدیلیاں محفوظ')}`}
                </button>
                <button className="secondary-btn" onClick={()=>setEditTrip(null)}>{t('Cancel','منسوخ')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <header className="header">
        <div>
          <h1>🚚 {t('Daily Trip Entry','روزانہ ٹرپ اندراج')}</h1>
          <p style={{color:'var(--text-muted)',fontSize:'0.88rem'}}>📅 {date}</p>
        </div>
      </header>

      {msg && <div className={msg.startsWith('✅')?'alert-success':'alert-error'}>{msg}</div>}

      {/* Entry Form */}
      <div className="glass-panel" style={{marginBottom:'1.75rem'}}>
        <h2 className="section-title">➕ {t('New Trip Entry','نیا ٹرپ')}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">👤 {t('Driver Name','ڈرائیور نام')} *</label>
              <input className="form-input" required value={form.driver_name} onChange={e=>setForm({...form,driver_name:e.target.value})} placeholder={t('e.g. Ali Raza','مثلاً: علی رضا')}/></div>
            <div className="form-group"><label className="form-label">📞 {t('Phone','فون')}</label>
              <input className="form-input" value={form.driver_phone} onChange={e=>setForm({...form,driver_phone:e.target.value})} placeholder="0300-XXXXXXX"/></div>
            <div className="form-group"><label className="form-label">🚛 {t('Vehicle No.','گاڑی نمبر')}</label>
              <input className="form-input" value={form.vehicle_number} style={{textTransform:'uppercase'}} onChange={e=>setForm({...form,vehicle_number:e.target.value})} placeholder="LES-1234"/></div>
            <div className="form-group"><label className="form-label">📅 {t('Date','تاریخ')} *</label>
              <input className="form-input" type="date" required value={form.trip_date} onChange={e=>setForm({...form,trip_date:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">📍 {t('From City','کہاں سے')} *</label>
              <select className="form-input" required value={form.from_city} onChange={e=>setForm({...form,from_city:e.target.value})}>
                <option value="">{t('-- Select --','-- منتخب کریں --')}</option>
                {routeOptions}
              </select></div>
            <div className="form-group"><label className="form-label">🏁 {t('To City','کہاں تک')} *</label>
              <select className="form-input" required value={form.to_city} onChange={e=>setForm({...form,to_city:e.target.value})}>
                <option value="">{t('-- Select --','-- منتخب کریں --')}</option>
                {routeOptions}
              </select></div>
            <div className="form-group"><label className="form-label">💵 {t('Freight (Rs)','کرایہ')}</label>
              <input className="form-input" type="number" min="0" value={form.freight_amount} onChange={e=>setForm({...form,freight_amount:e.target.value})} placeholder="15000"/></div>
            <div className="form-group"><label className="form-label">💰 {t('Commission (Rs)','کمیشن')}</label>
              <input className="form-input" type="number" min="0" value={form.commission_amount} onChange={e=>setForm({...form,commission_amount:e.target.value})} placeholder="1500"/></div>
            <div className="form-group"><label className="form-label">🚦 {t('Status','سٹیٹس')}</label>
              <select className="form-input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                <option value="available">{t('Available/Loading','دستیاب')}</option>
                <option value="on_trip">{t('On Trip','سفر میں')}</option>
                <option value="completed">{t('Completed','مکمل')}</option>
              </select></div>
            <div className="form-group form-group-full"><label className="form-label">📝 {t('Notes','نوٹ')}</label>
              <textarea className="form-input" rows="2" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder={t('Any notes...','کوئی نوٹ...')}/></div>
          </div>
          <div style={{display:'flex',gap:'0.75rem',marginTop:'1.25rem',flexWrap:'wrap'}}>
            <button type="submit" className="primary-btn">✅ {t('Save Trip','ٹرپ محفوظ کریں')}</button>
            <button type="button" className="secondary-btn" onClick={()=>setForm({...EMPTY,trip_date:date})}>🔄 {t('Clear','صاف')}</button>
          </div>
        </form>
      </div>

      {/* Date Filter */}
      <div className="glass-panel" style={{marginBottom:'1.25rem',padding:'0.9rem 1.25rem'}}>
        <div style={{display:'flex',alignItems:'center',gap:'1rem',flexWrap:'wrap'}}>
          <label style={{fontWeight:'600',color:'var(--text-muted)',fontSize:'0.85rem'}}>📅 {t('Filter by Date','تاریخ کے مطابق')}:</label>
          <input type="date" className="form-input" style={{width:'auto'}} value={date}
            onChange={e=>{setDate(e.target.value);loadTrips(e.target.value);}}/>
          <span className="count-badge" style={{marginLeft:'auto'}}>{trips.length} {t('trips','ٹرپس')}</span>
        </div>
      </div>

      {/* Trips Table */}
      <div className="glass-panel">
        <h2 className="section-title">📋 {t("Trips","ٹرپس")} <span className="count-badge">{trips.length}</span></h2>

        {loading && <div style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>⏳ {t('Loading...','لوڈ...')}</div>}

        {!loading && trips.length===0 && (
          <div style={{textAlign:'center',padding:'3.5rem 2rem'}}>
            <div style={{fontSize:'4rem',opacity:0.2,marginBottom:'1rem'}}>🚚</div>
            <h3 style={{fontWeight:'700',marginBottom:'0.5rem'}}>{t('No Trips for This Date','اس تاریخ کا کوئی ٹرپ نہیں')}</h3>
            <p style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>{t('Use the form above to add your first trip entry.','اوپر فارم سے ٹرپ شامل کریں۔')}</p>
          </div>
        )}

        {!loading && trips.length>0 && (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead><tr>
                  <th>{t('Driver','ڈرائیور')}</th>
                  <th>{t('Vehicle','گاڑی')}</th>
                  <th>{t('Route','روٹ')}</th>
                  <th>{t('Freight','کرایہ')}</th>
                  <th>{t('Commission','کمیشن')}</th>
                  <th>{t('Status','سٹیٹس')}</th>
                  <th>{t('Actions','عمل')}</th>
                </tr></thead>
                <tbody>
                  {trips.map(tr=>(
                    <tr key={tr.id}>
                      <td>
                        <div style={{fontWeight:'700'}}>{tr.driver_name}</div>
                        <div style={{fontSize:'0.78rem',color:'var(--text-muted)'}}><bdi>{tr.driver_phone}</bdi></div>
                      </td>
                      <td style={{fontWeight:'800',color:'#1d4ed8'}}><bdi>{tr.vehicle_number||'—'}</bdi></td>
                      <td style={{fontSize:'0.85rem'}}>
                        <span style={{color:'#10b981',fontWeight:'700'}}>{tr.from_city}</span>
                        <span style={{color:'#94a3b8',margin:'0 0.3rem'}}>→</span>
                        <span style={{color:'#ef4444',fontWeight:'700'}}>{tr.to_city}</span>
                      </td>
                      <td style={{fontWeight:'600'}}>Rs {Number(tr.freight_amount||0).toLocaleString()}</td>
                      <td style={{fontWeight:'700',color:'#10b981'}}>Rs {Number(tr.commission_amount||0).toLocaleString()}</td>
                      <td>
                        <select value={tr.status} onChange={e=>updateStatus(tr.id,e.target.value)}
                          style={{padding:'0.3rem 0.5rem',borderRadius:'0.4rem',border:`1.5px solid ${STATUS_COLOR[tr.status]||'#94a3b8'}`,
                            color:STATUS_COLOR[tr.status]||'#94a3b8',fontWeight:'700',fontSize:'0.8rem',background:'white',cursor:'pointer'}}>
                          <option value="available">{t('Loading','لوڈنگ')}</option>
                          <option value="on_trip">{t('On Trip','سفر میں')}</option>
                          <option value="completed">{t('Completed','مکمل')}</option>
                          <option value="cancelled">{t('Cancelled','منسوخ')}</option>
                        </select>
                      </td>
                      <td>
                        <div style={{display:'flex',gap:'0.4rem'}}>
                          <button onClick={()=>openEditTrip(tr)}
                            style={{background:'#eff6ff',color:'#1d4ed8',border:'1px solid #bfdbfe',padding:'0.3rem 0.6rem',borderRadius:'0.4rem',cursor:'pointer',fontSize:'0.8rem',fontWeight:'600'}}>
                            ✏️
                          </button>
                          <button onClick={()=>deleteTrip(tr.id, tr.driver_name)}
                            style={{background:'#fef2f2',color:'#ef4444',border:'1px solid #fca5a5',padding:'0.3rem 0.6rem',borderRadius:'0.4rem',cursor:'pointer',fontSize:'0.8rem',fontWeight:'600'}}>
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="trip-summary">
              <div className="summary-box"><span>{t('Total Trips','کل ٹرپس')}</span><strong>{trips.length}</strong></div>
              <div className="summary-box"><span>{t('Total Freight','کل کرایہ')}</span><strong>Rs {totalFreight.toLocaleString()}</strong></div>
              <div className="summary-box"><span>{t('Total Commission','کل کمیشن')}</span><strong style={{color:'#ef4444'}}>Rs {totalCommission.toLocaleString()}</strong></div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
export default TripEntry;
