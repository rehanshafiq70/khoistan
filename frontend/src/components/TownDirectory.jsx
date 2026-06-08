import React, { useState, useMemo } from 'react';

const RAW_DATA = [
  ['Adda 217','Sholab & Brothers'],
  ['Adda Sheikhan','Javaid Traders'],
  ['Ahmed Pur Sial','Mohsin Traders'],
  ['Ahmed Pur Sial','Attiq Trader'],
  ['Ahmed Pur Sial','Ahmed Traders'],
  ['18-Hazari','Ch M Farooq & Sons'],
  ['Bhakkar T','Al-Riaz Traders'],
  ['Bhakkar T','Jamshaid Traders'],
  ['Bhakkar T','Imran Broker'],
  ['Bhakkar T','Madni Traders'],
  ['Bhakkar T','Wajid Traders'],
  ['Bhakkar T','Jamshed & Brothers'],
  ['Chakrallah','Saand Karyana Store'],
  ['Chinji','Malik Nouman And Company'],
  ['Chowk Azam','Aftab And Co'],
  ['Chund Bharwana','Hafiz Traders'],
  ['Darya Khan','Riaz Ahmad And Sons'],
  ['Darya Khan','Riaz Ahmad'],
  ['Dulewala','Saad Trader'],
  ['Fateh Pur','Ghulam Muhammad'],
  ['Fateh Pur','Insaf Traders'],
  ['Garh Morr','Shafiq Traders'],
  ['Girote','Naveed Traders'],
  ['Gojra','Rana Traders'],
  ['Gojra','M. Hassan Traders'],
  ['Gojra','Seher Traders'],
  ['Gojra','M Abu Baker'],
  ['Gojra','Sheikh Traders'],
  ['Harnoli','Javaid Karyana Store'],
  ['Hyderabad Thal','Abbass Traders'],
  ['Janiwala','Madni Traders'],
  ['Jaranwala','Arshad & Co.'],
  ['Jhang T','Muzammal Traders'],
  ['Jhang T','Sufyan Younas'],
  ['Jhang T','Adnan Enterprises'],
  ['Jhang T','Malik Abdul Sattar Traders'],
  ['Jhang T','M Ashraf'],
  ['Jhang T','Aftab Ahmed'],
  ['Jhang T','Sultan Sakandar'],
  ['Jhang T','M Asif'],
  ['Jhang T','Affan Traders'],
  ['Jhang T','M Usman'],
  ['Jhang T','Qaisar Traders'],
  ['Joharabad','Awan Traders'],
  ['Joharabad','Kh. Muddasar & Co'],
  ['Joharabad','Samar Traders'],
  ['Kala Bagh','Hafiz-M-Telah Hashmi'],
  ['Kaloor Kot','Millat Traders'],
  ['Kaloor Kot','Rao Traders'],
  ['Karoor Lal Eson','Azher Traders'],
  ['Khushab T','Abdul Rab Farooq'],
  ['Khushab T','Shahzad Traders'],
  ['Khushab T','Mubeen Traders'],
  ['Kot Shahkir','Minhaj Traders'],
  ['Kundian','Syed Traders'],
  ['Lawa','Sher Muhammad Karyana'],
  ['Layyah','Al Habib Traders'],
  ['Mianwali T','Aziz-Ur-Rehman'],
  ['Mianwali T','Sadaat Traders'],
  ['Mongi Banglow','Al Hafiz Traders'],
  ['Morr Khunda','Artash Traders'],
  ['Morr Khunda','Sheikh Traders'],
  ['Morr Khunda','Yaseen Karyana'],
  ['Morr Khunda','Sher Ali Traders'],
  ['Morr Khunda','M/S Sheikh Traders'],
  ['Noshehra Soon','Dostia Traders'],
  ['NP Thal','Khan Traders'],
  ['Pichnand','Imran Trader'],
  ['Piplan','Shoukat Traders'],
  ['Piplan','New Commercial Traders'],
  ['Pir Mahal','Ibrahim Traders'],
  ['Pirkot','Sial Traders'],
  ['Quaid Abad','Azmat Brothers'],
  ['Quaid Abad','Talha Traders'],
  ['Saray Muhajir','Etihad Traders'],
  ['Shah Jewna','Sandrana Traders'],
  ['Shah Jewna','Hassan Traders'],
  ['Shorkot','Shaker Traders'],
  ['Shorkot Cantt.','Abdullah Traders'],
  ['Toba Tek Singh','Chaudhry Traders'],
  ['Toba Tek Singh','Hamza And Co'],
  ['Toba Tek Singh','Trade Technologies'],
  ['Toba Tek Singh','Ch. Trader Distributor'],
  ['Wan Bhachran','Ittehad Traders'],
  ['Wariam Wala','Soban Sajjad Trader'],
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const UNIQUE_TOWNS = [...new Set(RAW_DATA.map(r => r[0]))].length;
const TOTAL_CUSTOMERS = RAW_DATA.length;

function exportCSV(data) {
  const header = 'Sr. No.,Town,Customer Name\n';
  const rows = data.map((r, i) => `${i + 1},"${r[0]}","${r[1]}"`).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = 'KKGT_Town_Directory.csv'; a.click();
  URL.revokeObjectURL(url);
}

function printDirectory(data) {
  const rows = data.map((r, i) =>
    `<tr style="background:${i % 2 === 0 ? '#fff' : '#f0f7ff'}">
      <td style="padding:7px 12px;border:1px solid #e2e8f0;text-align:center">${i + 1}</td>
      <td style="padding:7px 12px;border:1px solid #e2e8f0;font-weight:600;color:#0F4C81">${r[0]}</td>
      <td style="padding:7px 12px;border:1px solid #e2e8f0">${r[1]}</td>
    </tr>`).join('');
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>KKGT Town Directory</title>
  <style>body{font-family:Arial,sans-serif;padding:20px} table{width:100%;border-collapse:collapse} h2{color:#0F4C81} .meta{color:#64748b;font-size:13px;margin-bottom:16px}</style>
  </head><body>
  <h2>🚛 Kohistan Kashmir Goods Transport Co.</h2>
  <p class="meta">Delivery Towns & Customer Directory — Total Towns: ${UNIQUE_TOWNS} | Total Customers: ${TOTAL_CUSTOMERS}</p>
  <table>
    <thead><tr style="background:#0F4C81;color:white">
      <th style="padding:10px 12px;border:1px solid #0a3560">Sr. No.</th>
      <th style="padding:10px 12px;border:1px solid #0a3560">Town</th>
      <th style="padding:10px 12px;border:1px solid #0a3560">Customer Name</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="margin-top:20px;font-size:12px;color:#94a3b8">Printed on: ${new Date().toLocaleString()}</p>
  </body></html>`);
  win.document.close();
  win.print();
}

export default function TownDirectory({ lang, t }) {
  const [townQ, setTownQ]     = useState('');
  const [custQ, setCustQ]     = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage]       = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filtered = useMemo(() => {
    let d = RAW_DATA.filter(r =>
      r[0].toLowerCase().includes(townQ.toLowerCase()) &&
      r[1].toLowerCase().includes(custQ.toLowerCase())
    );
    d = [...d].sort((a, b) => sortAsc ? a[0].localeCompare(b[0]) : b[0].localeCompare(a[0]));
    return d;
  }, [townQ, custQ, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

  const resetPage = (fn) => { fn(); setPage(1); };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0F4C81 0%, #1a6db5 100%)',
        borderRadius: '1rem', padding: '1.5rem 2rem', marginBottom: '1.5rem',
        boxShadow: '0 8px 32px rgba(15,76,129,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 900, margin: 0, letterSpacing: '0.01em' }}>
            📦 {t('Delivery Towns & Customers', 'ڈیلیوری شہر اور گاہک')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            {t('Customer Network Directory', 'کسٹمر نیٹ ورک ڈائریکٹری')}
          </p>
        </div>
        {/* Stats */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { icon: '📍', label: t('Total Towns', 'کل شہر'), value: UNIQUE_TOWNS, color: '#fbbf24' },
            { icon: '🏪', label: t('Total Customers', 'کل گاہک'), value: TOTAL_CUSTOMERS, color: '#34d399' },
            { icon: '🔍', label: t('Filtered', 'فلٹر'), value: filtered.length, color: '#f87171' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.12)', borderRadius: '0.75rem',
              padding: '0.6rem 1.1rem', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.18)', minWidth: '90px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{
        background: 'white', borderRadius: '0.875rem', padding: '1rem 1.25rem',
        marginBottom: '1rem', boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem',
        alignItems: 'center', flexWrap: 'wrap'
      }}>
        <input
          placeholder={`🔍 ${t('Search by town...', 'شہر تلاش کریں...')}`}
          value={townQ} onChange={e => resetPage(() => setTownQ(e.target.value))}
          style={searchStyle}
        />
        <input
          placeholder={`🔍 ${t('Search by customer...', 'گاہک تلاش کریں...')}`}
          value={custQ} onChange={e => resetPage(() => setCustQ(e.target.value))}
          style={searchStyle}
        />
        <button onClick={() => setSortAsc(s => !s)} style={toolBtn('#0F4C81')}>
          {sortAsc ? '⬆️' : '⬇️'} {t('Sort Town', 'شہر ترتیب')}
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => exportCSV(filtered)} style={toolBtn('#16A34A')}>
            📊 {t('Excel', 'ایکسل')}
          </button>
          <button onClick={() => printDirectory(filtered)} style={toolBtn('#DC2626')}>
            🖨️ {t('Print / PDF', 'پرنٹ')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'white', borderRadius: '0.875rem', overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', marginBottom: '1rem'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(90deg, #0F4C81, #1a6db5)', color: 'white' }}>
                {['Sr.', t('Town Name', 'شہر'), t('Customer Name', 'گاہک')].map((h, i) => (
                  <th key={i} style={{
                    padding: '0.9rem 1.1rem', fontWeight: 700, fontSize: '0.8rem',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    textAlign: i === 0 ? 'center' : 'left',
                    borderBottom: '2px solid #0a3560'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontWeight: 600 }}>
                  {t('No results found', 'کوئی نتیجہ نہیں ملا')}
                </td></tr>
              ) : paginated.map((row, i) => {
                const absIdx = (page - 1) * pageSize + i + 1;
                return (
                  <tr key={i} className="dir-row" style={{
                    background: i % 2 === 0 ? '#fff' : '#f8faff',
                    transition: 'background 0.15s, transform 0.15s',
                    cursor: 'default'
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#dcfce7';
                      e.currentTarget.style.transform = 'translateX(3px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#f8faff';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <td style={{ padding: '0.8rem 1.1rem', textAlign: 'center', color: '#94a3b8', fontWeight: 700, borderBottom: '1px solid #f1f5f9', width: '60px' }}>
                      {absIdx}
                    </td>
                    <td style={{ padding: '0.8rem 1.1rem', fontWeight: 700, color: '#0F4C81', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ background: '#dbeafe', color: '#0F4C81', borderRadius: '0.35rem', padding: '0.1rem 0.45rem', fontSize: '0.72rem', fontWeight: 800 }}>📍</span>
                        {row[0]}
                      </span>
                    </td>
                    <td style={{ padding: '0.8rem 1.1rem', color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>
                      🏪 {row[1]}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.75rem',
        background: 'white', borderRadius: '0.75rem', padding: '0.75rem 1.25rem',
        border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
      }}>
        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
          {t('Showing', 'دکھائے جا رہے')} <strong>{Math.min((page - 1) * pageSize + 1, filtered.length)}</strong>–<strong>{Math.min(page * pageSize, filtered.length)}</strong> {t('of', 'میں سے')} <strong>{filtered.length}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            style={{ border: '1px solid #e2e8f0', borderRadius: '0.4rem', padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: '#374151' }}>
            {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} / page</option>)}
          </select>
          <button onClick={() => setPage(1)} disabled={page === 1} style={pgBtn(page === 1)}>«</button>
          <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={pgBtn(page === 1)}>‹</button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 3, totalPages - 6));
            const p = start + i;
            return p <= totalPages ? (
              <button key={p} onClick={() => setPage(p)} style={pgBtn(false, p === page)}>{p}</button>
            ) : null;
          })}
          <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} style={pgBtn(page === totalPages)}>›</button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={pgBtn(page === totalPages)}>»</button>
        </div>
      </div>
    </div>
  );
}

const searchStyle = {
  border: '1.5px solid #e2e8f0', borderRadius: '0.55rem', padding: '0.55rem 0.9rem',
  fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
  flex: '1', minWidth: '160px', color: '#1e293b', background: '#f8fafc',
  transition: 'border-color 0.2s'
};

function toolBtn(bg) {
  return {
    background: bg, color: 'white', border: 'none', borderRadius: '0.55rem',
    padding: '0.55rem 1rem', fontWeight: 700, fontSize: '0.82rem',
    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'opacity 0.2s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
  };
}

function pgBtn(disabled, active = false) {
  return {
    minWidth: '32px', height: '32px', borderRadius: '0.4rem', border: '1px solid',
    borderColor: active ? '#0F4C81' : '#e2e8f0',
    background: active ? '#0F4C81' : disabled ? '#f8fafc' : 'white',
    color: active ? 'white' : disabled ? '#cbd5e1' : '#374151',
    fontWeight: 700, fontSize: '0.82rem', cursor: disabled ? 'default' : 'pointer',
    transition: 'all 0.15s'
  };
}
