import { useState, useEffect } from 'react';
import api from '../../api/client';

export default function PurchasingReports() {
  const [activeTab, setActiveTab] = useState<'balances' | 'aging' | 'purchases' | 'statement'>('balances');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tab 1: Balances
  const [balances, setBalances] = useState<any[]>([]);

  // Tab 2: Aging
  const [aging, setAging] = useState<any[]>([]);

  // Tab 3: Purchases by Supplier
  const [purchases, setPurchases] = useState<any[]>([]);
  const [purchasesFromDate, setPurchasesFromDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [purchasesToDate, setPurchasesToDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Tab 4: Statement
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [statementStartDate, setStatementStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [statementEndDate, setStatementEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [statementData, setStatementData] = useState<any>(null);

  useEffect(() => {
    fetchInitialSuppliers();
    loadActiveTabData();
  }, [activeTab]);

  const fetchInitialSuppliers = async () => {
    try {
      const res = await api.get('/purchasing/suppliers');
      setSuppliersList(res.data.data || []);
      if (res.data.data && res.data.data.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(res.data.data[0].id);
      }
    } catch {
      // ignore
    }
  };

  const loadActiveTabData = async () => {
    setLoading(true);
    setMsg(null);
    try {
      if (activeTab === 'balances') {
        const res = await api.get('/purchasing/reports/supplier-balances');
        setBalances(res.data.data || []);
      } else if (activeTab === 'aging') {
        const res = await api.get('/purchasing/reports/supplier-aging');
        setAging(res.data.data || []);
      } else if (activeTab === 'purchases') {
        fetchPurchasesBySupplier();
      } else if (activeTab === 'statement') {
        if (selectedSupplierId) {
          fetchStatement();
        }
      }
    } catch {
      setMsg({ type: 'error', text: 'فشل في تحميل بيانات التقرير' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchasesBySupplier = async () => {
    setLoading(true);
    try {
      const res = await api.get('/purchasing/reports/purchases-by-supplier', {
        params: { fromDate: purchasesFromDate, toDate: purchasesToDate }
      });
      setPurchases(res.data.data || []);
    } catch {
      setMsg({ type: 'error', text: 'فشل في جلب تقرير مشتريات الموردين' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatement = async () => {
    if (!selectedSupplierId) return;
    setLoading(true);
    try {
      const res = await api.get(`/purchasing/suppliers/${selectedSupplierId}/statement`, {
        params: { startDate: statementStartDate, endDate: statementEndDate }
      });
      setStatementData(res.data.data);
    } catch {
      setMsg({ type: 'error', text: 'فشل في جلب كشف الحساب' });
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>
            تقارير المشتريات والموردين
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            تقارير مالية وتحليلية شاملة: الأرصدة، أعمار الديون، المشتريات وكشوف الحسابات
          </p>
        </div>
        <button onClick={printReport} className="btn btn-outline btn-sm">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>print</span>
          طباعة التقرير
        </button>
      </div>

      {msg && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          <span className="material-symbols-outlined">{msg.type === 'success' ? 'check_circle' : 'error'}</span>
          <span>{msg.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: '0.5rem' }}>
        {[
          { id: 'balances', label: 'أرصدة الموردين', icon: 'account_balance_wallet' },
          { id: 'aging', label: 'أعمار ديون الموردين', icon: 'hourglass_bottom' },
          { id: 'purchases', label: 'المشتريات حسب المورد', icon: 'shopping_bag' },
          { id: 'statement', label: 'كشف حساب مورد', icon: 'receipt_long' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === t.id ? '3px solid var(--color-primary)' : '3px solid transparent',
              color: activeTab === t.id ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
              fontWeight: activeTab === t.id ? 700 : 500,
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Balances */}
      {activeTab === 'balances' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>كود المورد</th>
                  <th>اسم المورد</th>
                  <th style={{ textAlign: 'left' }}>إجمالي الفواتير</th>
                  <th style={{ textAlign: 'left' }}>إجمالي المدفوعات</th>
                  <th style={{ textAlign: 'left' }}>الرصيد المستحق الحالي</th>
                  <th>العملة</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>جاري التحميل...</td></tr>
                ) : balances.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem' }}>لا توجد بيانات متاحة</td></tr>
                ) : (
                  balances.map(b => (
                    <tr key={b.id}>
                      <td><span className="numeric font-bold" style={{ color: 'var(--color-primary)' }}>{b.code}</span></td>
                      <td style={{ fontWeight: 600 }}>{b.name_ar}</td>
                      <td className="numeric" style={{ textAlign: 'left' }}>
                        {(Number(b.total_invoices) || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="numeric" style={{ textAlign: 'left', color: '#059669' }}>
                        {(Number(b.total_payments) || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="numeric font-bold" style={{ textAlign: 'left', color: (Number(b.balance) || 0) > 0 ? 'var(--color-error)' : 'inherit' }}>
                        {(Number(b.balance) || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                      </td>
                      <td><span className="numeric">{b.currency_code || 'SAR'}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
              {balances.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700 }}>إجمالي الأرصدة المستحقة:</td>
                    <td className="numeric font-bold" style={{ textAlign: 'left', color: 'var(--color-error)', fontSize: '1.05rem' }}>
                      {balances.reduce((acc, b) => acc + (Number(b.balance) || 0), 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Aging */}
      {activeTab === 'aging' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>المورد</th>
                  <th style={{ textAlign: 'left' }}>غير مستحق (حالي)</th>
                  <th style={{ textAlign: 'left' }}>1 - 30 يوم</th>
                  <th style={{ textAlign: 'left' }}>31 - 60 يوم</th>
                  <th style={{ textAlign: 'left' }}>61 - 90 يوم</th>
                  <th style={{ textAlign: 'left' }}>أكثر من 90 يوم</th>
                  <th style={{ textAlign: 'left' }}>إجمالي الدين</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>جاري التحميل...</td></tr>
                ) : aging.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem' }}>لا توجد ديون مسجلة على الموردين حالياً.</td></tr>
                ) : (
                  aging.map((ag, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{ag.supplier_name || ag.name_ar}</td>
                      <td className="numeric" style={{ textAlign: 'left' }}>
                        {(Number(ag.current_amount) || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="numeric" style={{ textAlign: 'left' }}>
                        {(Number(ag.days_1_30) || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="numeric" style={{ textAlign: 'left' }}>
                        {(Number(ag.days_31_60) || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="numeric" style={{ textAlign: 'left' }}>
                        {(Number(ag.days_61_90) || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="numeric" style={{ textAlign: 'left', color: 'var(--color-error)' }}>
                        {(Number(ag.days_90_plus) || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="numeric font-bold" style={{ textAlign: 'left', color: 'var(--color-primary)' }}>
                        {(Number(ag.total_balance) || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Purchases by Supplier */}
      {activeTab === 'purchases' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0 }}>من تاريخ:</label>
              <input
                type="date"
                className="form-input"
                value={purchasesFromDate}
                onChange={e => setPurchasesFromDate(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0 }}>إلى تاريخ:</label>
              <input
                type="date"
                className="form-input"
                value={purchasesToDate}
                onChange={e => setPurchasesToDate(e.target.value)}
              />
            </div>
            <button onClick={fetchPurchasesBySupplier} className="btn btn-primary btn-sm">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>search</span>
              تحديث التقرير
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>كود المورد</th>
                    <th>اسم المورد</th>
                    <th>عدد الفواتير</th>
                    <th style={{ textAlign: 'left' }}>إجمالي المشتريات (ر.س)</th>
                    <th style={{ textAlign: 'left' }}>إجمالي المسدد (ر.س)</th>
                    <th style={{ textAlign: 'left' }}>المتبقي غير المسدد (ر.س)</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>جاري التحميل...</td></tr>
                  ) : purchases.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem' }}>لا توجد مشتريات خلال الفترة المحددة</td></tr>
                  ) : (
                    purchases.map((p, idx) => (
                      <tr key={idx}>
                        <td><span className="numeric font-bold">{p.supplier_code}</span></td>
                        <td style={{ fontWeight: 600 }}>{p.supplier_name}</td>
                        <td><span className="numeric">{p.invoice_count}</span></td>
                        <td className="numeric font-bold" style={{ textAlign: 'left', color: 'var(--color-primary)' }}>
                          {(Number(p.total_purchases) || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="numeric" style={{ textAlign: 'left', color: '#059669' }}>
                          {(Number(p.total_paid) || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="numeric font-bold" style={{ textAlign: 'left', color: (Number(p.outstanding) || 0) > 0 ? 'var(--color-error)' : 'inherit' }}>
                          {(Number(p.outstanding) || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Supplier Statement */}
      {activeTab === 'statement' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 250 }}>
              <label className="form-label" style={{ marginBottom: '0.25rem' }}>المورد *</label>
              <select
                className="form-input"
                value={selectedSupplierId}
                onChange={e => setSelectedSupplierId(e.target.value)}
              >
                {suppliersList.map(s => (
                  <option key={s.id} value={s.id}>{s.name_ar} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: '0.25rem' }}>من تاريخ</label>
              <input
                type="date"
                className="form-input"
                value={statementStartDate}
                onChange={e => setStatementStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: '0.25rem' }}>إلى تاريخ</label>
              <input
                type="date"
                className="form-input"
                value={statementEndDate}
                onChange={e => setStatementEndDate(e.target.value)}
              />
            </div>
            <div style={{ alignSelf: 'flex-end' }}>
              <button onClick={fetchStatement} className="btn btn-primary">
                عرض كشف الحساب
              </button>
            </div>
          </div>

          {statementData && (
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Statement Header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: 'var(--color-surface-variant)', padding: '1rem', borderRadius: 8 }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>اسم المورد:</span>
                  <div style={{ fontWeight: 700 }}>{statementData.supplier?.name_ar}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>كود المورد:</span>
                  <div className="numeric font-bold">{statementData.supplier?.code}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>الرصيد الافتتاحي:</span>
                  <div className="numeric font-bold">
                    {(Number(statementData.openingBalance) || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>الرصيد الختامي:</span>
                  <div className="numeric font-bold" style={{ color: 'var(--color-primary)', fontSize: '1.1rem' }}>
                    {(Number(statementData.closingBalance) || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>نوع المستند</th>
                      <th>رقم المستند</th>
                      <th>البيان / الشرح</th>
                      <th style={{ textAlign: 'left' }}>مدين (سداد)</th>
                      <th style={{ textAlign: 'left' }}>دائن (فاتورة)</th>
                      <th style={{ textAlign: 'left' }}>الرصيد التراكمي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!statementData.transactions || statementData.transactions.length === 0) ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>لا توجد حركات في الفترة المحددة</td></tr>
                    ) : (
                      statementData.transactions.map((t: any, idx: number) => (
                        <tr key={idx}>
                          <td className="numeric">{new Date(t.date).toLocaleDateString('ar-EG')}</td>
                          <td>
                            <span className="chip chip-neutral">{t.type}</span>
                          </td>
                          <td><span className="numeric font-bold">{t.reference_number || t.doc_number}</span></td>
                          <td>{t.description || '-'}</td>
                          <td className="numeric" style={{ textAlign: 'left', color: '#059669' }}>
                            {t.debit > 0 ? Number(t.debit).toLocaleString('ar-SA', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                          <td className="numeric" style={{ textAlign: 'left', color: 'var(--color-error)' }}>
                            {t.credit > 0 ? Number(t.credit).toLocaleString('ar-SA', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                          <td className="numeric font-bold" style={{ textAlign: 'left' }}>
                            {Number(t.running_balance).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
