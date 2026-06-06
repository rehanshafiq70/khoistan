import React, { useState } from 'react';
import heroTruck from '../assets/hero_truck.png';
import kkgtLogo  from '../assets/kkgt_logo.png';
import { API_BASE } from '../api';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_BASE}/auth/login`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const d = await res.json();
        onLogin(d.user);
        setLoading(false);
        return;
      }

      // Server responded but credentials are wrong
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'غلط username یا password ہے۔ دوبارہ کوشش کریں۔');

    } catch (err) {
      if (err.name === 'AbortError' || err.message === 'Failed to fetch' || err.message === 'Load failed') {
        setError('🔴 Backend server is offline. Please start it:\n  cd backend  →  python app.py');
      } else {
        setError('Connection error. Check that the server is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'stretch', position:'relative', overflow:'hidden',
    }}>
      {/* Left: Truck Image Panel */}
      <div style={{
        flex:1, position:'relative', display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', overflow:'hidden',
      }}>
        <div style={{
          position:'absolute', inset:0, backgroundImage:`url(${heroTruck})`,
          backgroundSize:'cover', backgroundPosition:'center', filter:'brightness(0.35) saturate(1.2)',
        }} />
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(135deg,rgba(14,30,70,0.9) 0%,rgba(29,78,216,0.7) 100%)',
        }} />
        <div style={{ position:'relative', zIndex:2, textAlign:'center', padding:'2rem', color:'white' }}>
          <div style={{ fontSize:'4rem', marginBottom:'1rem' }}>🚛</div>
          <h2 style={{
            fontSize:'1.8rem', fontWeight:900, marginBottom:'0.75rem',
            fontFamily:'Noto Nastaliq Urdu,serif', direction:'rtl', lineHeight:1.5,
            textShadow:'0 2px 12px rgba(0,0,0,0.5)',
          }}>
            کوہستان کشمیر گڈز ٹرانسپورٹ
          </h2>
          <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.9rem', maxWidth:'320px', lineHeight:1.6 }}>
            Kohistan Kashmir Goods Transport Co.
          </p>
          <div style={{ marginTop:'2rem', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            {[
              { icon:'📍', text:'Faisalabad to All Punjab' },
              { icon:'🚛', text:'Professional Fleet Management' },
              { icon:'💰', text:'Commission Tracking System' },
            ].map(f => (
              <div key={f.text} style={{ display:'flex', alignItems:'center', gap:'0.65rem', color:'rgba(255,255,255,0.75)', fontSize:'0.85rem' }}>
                <span>{f.icon}</span><span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Login Card */}
      <div style={{
        width:'420px', background:'white', display:'flex', alignItems:'center',
        justifyContent:'center', padding:'2.5rem 2rem', boxShadow:'-8px 0 40px rgba(0,0,0,0.25)',
      }}>
        <div style={{ width:'100%' }}>
          {/* Logo + Title */}
          <div style={{ textAlign:'center', marginBottom:'2rem' }}>
            <img src={kkgtLogo} alt="KKGT" style={{ width:'72px', height:'72px', borderRadius:'16px', objectFit:'cover', boxShadow:'0 8px 24px rgba(0,0,0,0.2)', marginBottom:'1rem' }} />
            <h1 style={{ fontSize:'1.25rem', fontWeight:800, color:'#1e3a8a', marginBottom:'0.25rem' }}>
              Admin Portal
            </h1>
            <p style={{ fontSize:'0.82rem', color:'#64748b' }}>Sign in to manage your transport operations</p>
          </div>

          <div style={{ width:'50px', height:'4px', background:'linear-gradient(90deg,#ef4444,#f97316)', borderRadius:'9999px', margin:'0 auto 1.75rem' }} />

          {error && (
            <div className="login-error">⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ color:'#374151', fontSize:'0.82rem' }}>👤 Username</label>
              <input type="text" className="form-input" placeholder="Enter your username"
                value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" required />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color:'#374151', fontSize:'0.82rem' }}>🔑 Password</label>
              <div style={{ position:'relative' }}>
                <input type={showPass?'text':'password'} className="form-input"
                  placeholder="Enter your password" value={password}
                  onChange={e=>setPassword(e.target.value)} autoComplete="current-password"
                  required style={{ paddingRight:'3rem' }} />
                <button type="button" onClick={()=>setShowPass(!showPass)} style={{
                  position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', fontSize:'1rem', color:'#94a3b8',
                }}>{showPass ? '🙈' : '👁️'}</button>
              </div>
            </div>

            <button type="submit" className="primary-btn" disabled={loading} style={{
              width:'100%', marginTop:'0.25rem', padding:'0.9rem',
              fontSize:'0.95rem', letterSpacing:'0.03em', opacity:loading?0.75:1,
            }}>
              {loading ? '⏳ Signing in...' : '✅ Sign In'}
            </button>
          </form>

          <div style={{
            marginTop:'1.5rem', padding:'0.85rem 1rem', background:'#f0f9ff',
            borderRadius:'0.6rem', border:'1px solid #bae6fd', fontSize:'0.78rem', color:'#0369a1',
          }}>
            <strong>Demo Credentials:</strong><br />
            Admin: <code>admin</code> / <code>admin123</code><br />
            Dispatcher: <code>dispatcher</code> / <code>dispatch1</code>
          </div>

          <p style={{ textAlign:'center', fontSize:'0.72rem', color:'#94a3b8', marginTop:'1.5rem' }}>
            © 2026 Kohistan Kashmir Goods Transport Co.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
