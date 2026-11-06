import { useState, useEffect } from 'react';
import api from '../../api/client';

interface LedgerLine {
  id: string;
  date: string;
  ref: string;
  desc: string;
  debit: number;
  credit: number;
  balance: number;
  status: string;
}

interface GLAccount {
  id: string;
  code: string;
  name_ar: string;
}

export default function AccountDetails() {
  const [accounts, setAccounts] = useState<GLAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  
  const [lines, setLines] = useState<LedgerLine[]>([]);
  const [summary, setSummary] = useState({ totalDebit: 0, totalCredit: 0, finalBalance: 0, count: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch GL accounts for dropdown
  useEffect(() => {
    api.get('/accounting/accounts')
      .then(res => {
        const list = res.data?.data || [];
        setAccounts(list);
        if (list.length > 0) {
          setSelectedAccountId(list[0].id);
        }
      })
      .catch(err => console.error('Failed to load accounts:', err));
  }, []);

  // 2. Fetch ledger details
  const fetchLedger = async () => {
    if (!selectedAccountId) return;
    setLoading(true);
    setError('');
    try {
      let url = `/accounting/account-details?accountId=${selectedAccountId}`;
      if (fromDate) url += `&fromDate=${fromDate}`;
      if (toDate) url += `&toDate=${toDate}`;

      const res = await api.get(url);
      const resData = res.data?.data || {};
      setLines(resData.lines || []);
      setSummary({
        totalDebit: resData.totalDebit || 0,
        totalCredit: resData.totalCredit || 0,
        finalBalance: resData.finalBalance || 0,
        count: resData.count || 0,
      });
    } catch (err: any) {
      console.error('Failed to load ledger:', err);
      setError('حدث خطأ أثناء تحميل كشف الحساب من الخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccountId) {
      fetchLedger();
    }
  }, [selectedAccountId]);

  const fmt = (n: number) => n > 0 ? n.toLocaleString('ar-SA', { minimumFractionDigits: 2 }) : '0.00';

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>كشف الحساب التفصيلي (دفتر الأستاذ)</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            استعراض حركات الحساب التفصيلية والرصيد التراكمي في الوقت الفعلي
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchLedger} disabled={loading}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
            تحديث
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
            طباعة
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select 
          className="input" 
          style={{ minWidth: 260 }}
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
        >
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>
              {acc.code} - {acc.name_ar}
            </option>
          ))}
        </select>
        <input 
          type="date" 
          className="input" 
          style={{ maxWidth: 160 }}
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          placeholder="من تاريخ"
        />
        <input 
          type="date" 
          className="input" 
          style={{ maxWidth: 160 }}
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          placeholder="إلى تاريخ"
        />
        <button className="btn btn-primary btn-sm" onClick={fetchLedger} disabled={loading}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>search</span>
          عرض
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ padding: '0.75rem 1rem', borderRadius: 8, background: '#fee2e2', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'إجمالي المدين', value: `${summary.totalDebit.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س`, color: '#059669' },
          { label: 'إجمالي الدائن', value: `${summary.totalCredit.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س`, color: '#ba1a1a' },
          { label: 'الرصيد الختامي', value: `${summary.finalBalance.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س`, color: 'var(--color-primary)' },
          { label: 'عدد الحركات', value: `${summary.count} حركة`, color: 'var(--color-secondary)' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ borderTop: `3px solid ${k.color}` }}>
            <span className="kpi-label">{k.label}</span>
            <div className="kpi-value numeric" style={{ color: k.color, fontSize: '1.25rem' }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem', width: 32, height: 32, borderWidth: 3 }} />
            جاري استرجاع قيود الحساب من قاعدة البيانات...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>المرجع</th>
                <th>البيان</th>
                <th style={{ textAlign: 'left' }}>مدين</th>
                <th style={{ textAlign: 'left' }}>دائن</th>
                <th style={{ textAlign: 'left' }}>الرصيد</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد حركات مسجلة لهذا الحساب في الفترة المحددة
                  </td>
                </tr>
              ) : (
                lines.map((l, i) => (
                  <tr key={l.id || i}>
                    <td className="numeric">{l.date ? new Date(l.date).toLocaleDateString('ar-SA') : '—'}</td>
                    <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.8125rem' }}>{l.ref}</span></td>
                    <td>{l.desc}</td>
                    <td className="numeric" style={{ textAlign: 'left', color: '#059669' }}>{fmt(l.debit)}</td>
                    <td className="numeric" style={{ textAlign: 'left', color: '#ba1a1a' }}>{fmt(l.credit)}</td>
                    <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>{l.balance.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
