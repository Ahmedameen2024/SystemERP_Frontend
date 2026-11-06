import { useState, useEffect } from 'react';
import api from '../../api/client';

interface FinancialItem {
  name: string;
  amount: number;
}

interface FinancialData {
  incomeStatement: {
    revenue: FinancialItem[];
    cogs: FinancialItem[];
    expenses: FinancialItem[];
  };
  balanceSheet: {
    assets: {
      current: FinancialItem[];
      nonCurrent: FinancialItem[];
    };
    liabilities: {
      current: FinancialItem[];
      nonCurrent: FinancialItem[];
    };
    equity: FinancialItem[];
  };
}

export default function FinancialStatements() {
  const [statementType, setStatementType] = useState<'income' | 'balance_sheet'>('income');
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStatements = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/accounting/financial-statements');
      setData(res.data?.data || null);
    } catch (err: any) {
      console.error('Failed to load financial statements:', err);
      setError('حدث خطأ في تحميل القوائم المالية من الخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, []);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ر.س';
  };

  const incomeStatement = data?.incomeStatement || { revenue: [], cogs: [], expenses: [] };
  const balanceSheet = data?.balanceSheet || {
    assets: { current: [], nonCurrent: [] },
    liabilities: { current: [], nonCurrent: [] },
    equity: [],
  };

  const totalRevenue = incomeStatement.revenue.reduce((sum, item) => sum + item.amount, 0);
  const totalCogs = incomeStatement.cogs.reduce((sum, item) => sum + item.amount, 0);
  const grossProfit = totalRevenue + totalCogs;
  const totalExpenses = incomeStatement.expenses.reduce((sum, item) => sum + item.amount, 0);
  const netIncome = grossProfit + totalExpenses;

  const totalCurrentAssets = balanceSheet.assets.current.reduce((sum, item) => sum + item.amount, 0);
  const totalNonCurrentAssets = balanceSheet.assets.nonCurrent.reduce((sum, item) => sum + item.amount, 0);
  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

  const totalCurrentLiabilities = balanceSheet.liabilities.current.reduce((sum, item) => sum + item.amount, 0);
  const totalNonCurrentLiabilities = balanceSheet.liabilities.nonCurrent.reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;
  const totalEquity = balanceSheet.equity.reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>
            القوائم المالية
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            التقارير الختامية للوضع المالي والأداء التشغيلي مستخرجة من قاعدة البيانات
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchStatements} disabled={loading}>
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

      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '0.5rem' }}>
        <button
          className={`btn ${statementType === 'income' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setStatementType('income')}
          style={{ borderRadius: '0.5rem 0.5rem 0 0' }}
        >
          قائمة الدخل (الأرباح والخسائر)
        </button>
        <button
          className={`btn ${statementType === 'balance_sheet' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setStatementType('balance_sheet')}
          style={{ borderRadius: '0.5rem 0.5rem 0 0' }}
        >
          الميزانية العمومية (المركز المالي)
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: 32, height: 32, borderWidth: 3 }} />
          جاري إعداد القوائم المالية من قيود اليومية...
        </div>
      ) : statementType === 'income' ? (
        <div className="card" style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-surface-container)', paddingBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}>قائمة الدخل</h2>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)' }}>عن السنة المالية الحالية</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Revenues */}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--color-surface-container)', paddingBottom: '0.25rem' }}>
                الإيرادات التشغيلية
              </div>
              {incomeStatement.revenue.length === 0 ? (
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)', padding: '0.5rem 0' }}>لا توجد حركات إيرادات مسجلة بعد</div>
              ) : (
                incomeStatement.revenue.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.875rem' }}>
                    <span>{item.name}</span>
                    <span className="numeric">{formatCurrency(item.amount)}</span>
                  </div>
                ))
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 700, borderTop: '1px dashed var(--color-outline-variant)' }}>
                <span>إجمالي الإيرادات</span>
                <span className="numeric" style={{ color: '#059669' }}>{formatCurrency(totalRevenue)}</span>
              </div>
            </div>

            {/* COGS */}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#d97706', borderBottom: '1px solid var(--color-surface-container)', paddingBottom: '0.25rem' }}>
                تكلفة المبيعات (تكلفة البضاعة المباعة)
              </div>
              {incomeStatement.cogs.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.875rem' }}>
                  <span>{item.name}</span>
                  <span className="numeric">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 700, borderTop: '1px dashed var(--color-outline-variant)' }}>
                <span>إجمالي تكلفة المبيعات</span>
                <span className="numeric" style={{ color: '#ba1a1a' }}>{formatCurrency(totalCogs)}</span>
              </div>
            </div>

            {/* Gross Profit */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--color-surface-container)', borderRadius: '6px', fontWeight: 800 }}>
              <span>مجمل الربح (الخسارة)</span>
              <span className="numeric" style={{ color: grossProfit >= 0 ? '#059669' : '#ba1a1a' }}>{formatCurrency(grossProfit)}</span>
            </div>

            {/* Expenses */}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#ba1a1a', borderBottom: '1px solid var(--color-surface-container)', paddingBottom: '0.25rem' }}>
                المصروفات التشغيلية والإدارية
              </div>
              {incomeStatement.expenses.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.875rem' }}>
                  <span>{item.name}</span>
                  <span className="numeric">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 700, borderTop: '1px dashed var(--color-outline-variant)' }}>
                <span>إجمالي المصروفات</span>
                <span className="numeric" style={{ color: '#ba1a1a' }}>{formatCurrency(totalExpenses)}</span>
              </div>
            </div>

            {/* Net Income */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: netIncome >= 0 ? 'rgba(5, 150, 105, 0.1)' : 'rgba(186, 26, 26, 0.1)', borderRadius: '8px', fontWeight: 800, fontSize: '1.0625rem', border: `1px solid ${netIncome >= 0 ? '#059669' : '#ba1a1a'}` }}>
              <span>صافي الدخل (الأرباح / الخسائر)</span>
              <span className="numeric" style={{ color: netIncome >= 0 ? '#059669' : '#ba1a1a' }}>{formatCurrency(netIncome)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-surface-container)', paddingBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}>الميزانية العمومية</h2>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)' }}>كما هي في تاريخ اليوم</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Assets */}
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#059669', borderBottom: '2px solid #059669', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                الأصول
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', marginTop: '0.5rem' }}>الأصول المتداولة</div>
              {balanceSheet.assets.current.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', fontSize: '0.875rem' }}>
                  <span>{item.name}</span>
                  <span className="numeric">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', marginTop: '0.5rem' }}>الأصول غير المتداولة (الثابتة)</div>
              {balanceSheet.assets.nonCurrent.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', fontSize: '0.875rem' }}>
                  <span>{item.name}</span>
                  <span className="numeric">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 800, borderTop: '1px solid var(--color-outline-variant)', marginTop: '0.5rem' }}>
                <span>مجموع الأصول</span>
                <span className="numeric" style={{ color: '#059669' }}>{formatCurrency(totalAssets)}</span>
              </div>
            </div>

            {/* Liabilities */}
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#ba1a1a', borderBottom: '2px solid #ba1a1a', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                الالتزامات (الخصوم)
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', marginTop: '0.5rem' }}>الالتزامات المتداولة</div>
              {balanceSheet.liabilities.current.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', fontSize: '0.875rem' }}>
                  <span>{item.name}</span>
                  <span className="numeric">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', marginTop: '0.5rem' }}>الالتزامات غير المتداولة</div>
              {balanceSheet.liabilities.nonCurrent.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', fontSize: '0.875rem' }}>
                  <span>{item.name}</span>
                  <span className="numeric">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 800, borderTop: '1px solid var(--color-outline-variant)', marginTop: '0.5rem' }}>
                <span>مجموع الالتزامات</span>
                <span className="numeric" style={{ color: '#ba1a1a' }}>{formatCurrency(totalLiabilities)}</span>
              </div>
            </div>

            {/* Equity */}
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '2px solid var(--color-primary)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                حقوق الملكية
              </div>
              {balanceSheet.equity.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', fontSize: '0.875rem' }}>
                  <span>{item.name}</span>
                  <span className="numeric">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 800, borderTop: '1px solid var(--color-outline-variant)', marginTop: '0.5rem' }}>
                <span>مجموع حقوق الملكية</span>
                <span className="numeric" style={{ color: 'var(--color-primary)' }}>{formatCurrency(totalEquity)}</span>
              </div>
            </div>

            {/* Total Liabilities & Equity Check */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--color-surface-container)', borderRadius: '8px', fontWeight: 800, fontSize: '1.0625rem' }}>
              <span>مجموع الالتزامات وحقوق الملكية</span>
              <span className="numeric" style={{ color: 'var(--color-primary)' }}>{formatCurrency(totalLiabilitiesAndEquity)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
