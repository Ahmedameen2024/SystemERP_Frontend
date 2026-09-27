import { useState, useEffect } from 'react';
import api from '../../api/client';

interface Currency {
  id: string;
  code: string;
  name_ar: string;
  symbol: string;
}

interface SupplierCurrency {
  currency_id: string;
  currency_code: string;
  currency_name: string;
  symbol?: string;
  balance: number | string;
  opening_balance: number | string;
  credit_limit: number | string | null;
  is_default: boolean;
}

interface SupplierGroup {
  id: string;
  code: string;
  name_ar: string;
}

interface SupplierType {
  id: string;
  code: string;
  name_ar: string;
}

interface PaymentTerm {
  id: string;
  code: string;
  name_ar: string;
  days: number;
}

interface GLAccount {
  id: string;
  code: string;
  name_ar: string;
}

interface Supplier {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  contact_person: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  tax_number: string;
  cr_number: string;
  credit_limit: number | null;
  opening_balance: number;
  balance: number;
  currency_id: string;
  currency_code: string;
  currency_name: string;
  currencies?: SupplierCurrency[];
  group_id?: string;
  group_name?: string;
  type_id?: string;
  type_name?: string;
  payment_term_id?: string;
  payment_term_name?: string;
  payment_days?: number;
  payment_terms?: number;
  ap_account_id?: string;
  ap_account_code?: string;
  ap_account_name?: string;
  rating?: number;
  status: 'Active' | 'Inactive';
}

interface SupplierForm {
  nameAr: string;
  nameEn: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  taxNumber: string;
  crNumber: string;
  creditLimit: string;
  openingBalance: string;
  currencyId: string;
  currencyIds: string[];
  groupId: string;
  typeId: string;
  paymentTermId: string;
  apAccountId: string;
  paymentTerms: string;
  status: 'Active' | 'Inactive';
}

