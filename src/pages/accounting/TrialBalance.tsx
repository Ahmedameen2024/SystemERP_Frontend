import { useState, useEffect } from 'react';
import api from '../../api/client';

interface TrialBalanceAccount {
  account_id: string;
  account_code: string;
  account_name_ar: string;
  account_name_en: string;
  account_type: string;
  nature: string;
  total_debit: string | number;
  total_credit: string | number;
  balance: string | number;
}

export default function TrialBalance() {
  const [accounts, setAccounts] = useState<TrialBalanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTrialBalance = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/accounting/trial-balance');
      setAccounts(res.data?.data || []);
    } catch (err: any) {
      console.error('Failed to load trial balance:', err);
      setError('حدث خطأ في تحميل بيانات ميزان المراجعة من الخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrialBalance();
  }, []);

  const totalDebit = accounts.reduce((s, a) => s + Number(a.total_debit || 0), 0);
  const totalCredit = accounts.reduce((s, a) => s + Number(a.total_credit || 0), 0);
  const fmt = (n: number) => n.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const typeColors: Record<string, string> = { 
    Asset: '#059669', 
    Liability: '#d97706', 
    Equity: '#4c56af', 
    Revenue: '#8237b2', 
    Expense: '#ba1a1a' 
  };
  const typeLabels: Record<string, string> = { 
    Asset: 'أصول', 
    Liability: 'التزامات', 
    Equity: 'حقوق ملكية', 
    Revenue: 'إيرادات', 
    Expense: 'مصروفات' 
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>ميزان المراجعة</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            بيانات فعلية مستخرجة مباشرة من قيود اليومية وحسابات الأستاذ العام
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchTrialBalance} disabled={loading}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
            تحديث
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
            طباعة
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ padding: '0.75rem 1rem', borderRadius: 8, background: '#fee2e2', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem', width: 32, height: 32, borderWidth: 3 }} />
            جاري جلب بيانات ميزان المراجعة من قاعدة البيانات...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم الحساب</th>
                <th>اسم الحساب</th>
                <th>النوع</th>
                <th style={{ textAlign: 'left' }}>الأرصدة المدينة</th>
                <th style={{ textAlign: 'left' }}>الأرصدة الدائنة</th>
                <th style={{ textAlign: 'left' }}>الرصيد</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد حسابات مسجلة
                  </td>
                </tr>
              ) : (
                accounts.map(a => {
                  const d = Number(a.total_debit || 0);
                  const c = Number(a.total_credit || 0);
                  const bal = Number(a.balance || 0);
                  return (
                    <tr key={a.account_id || a.account_code}>
                      <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{a.account_code}</span></td>
                      <td style={{ fontWeight: 500 }}>{a.account_name_ar}</td>
                      <td>
                        <span className="chip" style={{ background: `${typeColors[a.account_type] || '#666'}15`, color: typeColors[a.account_type] || '#666' }}>
                          {typeLabels[a.account_type] || a.account_type}
                        </span>
                      </td>
                      <td className="numeric" style={{ textAlign: 'left' }}>{d > 0 ? fmt(d) : '0.00'}</td>
                      <td className="numeric" style={{ textAlign: 'left' }}>{c > 0 ? fmt(c) : '0.00'}</td>
                      <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>{fmt(Math.abs(bal))}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--color-surface-container)', fontWeight: 800 }}>
                <td colSpan={3} style={{ padding: '0.875rem 1rem', fontSize: '0.875rem' }}>الإجمالي العام</td>
                <td className="numeric" style={{ padding: '0.875rem 1rem', textAlign: 'left', color: 'var(--color-primary)', fontSize: '0.9375rem' }}>{fmt(totalDebit)}</td>
                <td className="numeric" style={{ padding: '0.875rem 1rem', textAlign: 'left', color: 'var(--color-primary)', fontSize: '0.9375rem' }}>{fmt(totalCredit)}</td>
                <td style={{ padding: '0.875rem 1rem' }}>
                  <span className={Math.abs(totalDebit - totalCredit) < 0.01 ? 'chip chip-success' : 'chip chip-error'}>
                    {Math.abs(totalDebit - totalCredit) < 0.01 ? '✓ متوازن' : '✗ غير متوازن'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
