import React, { useState } from 'react';
import './App.css';
import Login       from './components/Login';
import Dashboard   from './components/Dashboard';
import Drivers     from './components/Drivers';
import Vehicles    from './components/Vehicles';
import Routes      from './components/Routes';
import TripEntry   from './components/TripEntry';
import Commission  from './components/Commission';
import VehicleHistory from './components/VehicleHistory';
import Reports     from './components/Reports';
import GlobalSearch from './components/GlobalSearch';
import Analytics   from './components/Analytics';
import TownDirectory from './components/TownDirectory';
import kkgtLogo    from './assets/kkgt_logo.png';

function App() {
  const [user, setUser]           = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lang, setLang]           = useState('en');
  const [showSearch, setShowSearch] = useState(false);
  const [darkMode, setDarkMode]   = useState(false);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  React.useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowSearch(s => !s); }
      if (e.key === 'Escape') setShowSearch(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const t = (en, ur) => lang === 'en' ? en : ur;
  const handleLogin  = (u) => setUser(u);
  const handleLogout = () => { setUser(null); setActiveTab('dashboard'); };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':  return <Dashboard  lang={lang} t={t} />;
      case 'trips':      return <TripEntry  lang={lang} t={t} />;
      case 'commission': return <Commission lang={lang} t={t} />;
      case 'drivers':    return <Drivers    lang={lang} t={t} />;
      case 'vehicles':   return <Vehicles   lang={lang} t={t} />;
      case 'history':    return <VehicleHistory lang={lang} t={t} />;
      case 'routes':     return <Routes     lang={lang} t={t} />;
      case 'directory':  return <TownDirectory lang={lang} t={t} />;
      case 'analytics':  return <Analytics  lang={lang} t={t} />;
      case 'reports':    return <Reports    lang={lang} t={t} />;
      default:           return <Dashboard  lang={lang} t={t} />;
    }
  };

  if (!user) return <Login onLogin={handleLogin} />;

  const roleColor = user.role === 'admin' ? '#ef4444' : '#10b981';
  const roleLabel = user.role === 'admin' ? 'Admin' : 'Dispatcher';

  const NAV = [
    {
      section: t('MAIN', 'مین'),
      items: [
        { key: 'dashboard',  icon: '📊', en: 'Dashboard',      ur: 'ڈیش بورڈ' },
        { key: 'trips',      icon: '🚚', en: 'Daily Trips',    ur: 'روزانہ ٹرپس' },
        { key: 'commission', icon: '💰', en: 'Commission',     ur: 'کمیشن' },
      ],
    },
    {
      section: t('RECORDS', 'ریکارڈ'),
      items: [
        { key: 'drivers',    icon: '👨', en: 'Drivers',          ur: 'ڈرائیورز' },
        { key: 'vehicles',  icon: '🚛', en: 'Vehicles',         ur: 'گاڑیاں' },
        { key: 'history',   icon: '📂', en: 'Vehicle History',  ur: 'گاڑی ریکارڈ' },
        { key: 'routes',    icon: '📍', en: 'Routes',           ur: 'روٹس' },
        { key: 'directory', icon: '📦', en: 'Town Directory',   ur: 'شہر ڈائریکٹری' },
      ],
    },
    {
      section: t('INSIGHTS', 'رپورٹس'),
      items: [
        { key: 'analytics', icon: '📈', en: 'Analytics',  ur: 'تجزیات' },
        { key: 'reports',   icon: '📄', en: 'Reports',    ur: 'رپورٹس' },
      ],
    },
  ];

  return (
    <div className={`dashboard-container ${lang === 'ur' ? 'urdu-mode' : ''}`}>
      {showSearch && <GlobalSearch lang={lang} t={t} onClose={() => setShowSearch(false)} />}

      {/* ── SIDEBAR ─────────────────────────────────── */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="brand">
          <div style={{ display:'flex', alignItems:'center', gap:'0.65rem' }}>
            <img src={kkgtLogo} alt="KKGT Logo"
              style={{ width:'44px', height:'44px', borderRadius:'10px', objectFit:'cover', boxShadow:'0 4px 12px rgba(0,0,0,0.35)', flexShrink:0 }} />
            <div style={{ minWidth:0 }}>
              <div className="brand-name">KKGT</div>
              <div className="brand-sub" style={{ lineHeight:1.35 }}>
                {lang === 'ur'
                  ? 'کوہستان کشمیر گڈز'
                  : 'Kohistan Kashmir'}
              </div>
              <div className="brand-sub" style={{ opacity:0.75 }}>
                {lang === 'ur' ? 'ٹرانسپورٹ کمپنی' : 'Goods Transport Co.'}
              </div>
            </div>
          </div>
        </div>

        {/* User Badge */}
        <div className="user-badge">
          <div className="user-avatar">👤</div>
          <div>
            <div className="user-name">{user.name}</div>
            <div className="user-role" style={{ color: roleColor }}>{roleLabel}</div>
          </div>
        </div>

        {/* Search */}
        <button className="sidebar-search" onClick={() => setShowSearch(true)}>
          <span>🔍</span>
          <span style={{ flex: 1, textAlign: 'left' }}>{t('Search...', 'تلاش...')}</span>
          <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>⌃K</kbd>
        </button>

        {/* Nav */}
        <nav className="nav-links">
          {NAV.map(group => (
            <div key={group.section}>
              <div className="nav-section-label">{group.section}</div>
              {group.items.map(item => (
                <div
                  key={item.key}
                  className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.key)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{t(item.en, item.ur)}</span>
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
          {/* Dark Mode */}
          <button
            className="lang-toggle"
            onClick={() => setDarkMode(d => !d)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>

          {/* Language */}
          <button className="lang-toggle" onClick={() => setLang(l => l === 'en' ? 'ur' : 'en')}>
            {lang === 'en' ? '🇵🇰 اردو میں دیکھیں' : '🇬🇧 View in English'}
          </button>

          {/* Logout */}
          <button className="logout-btn" onClick={handleLogout}>
            🔓 {t('Logout', 'لاگ آؤٹ')}
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────── */}
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