const emptyForm: SupplierForm = {
  nameAr: '',
  nameEn: '',
  contactPerson: '',
  phone: '',
  email: '',
  city: '',
  address: '',
  taxNumber: '',
  crNumber: '',
  creditLimit: '',
  openingBalance: '',
  currencyId: '',
  currencyIds: [],
  groupId: '',
  typeId: '',
  paymentTermId: '',
  apAccountId: '',
  paymentTerms: '30',
  status: 'Active',
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [groups, setGroups] = useState<SupplierGroup[]>([]);
  const [types, setTypes] = useState<SupplierType[]>([]);
  const [paymentTermsList, setPaymentTermsList] = useState<PaymentTerm[]>([]);
  const [accounts, setAccounts] = useState<GLAccount[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof SupplierForm, string>>>({});
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');

  // Profile / Evaluation Drawer State
  const [activeProfile, setActiveProfile] = useState<Supplier | null>(null);
  const [profileTab, setProfileTab] = useState<'overview' | 'statement' | 'evaluations'>('overview');
  const [profileOverview, setProfileOverview] = useState<any>(null);
  const [profileStatement, setProfileStatement] = useState<any>(null);
  const [profileEvaluations, setProfileEvaluations] = useState<any[]>([]);
  const [evalLoading, setEvalLoading] = useState(false);
  const [newEval, setNewEval] = useState({
    rating: 5,
    qualityScore: 5,
    deliveryScore: 5,
    priceScore: 5,
    serviceScore: 5,
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [suppRes, curRes, grpRes, typRes, ptRes, accRes] = await Promise.all([
        api.get('/purchasing/suppliers').catch(() => api.get('/setup/suppliers')),
        api.get('/setup/currencies').catch(() => ({ data: { data: [] } })),
        api.get('/purchasing/supplier-groups').catch(() => ({ data: { data: [] } })),
        api.get('/purchasing/supplier-types').catch(() => ({ data: { data: [] } })),
        api.get('/purchasing/payment-terms').catch(() => ({ data: { data: [] } })),
        api.get('/accounting/accounts').catch(() => ({ data: { data: [] } })),
      ]);

      setSuppliers(suppRes.data.data || []);
      setCurrencies((curRes.data.data || []).filter((c: any) => c.status === 'Active' || !('status' in c)));
      setGroups(grpRes.data.data || []);
      setTypes(typRes.data.data || []);
      setPaymentTermsList(ptRes.data.data || []);
      // Filter payable accounts (liability / AP)
      const accList = (accRes.data.data || []).filter((a: any) =>
        a.account_type === 'Liability' || a.category === 'AP' || a.is_leaf === true || a.code?.startsWith('2')
      );
      setAccounts(accList.length > 0 ? accList : (accRes.data.data || []));
    } catch {
      setError('تعذّر تحميل البيانات، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof SupplierForm, string>> = {};
    if (!form.nameAr.trim()) errors.nameAr = 'الاسم العربي مطلوب';
    if (form.currencyIds.length === 0) errors.currencyId = 'يجب اختيار عملة واحدة على الأقل للمورد';
    if (form.creditLimit !== '' && form.creditLimit !== null) {
      const val = parseFloat(form.creditLimit);
      if (isNaN(val) || val < 0) errors.creditLimit = 'الحد الائتماني يجب أن يكون رقماً موجباً أو صفراً';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAdd = () => {
    setEditItem(null);
    const defCurIds = currencies.length > 0 ? [currencies[0].id] : [];
    setForm({
      ...emptyForm,
      currencyIds: defCurIds,
      currencyId: defCurIds[0] || '',
      groupId: groups.length > 0 ? groups[0].id : '',
      typeId: types.length > 0 ? types[0].id : '',
      paymentTermId: paymentTermsList.length > 0 ? paymentTermsList[0].id : '',
    });
    setValidationErrors({});
    setShowModal(true);
  };

  const openEdit = (s: Supplier) => {
    setEditItem(s);
    const assignedCurIds = (s.currencies && s.currencies.length > 0)
      ? s.currencies.map(c => c.currency_id)
      : (s.currency_id ? [s.currency_id] : (currencies.length > 0 ? [currencies[0].id] : []));

    setForm({
      nameAr: s.name_ar,
      nameEn: s.name_en || '',
      contactPerson: s.contact_person || '',
      phone: s.phone || '',
      email: s.email || '',
      city: s.city || '',
      address: s.address || '',
      taxNumber: s.tax_number || '',
      crNumber: s.cr_number || '',
      creditLimit: s.credit_limit !== null && s.credit_limit !== undefined ? String(s.credit_limit) : '',
      openingBalance: String(s.opening_balance || 0),
      currencyId: assignedCurIds[0] || '',
      currencyIds: assignedCurIds,
      groupId: s.group_id || '',
      typeId: s.type_id || '',
      paymentTermId: s.payment_term_id || '',
      apAccountId: s.ap_account_id || '',
      paymentTerms: String(s.payment_terms || s.payment_days || 30),
      status: s.status,
    });
    setValidationErrors({});
    setShowModal(true);
  };

  const toggleCurrency = (curId: string) => {
    setForm(prev => {
      const exists = prev.currencyIds.includes(curId);
      if (exists) {
        if (prev.currencyIds.length === 1) return prev;
        const updated = prev.currencyIds.filter(id => id !== curId);
        return { ...prev, currencyIds: updated, currencyId: updated[0] || '' };
      } else {
        const updated = [...prev.currencyIds, curId];
        return { ...prev, currencyIds: updated, currencyId: updated[0] };
      }
    });
    setValidationErrors(v => ({ ...v, currencyId: undefined }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        nameAr: form.nameAr,
        nameEn: form.nameEn || null,
        contactPerson: form.contactPerson || null,
        phone: form.phone || null,
        email: form.email || null,
        city: form.city || null,
        address: form.address || null,
        taxNumber: form.taxNumber || null,
        crNumber: form.crNumber || null,
        creditLimit: form.creditLimit !== '' ? parseFloat(form.creditLimit) : null,
        openingBalance: form.openingBalance !== '' ? parseFloat(form.openingBalance) : 0,
        currencyId: form.currencyIds[0] || form.currencyId || null,
        currencyIds: form.currencyIds,
        groupId: form.groupId || null,
        typeId: form.typeId || null,
        paymentTermId: form.paymentTermId || null,
        apAccountId: form.apAccountId || null,
        paymentTerms: parseInt(form.paymentTerms) || 30,
        status: form.status,
      };

      if (editItem) {
        await api.put(`/purchasing/suppliers/${editItem.id}`, payload).catch(() => api.put(`/setup/suppliers/${editItem.id}`, payload));
      } else {
        await api.post('/purchasing/suppliers', payload).catch(() => api.post('/setup/suppliers', payload));
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطأ في حفظ المورد');
    } finally {
      setSaving(false);
    }
  };

  const openProfile = async (s: Supplier) => {
    setActiveProfile(s);
    setProfileTab('overview');
    setEvalLoading(true);
    try {
      const [ovRes, stRes, evRes] = await Promise.all([
        api.get(`/purchasing/suppliers/${s.id}/overview`).catch(() => ({ data: { data: null } })),
        api.get(`/purchasing/suppliers/${s.id}/statement`).catch(() => ({ data: { data: null } })),
        api.get(`/purchasing/suppliers/${s.id}/evaluations`).catch(() => ({ data: { data: [] } })),
      ]);
      setProfileOverview(ovRes.data.data);
      setProfileStatement(stRes.data.data);
      setProfileEvaluations(evRes.data.data || []);
    } catch {
      // ignore
    } finally {
      setEvalLoading(false);
    }
  };

  const handleAddEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile) return;
    try {
      await api.post(`/purchasing/suppliers/${activeProfile.id}/evaluations`, newEval);
      const evRes = await api.get(`/purchasing/suppliers/${activeProfile.id}/evaluations`);
      setProfileEvaluations(evRes.data.data || []);
      alert('تم إضافة تقييم المورد بنجاح');
      setNewEval({
        rating: 5,
        qualityScore: 5,
        deliveryScore: 5,
        priceScore: 5,
        serviceScore: 5,
        notes: '',
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'فشل حفظ التقييم');
    }
  };

  const filtered = suppliers.filter(s => {
    const matchSearch =
      s.name_ar?.includes(search) ||
      (s.code && s.code.toLowerCase().includes(search.toLowerCase())) ||
      (s.phone && s.phone.includes(search));
    const matchGroup = !groupFilter || s.group_id === groupFilter;
    return matchSearch && matchGroup;
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, margin: 0 }}>دليل الموردين الشامل</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            إدارة الموردين، تصنيفاتهم، شروط الدفع، الأرصدة المستقلة بالعملات، وتقييمات الأداء
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
          إضافة مورد جديد
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', minWidth: 280, flex: 1 }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)', fontSize: 18 }}>search</span>
          <input className="input" placeholder="بحث بالكود، الاسم أو الهاتف..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingRight: '2.5rem' }} />
        </div>

        {groups.length > 0 && (
          <div style={{ minWidth: 200 }}>
            <select className="input" value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
              <option value="">جميع المجموعات</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name_ar} ({g.code})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Suppliers Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>كود المورد</th>
                  <th>الاسم</th>
                  <th>المجموعة / النوع</th>
                  <th>الشخص المسؤول</th>
                  <th>الهاتف</th>
                  <th>شروط الدفع</th>
                  <th style={{ textAlign: 'left' }}>الحد الائتماني</th>
                  <th style={{ textAlign: 'left' }}>الرصيد الحالي</th>
                  <th>الحالة</th>
                  <th style={{ textAlign: 'center' }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-on-surface-variant)' }}>
                      لا يوجد موردون مطابقون للبحث.
                    </td>
                  </tr>
                ) : (
                  filtered.map(s => {
                    const balanceNum = Number(s.balance) || 0;
                    const creditNum = s.credit_limit ? Number(s.credit_limit) : null;
                    const isOverCredit = creditNum !== null && balanceNum > creditNum;

                    return (
                      <tr key={s.id}>
                        <td>
                          <span className="numeric font-bold" style={{ color: 'var(--color-primary)' }}>
                            {s.code}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{s.name_ar}</div>
                          {s.name_en && <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>{s.name_en}</div>}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{s.group_name || 'عام'}</div>
                          {s.type_name && <span className="chip chip-neutral" style={{ fontSize: '0.7rem' }}>{s.type_name}</span>}
                        </td>
                        <td>{s.contact_person || '-'}</td>
                        <td className="numeric">{s.phone || '-'}</td>
                        <td>
                          <span style={{ fontSize: '0.8rem' }}>
                            {s.payment_term_name || `${s.payment_terms || 30} يوم`}
                          </span>
                        </td>
                        <td className="numeric" style={{ textAlign: 'left' }}>
                          {creditNum !== null ? (
                            <span style={{ fontWeight: 600 }}>
                              {creditNum.toLocaleString('ar-SA')} {s.currency_code || 'SAR'}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.8rem' }}>غير محدد</span>
                          )}
                        </td>
                        <td className="numeric font-bold" style={{ textAlign: 'left', color: isOverCredit ? 'var(--color-error)' : balanceNum > 0 ? 'var(--color-primary)' : 'inherit' }}>
                          <div>{balanceNum.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} {s.currency_code || 'SAR'}</div>
                          {isOverCredit && (
                            <span className="chip chip-danger" style={{ fontSize: '0.65rem', marginTop: 2 }}>
                              تجاوز الائتمان!
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`chip ${s.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>
                            {s.status === 'Active' ? 'نشط' : 'معطل'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => openProfile(s)}
                              title="الملف التعريفي وكشف الحساب والتقييم"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>account_circle</span>
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => openEdit(s)}
                              title="تعديل المورد"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Supplier Profile & Evaluation Modal */}
      {activeProfile && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 850 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'var(--color-primary)' }}>local_shipping</span>
                <div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                    ملف المورد: {activeProfile.name_ar} ({activeProfile.code})
                  </h2>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>
                    {activeProfile.contact_person ? `المسؤول: ${activeProfile.contact_person} | ` : ''}
                    {activeProfile.phone ? `هاتف: ${activeProfile.phone}` : ''}
                  </div>
                </div>
              </div>
              <button onClick={() => setActiveProfile(null)} className="btn-close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Profile Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', padding: '0 1.25rem', gap: '1rem' }}>
              {[
                { id: 'overview', label: 'نظرة عامة والائتمان', icon: 'dashboard' },
                { id: 'statement', label: 'كشف الحساب', icon: 'receipt_long' },
                { id: 'evaluations', label: 'تقييمات الأداء', icon: 'star' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setProfileTab(t.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.75rem 0.5rem',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: profileTab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                    color: profileTab === t.id ? 'var(--color-primary)' : 'inherit',
                    fontWeight: profileTab === t.id ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '1.25rem' }}>
              {evalLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>جاري التحميل...</div>
              ) : (
                <>
                  {/* TAB 1: Overview */}
                  {profileTab === 'overview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                        <div className="kpi-card" style={{ padding: '0.75rem' }}>
                          <span className="kpi-label" style={{ fontSize: '0.75rem' }}>الرصيد المستحق الحالي</span>
                          <span className="kpi-value numeric" style={{ fontSize: '1.2rem', color: 'var(--color-error)' }}>
                            {(Number(activeProfile.balance) || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="kpi-card" style={{ padding: '0.75rem' }}>
                          <span className="kpi-label" style={{ fontSize: '0.75rem' }}>الحد الائتماني</span>
                          <span className="kpi-value numeric" style={{ fontSize: '1.2rem' }}>
                            {activeProfile.credit_limit ? `${Number(activeProfile.credit_limit).toLocaleString('ar-SA')}` : 'غير مقيد'}
                          </span>
                        </div>
                        <div className="kpi-card" style={{ padding: '0.75rem' }}>
                          <span className="kpi-label" style={{ fontSize: '0.75rem' }}>إجمالي المشتريات</span>
                          <span className="kpi-value numeric" style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                            {(Number(profileOverview?.total_purchases) || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="kpi-card" style={{ padding: '0.75rem' }}>
                          <span className="kpi-label" style={{ fontSize: '0.75rem' }}>إجمالي المسدد</span>
                          <span className="kpi-value numeric" style={{ fontSize: '1.2rem', color: '#059669' }}>
                            {(Number(profileOverview?.total_paid) || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: 8 }}>
                        <div>
                          <strong>المجموعة:</strong> {activeProfile.group_name || 'عام'}
                        </div>
                        <div>
                          <strong>النوع:</strong> {activeProfile.type_name || 'مورد محلي'}
                        </div>
                        <div>
                          <strong>الرقم الضريبي:</strong> {activeProfile.tax_number || '-'}
                        </div>
                        <div>
                          <strong>السجل التجاري:</strong> {activeProfile.cr_number || '-'}
                        </div>
                        <div>
                          <strong>الحساب المحاسبي (AP):</strong> {activeProfile.ap_account_name || '21101 - الموردون التجاريون'}
                        </div>
                        <div>
                          <strong>العنوان والمدينة:</strong> {activeProfile.city} {activeProfile.address ? `- ${activeProfile.address}` : ''}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Statement */}
                  {profileTab === 'statement' && (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>التاريخ</th>
                            <th>النوع</th>
                            <th>رقم السند</th>
                            <th>البيان</th>
                            <th style={{ textAlign: 'left' }}>مدين (سداد)</th>
                            <th style={{ textAlign: 'left' }}>دائن (فاتورة)</th>
                            <th style={{ textAlign: 'left' }}>الرصيد التراكمي</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(!profileStatement?.transactions || profileStatement.transactions.length === 0) ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '1.5rem' }}>لا توجد حركات مسجلة</td></tr>
                          ) : (
                            profileStatement.transactions.map((t: any, idx: number) => (
                              <tr key={idx}>
                                <td className="numeric">{new Date(t.date).toLocaleDateString('ar-EG')}</td>
                                <td><span className="chip chip-neutral">{t.type}</span></td>
                                <td className="numeric font-bold">{t.reference_number || t.doc_number}</td>
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
                  )}

                  {/* TAB 3: Evaluations */}
                  {profileTab === 'evaluations' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {/* Add Evaluation Form */}
                      <form onSubmit={handleAddEvaluation} style={{ background: '#f8fafc', padding: '1rem', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>تسجيل تقييم جديد للمورد</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                          <div>
                            <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>جودة المنتجات (1-5)</label>
                            <input
                              type="number" min={1} max={5} className="form-input"
                              value={newEval.qualityScore}
                              onChange={e => setNewEval({ ...newEval, qualityScore: Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>الالتزام بالمواعيد (1-5)</label>
                            <input
                              type="number" min={1} max={5} className="form-input"
                              value={newEval.deliveryScore}
                              onChange={e => setNewEval({ ...newEval, deliveryScore: Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>الأسعار والتنافسية (1-5)</label>
                            <input
                              type="number" min={1} max={5} className="form-input"
                              value={newEval.priceScore}
                              onChange={e => setNewEval({ ...newEval, priceScore: Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>خدمة العملاء (1-5)</label>
                            <input
                              type="number" min={1} max={5} className="form-input"
                              value={newEval.serviceScore}
                              onChange={e => setNewEval({ ...newEval, serviceScore: Number(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="ملاحظات حول أداء المورد..."
                            style={{ flex: 1 }}
                            value={newEval.notes}
                            onChange={e => setNewEval({ ...newEval, notes: e.target.value })}
                          />
                          <button type="submit" className="btn btn-primary btn-sm">
                            حفظ التقييم
                          </button>
                        </div>
                      </form>

                      {/* Evaluations List */}
                      <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>التاريخ</th>
                              <th>المقيّم</th>
                              <th>الجودة</th>
                              <th>التسليم</th>
                              <th>الأسعار</th>
                              <th>الخدمة</th>
                              <th>المتوسط</th>
                              <th>الملاحظات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {profileEvaluations.length === 0 ? (
                              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '1.5rem' }}>لا توجد تقييمات سابقة لهذا المورد</td></tr>
                            ) : (
                              profileEvaluations.map((ev, idx) => (
                                <tr key={idx}>
                                  <td className="numeric">{new Date(ev.evaluation_date || ev.created_at).toLocaleDateString('ar-EG')}</td>
                                  <td>{ev.evaluator_name || 'مسؤول المشتريات'}</td>
                                  <td className="numeric">{ev.quality_score}/5</td>
                                  <td className="numeric">{ev.delivery_score}/5</td>
                                  <td className="numeric">{ev.price_score}/5</td>
                                  <td className="numeric">{ev.service_score}/5</td>
                                  <td>
                                    <span className="chip chip-success" style={{ fontWeight: 700 }}>
                                      {(Number(ev.overall_score || ev.rating) || 5).toFixed(1)} ★
                                    </span>
                                  </td>
                                  <td style={{ fontSize: '0.8rem' }}>{ev.notes || '-'}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1.25rem', borderTop: '1px solid var(--color-border)' }}>
              <button onClick={() => setActiveProfile(null)} className="btn btn-outline">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 750, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                {editItem ? `تعديل المورد: ${editItem.name_ar}` : 'إضافة مورد جديد'}
              </h2>
              <button onClick={() => setShowModal(false)} className="btn-close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem' }}>
              {/* Basic Info */}
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 0.75rem', paddingBottom: '0.25rem', borderBottom: '1px solid var(--color-border)' }}>
                  البيانات الأساسية والتصنيف
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">الاسم بالعربية *</label>
                    <input
                      className="form-input"
                      value={form.nameAr}
                      onChange={e => setForm({ ...form, nameAr: e.target.value })}
                      required
                    />
                    {validationErrors.nameAr && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem' }}>{validationErrors.nameAr}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">الاسم بالإنجليزية</label>
                    <input
                      className="form-input"
                      value={form.nameEn}
                      onChange={e => setForm({ ...form, nameEn: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">مجموعة الموردين</label>
                    <select
                      className="form-input"
                      value={form.groupId}
                      onChange={e => setForm({ ...form, groupId: e.target.value })}
                    >
                      <option value="">-- اختياري --</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name_ar}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">نوع المورد</label>
                    <select
                      className="form-input"
                      value={form.typeId}
                      onChange={e => setForm({ ...form, typeId: e.target.value })}
                    >
                      <option value="">-- اختياري --</option>
                      {types.map(t => (
                        <option key={t.id} value={t.id}>{t.name_ar}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">الحالة</label>
                    <select
                      className="form-input"
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value as any })}
                    >
                      <option value="Active">نشط</option>
                      <option value="Inactive">معطل</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 0.75rem', paddingBottom: '0.25rem', borderBottom: '1px solid var(--color-border)' }}>
                  بيانات الاتصال والعنوان
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">الشخص المسؤول</label>
                    <input
                      className="form-input"
                      value={form.contactPerson}
                      onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">رقم الهاتف</label>
                    <input
                      className="form-input"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">البريد الإلكتروني</label>
                    <input
                      className="form-input"
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">المدينة</label>
                    <input
                      className="form-input"
                      value={form.city}
                      onChange={e => setForm({ ...form, city: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">العنوان التفصيلي</label>
                    <input
                      className="form-input"
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Financial & Accounting */}
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 0.75rem', paddingBottom: '0.25rem', borderBottom: '1px solid var(--color-border)' }}>
                  البيانات المالية والمحاسبية وشروط الدفع
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">الرقم الضريبي (VAT Number)</label>
                    <input
                      className="form-input"
                      value={form.taxNumber}
                      onChange={e => setForm({ ...form, taxNumber: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">رقم السجل التجاري (CR)</label>
                    <input
                      className="form-input"
                      value={form.crNumber}
                      onChange={e => setForm({ ...form, crNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">الحساب المحاسبي (AP)</label>
                    <select
                      className="form-input"
                      value={form.apAccountId}
                      onChange={e => setForm({ ...form, apAccountId: e.target.value })}
                    >
                      <option value="">-- الحساب الافتراضي --</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name_ar}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">شرط الدفع</label>
                    <select
                      className="form-input"
                      value={form.paymentTermId}
                      onChange={e => setForm({ ...form, paymentTermId: e.target.value })}
                    >
                      <option value="">-- اختياري --</option>
                      {paymentTermsList.map(pt => (
                        <option key={pt.id} value={pt.id}>{pt.name_ar} ({pt.days} يوم)</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">الحد الائتماني (اختياري)</label>
                    <input
                      type="number"
                      min={0}
                      className="form-input"
                      placeholder="بدون حد"
                      value={form.creditLimit}
                      onChange={e => setForm({ ...form, creditLimit: e.target.value })}
                    />
                  </div>
                </div>

                {/* Currency selection */}
                <div style={{ marginTop: '0.75rem', background: '#f8fafc', padding: '0.75rem', borderRadius: 8 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>
                    العملات المسموح بها للمورد *
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {currencies.map(cur => {
                      const isSelected = form.currencyIds.includes(cur.id);
                      return (
                        <button
                          key={cur.id}
                          type="button"
                          onClick={() => toggleCurrency(cur.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '0.4rem',
                            border: `1.5px solid ${isSelected ? 'var(--color-primary)' : '#cbd5e1'}`,
                            background: isSelected ? 'var(--color-primary-container, #eff6ff)' : '#fff',
                            color: isSelected ? 'var(--color-primary)' : 'inherit',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          <span>{cur.code}</span>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            {isSelected ? 'check' : 'add'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {validationErrors.currencyId && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-error)', display: 'block', marginTop: '0.4rem' }}>
                      {validationErrors.currencyId}
                    </span>
                  )}
                </div>
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" disabled={saving}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'جاري الحفظ...' : editItem ? 'حفظ التعديلات' : 'إضافة المورد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
