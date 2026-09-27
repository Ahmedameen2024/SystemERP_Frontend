import { useState, useEffect } from 'react';
import api from '../../api/client';

interface CashBoxCurrency {
  currency_id: string;
  currency_code: string;
  currency_name: string;
  symbol?: string;
  current_balance: number | string;
  opening_balance: number | string;
  maximum_balance: number | string;
}

interface CashBox {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  branch_id: string;
  branch_name_ar?: string;
  currency_id: string;
  currency_code?: string;
  currency_symbol?: string;
  gl_account_id: string;
  gl_account_code?: string;
  gl_account_name?: string;
  responsible_employee_id?: string;
  responsible_employee_name?: string;
  opening_balance: number;
  current_balance: number;
  maximum_balance: number;
  status: 'Active' | 'Inactive';
  notes?: string;
  currencies?: CashBoxCurrency[];
}

interface BankAccountCurrency {
  currency_id: string;
  currency_code: string;
  currency_name: string;
  symbol?: string;
  current_balance: number | string;
  opening_balance: number | string;
}

interface BankAccount {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  branch_id: string;
  branch_name_ar?: string;
  currency_id: string;
  currency_code?: string;
  currency_symbol?: string;
  gl_account_id: string;
  gl_account_code?: string;
  gl_account_name?: string;
  account_number: string;
  iban?: string;
  swift?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  opening_balance: number;
  current_balance: number;
  status: 'Active' | 'Inactive';
  notes?: string;
  currencies?: BankAccountCurrency[];
}

interface OptionItem {
  id: string;
  code?: string;
  name_ar: string;
  name_en?: string;
  symbol?: string;
}

interface CurrencyTransferItem {
  id: string;
  transfer_number: string;
  transfer_date: string;
  source_cash_box_id?: string;
  source_cash_box_name?: string;
  source_bank_account_id?: string;
  source_bank_account_name?: string;
  source_currency_code: string;
  source_currency_symbol?: string;
  source_amount: number;
  target_cash_box_id?: string;
  target_cash_box_name?: string;
  target_bank_account_id?: string;
  target_bank_account_name?: string;
  target_currency_code: string;
  target_currency_symbol?: string;
  target_amount: number;
  exchange_rate: number;
  status: string;
  notes?: string;
  created_at: string;
}

export default function CashBanksManagement() {
  const [activeTab, setActiveTab] = useState<'cashBoxes' | 'bankAccounts' | 'currencyTransfers'>('cashBoxes');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Data lists
  const [cashBoxes, setCashBoxes] = useState<CashBox[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transfers, setTransfers] = useState<CurrencyTransferItem[]>([]);
  const [branches, setBranches] = useState<OptionItem[]>([]);
  const [currencies, setCurrencies] = useState<OptionItem[]>([]);
  const [glAccounts, setGlAccounts] = useState<OptionItem[]>([]);
  const [users, setUsers] = useState<OptionItem[]>([]);

  // Modals state
  const [showCashModal, setShowCashModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Cash Box Form
  const [cashForm, setCashForm] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    branchId: '',
    currencyId: '',
    currencyIds: [] as string[],
    glAccountId: '',
    responsibleEmployeeId: '',
    openingBalance: 0,
    maximumBalance: 0,
    status: 'Active' as 'Active' | 'Inactive',
    notes: '',
  });

  // Bank Account Form
  const [bankForm, setBankForm] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    branchId: '',
    currencyId: '',
    currencyIds: [] as string[],
    glAccountId: '',
    accountNumber: '',
    iban: '',
    swift: '',
    contactPerson: '',
    phone: '',
    email: '',
    openingBalance: 0,
    status: 'Active' as 'Active' | 'Inactive',
    notes: '',
  });

  // Currency Transfer Form
  const [transferForm, setTransferForm] = useState({
    transferDate: new Date().toISOString().slice(0, 10),
    sourceType: 'cash' as 'cash' | 'bank',
    sourceCashBoxId: '',
    sourceBankAccountId: '',
    sourceCurrencyId: '',
    sourceAmount: 0,
    targetType: 'cash' as 'cash' | 'bank',
    targetCashBoxId: '',
    targetBankAccountId: '',
    targetCurrencyId: '',
    targetAmount: 0,
    exchangeRate: 1,
    notes: '',
  });

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab, search]);

  const fetchLookups = async () => {
    try {
      const [bRes, cRes, aRes, uRes] = await Promise.all([
        api.get('/setup/branches').catch(() => ({ data: { data: [] } })),
        api.get('/setup/currencies').catch(() => ({ data: { data: [] } })),
        api.get('/accounting/accounts').catch(() => ({ data: { data: [] } })),
        api.get('/setup/users').catch(() => ({ data: { data: [] } })),
      ]);

      const bData = bRes.data.data || [];
      const cData = cRes.data.data || [];
      const aData = aRes.data.data || [];
      const uData = uRes.data.data || [];

      setBranches(bData);
      setCurrencies(cData);
      setGlAccounts(aData);
      setUsers(uData);

      // Default dropdown values for new forms
      const defCurIds = cData.length > 0 ? [cData[0].id] : [];
      if (bData.length > 0) {
        setCashForm((prev) => ({ ...prev, branchId: bData[0].id }));
        setBankForm((prev) => ({ ...prev, branchId: bData[0].id }));
      }
      if (cData.length > 0) {
        setCashForm((prev) => ({ ...prev, currencyId: cData[0].id, currencyIds: defCurIds }));
        setBankForm((prev) => ({ ...prev, currencyId: cData[0].id, currencyIds: defCurIds }));
      }
      if (aData.length > 0) {
        setCashForm((prev) => ({ ...prev, glAccountId: aData[0].id }));
        setBankForm((prev) => ({ ...prev, glAccountId: aData[0].id }));
      }
    } catch (err: any) {
      console.error('Error loading lookup options:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'cashBoxes') {
        const res = await api.get('/setup/cash-boxes', { params: { search } });
        setCashBoxes(res.data.data?.items || res.data.data || []);
      } else if (activeTab === 'bankAccounts') {
        const res = await api.get('/setup/bank-accounts', { params: { search } });
        setBankAccounts(res.data.data?.items || res.data.data || []);
      } else if (activeTab === 'currencyTransfers') {
        const res = await api.get('/setup/currency-transfers');
        setTransfers(res.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'تعذر تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // Currency Transfer Helpers
  const getSourceAvailableBalance = (): number => {
    if (transferForm.sourceType === 'cash' && transferForm.sourceCashBoxId) {
      const cb = cashBoxes.find(c => c.id === transferForm.sourceCashBoxId);
      if (cb?.currencies && cb.currencies.length > 0) {
        const cObj = cb.currencies.find(c => c.currency_id === transferForm.sourceCurrencyId);
        return Number(cObj?.current_balance || 0);
      }
      return Number(cb?.current_balance || 0);
    } else if (transferForm.sourceType === 'bank' && transferForm.sourceBankAccountId) {
      const ba = bankAccounts.find(b => b.id === transferForm.sourceBankAccountId);
      if (ba?.currencies && ba.currencies.length > 0) {
        const cObj = ba.currencies.find(c => c.currency_id === transferForm.sourceCurrencyId);
        return Number(cObj?.current_balance || 0);
      }
      return Number(ba?.current_balance || 0);
    }
    return 0;
  };

  const handleSourceAmountChange = (val: number) => {
    const rate = Number(transferForm.exchangeRate) || 1;
    setTransferForm(prev => ({
      ...prev,
      sourceAmount: val,
      targetAmount: parseFloat((val * rate).toFixed(4)),
    }));
  };

  const handleExchangeRateChange = (rate: number) => {
    const src = Number(transferForm.sourceAmount) || 0;
    setTransferForm(prev => ({
      ...prev,
      exchangeRate: rate,
      targetAmount: parseFloat((src * rate).toFixed(4)),
    }));
  };

  const handleTargetAmountChange = (targetVal: number) => {
    const src = Number(transferForm.sourceAmount) || 0;
    const rate = src > 0 ? parseFloat((targetVal / src).toFixed(6)) : transferForm.exchangeRate;
    setTransferForm(prev => ({
      ...prev,
      targetAmount: targetVal,
      exchangeRate: rate,
    }));
  };

  const handleTransferSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!transferForm.sourceCurrencyId || !transferForm.targetCurrencyId) {
        alert('يرجى تحديد عملة المصدر وعملة الاستلام');
        return;
      }
      if (transferForm.sourceCurrencyId === transferForm.targetCurrencyId &&
          transferForm.sourceCashBoxId === transferForm.targetCashBoxId &&
          transferForm.sourceBankAccountId === transferForm.targetBankAccountId) {
        alert('لا يمكن التحويل لنفس الحساب والعملة');
        return;
      }
      if (transferForm.sourceAmount <= 0 || transferForm.targetAmount <= 0) {
        alert('المبالغ يجب أن تكون أكبر من صفر');
        return;
      }

      const avail = getSourceAvailableBalance();
      if (transferForm.sourceAmount > avail) {
        alert(`رصيد العملة المصدر غير كافٍ. المتوفر: ${avail.toLocaleString('ar-SA')}`);
        return;
      }

      const payload = {
        transferDate: transferForm.transferDate,
        sourceCashBoxId: transferForm.sourceType === 'cash' ? transferForm.sourceCashBoxId : null,
        sourceBankAccountId: transferForm.sourceType === 'bank' ? transferForm.sourceBankAccountId : null,
        sourceCurrencyId: transferForm.sourceCurrencyId,
        sourceAmount: transferForm.sourceAmount,
        targetCashBoxId: transferForm.targetType === 'cash' ? transferForm.targetCashBoxId : null,
        targetBankAccountId: transferForm.targetType === 'bank' ? transferForm.targetBankAccountId : null,
        targetCurrencyId: transferForm.targetCurrencyId,
        targetAmount: transferForm.targetAmount,
        exchangeRate: transferForm.exchangeRate,
        notes: transferForm.notes,
      };

      const res = await api.post('/setup/currency-transfers', payload);
      alert(res.data.message || 'تمت عملية تحويل وصرف العملة بنجاح وتحديث الأرصدة والقيود المحاسبية');
      setShowTransferModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطأ في تنفيذ عملية تحويل وصرف العملة');
    }
  };

  // Handle Cash Box Save
  const handleCashSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/setup/cash-boxes/${editingId}`, cashForm);
        alert('تم تحديث بيانات الصندوق بنجاح');
      } else {
        await api.post('/setup/cash-boxes', cashForm);
        alert('تم إنشاء الصندوق بنجاح');
      }
      setShowCashModal(false);
      resetCashForm();
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطأ في حفظ بيانات الصندوق');
    }
  };

  // Handle Bank Account Save
  const handleBankSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/setup/bank-accounts/${editingId}`, bankForm);
        alert('تم تحديث بيانات الحساب البنكي بنجاح');
      } else {
        await api.post('/setup/bank-accounts', bankForm);
        alert('تم إضافة الحساب البنكي بنجاح');
      }
      setShowBankModal(false);
      resetBankForm();
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطأ في حفظ الحساب البنكي');
    }
  };

  // Delete Handlers
  const handleDeleteCash = async (id: string) => {
    if (!window.confirm('هل أنت تأكد من رغبتك في حذف هذا الصندوق؟')) return;
    try {
      await api.delete(`/setup/cash-boxes/${id}`);
      alert('تم حذف الصندوق بنجاح');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'تعذر حذف الصندوق');
    }
  };

  const handleDeleteBank = async (id: string) => {
    if (!window.confirm('هل أنت تأكد من رغبتك في حذف هذا الحساب البنكي؟')) return;
    try {
      await api.delete(`/setup/bank-accounts/${id}`);
      alert('تم حذف الحساب البنكي بنجاح');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'تعذر حذف الحساب البنكي');
    }
  };

  // Reset forms
  const resetCashForm = () => {
    setEditingId(null);
    const defCurIds = currencies.length > 0 ? [currencies[0].id] : [];
    setCashForm({
      code: '',
      nameAr: '',
      nameEn: '',
      branchId: branches[0]?.id || '',
      currencyId: currencies[0]?.id || '',
      currencyIds: defCurIds,
      glAccountId: glAccounts[0]?.id || '',
      responsibleEmployeeId: '',
      openingBalance: 0,
      maximumBalance: 0,
      status: 'Active',
      notes: '',
    });
  };

  const resetBankForm = () => {
    setEditingId(null);
    const defCurIds = currencies.length > 0 ? [currencies[0].id] : [];
    setBankForm({
      code: '',
      nameAr: '',
      nameEn: '',
      branchId: branches[0]?.id || '',
      currencyId: currencies[0]?.id || '',
      currencyIds: defCurIds,
      glAccountId: glAccounts[0]?.id || '',
      accountNumber: '',
      iban: '',
      swift: '',
      contactPerson: '',
      phone: '',
      email: '',
      openingBalance: 0,
      status: 'Active',
      notes: '',
    });
  };

  // Edit Cash Box
  const handleEditCash = (cb: CashBox) => {
    setEditingId(cb.id);
    const assignedCurIds = (cb.currencies && cb.currencies.length > 0)
      ? cb.currencies.map(c => c.currency_id)
      : (cb.currency_id ? [cb.currency_id] : (currencies.length > 0 ? [currencies[0].id] : []));
    setCashForm({
      code: cb.code,
      nameAr: cb.name_ar,
      nameEn: cb.name_en,
      branchId: cb.branch_id,
      currencyId: assignedCurIds[0] || cb.currency_id,
      currencyIds: assignedCurIds,
      glAccountId: cb.gl_account_id,
      responsibleEmployeeId: cb.responsible_employee_id || '',
      openingBalance: Number(cb.opening_balance) || 0,
      maximumBalance: Number(cb.maximum_balance) || 0,
      status: cb.status,
      notes: cb.notes || '',
    });
    setShowCashModal(true);
  };

  // Edit Bank Account
  const handleEditBank = (ba: BankAccount) => {
    setEditingId(ba.id);
    const assignedCurIds = (ba.currencies && ba.currencies.length > 0)
      ? ba.currencies.map(c => c.currency_id)
      : (ba.currency_id ? [ba.currency_id] : (currencies.length > 0 ? [currencies[0].id] : []));
    setBankForm({
      code: ba.code,
      nameAr: ba.name_ar,
      nameEn: ba.name_en,
      branchId: ba.branch_id,
      currencyId: assignedCurIds[0] || ba.currency_id,
      currencyIds: assignedCurIds,
      glAccountId: ba.gl_account_id,
      accountNumber: ba.account_number,
      iban: ba.iban || '',
      swift: ba.swift || '',
      contactPerson: ba.contact_person || '',
      phone: ba.phone || '',
      email: ba.email || '',
      openingBalance: Number(ba.opening_balance) || 0,
      status: ba.status,
      notes: ba.notes || '',
    });
    setShowBankModal(true);
  };

  const toggleCashCurrency = (curId: string) => {
    setCashForm(prev => {
      const exists = prev.currencyIds.includes(curId);
      if (exists) {
        if (prev.currencyIds.length === 1) return prev;
        const updated = prev.currencyIds.filter(id => id !== curId);
        return { ...prev, currencyIds: updated, currencyId: updated[0] || '' };
      }
      const updated = [...prev.currencyIds, curId];
      return { ...prev, currencyIds: updated, currencyId: updated[0] };
    });
  };

  const toggleBankCurrency = (curId: string) => {
    setBankForm(prev => {
      const exists = prev.currencyIds.includes(curId);
      if (exists) {
        if (prev.currencyIds.length === 1) return prev;
        const updated = prev.currencyIds.filter(id => id !== curId);
        return { ...prev, currencyIds: updated, currencyId: updated[0] || '' };
      }
      const updated = [...prev.currencyIds, curId];
      return { ...prev, currencyIds: updated, currencyId: updated[0] };
    });
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>
            إدارة الصناديق والبنوك
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            البيانات الأساسية للصناديق المالية والحسابات البنكية المعتمدة بالمنشأة
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            if (activeTab === 'cashBoxes') {
              resetCashForm();
              setShowCashModal(true);
            } else if (activeTab === 'bankAccounts') {
              resetBankForm();
              setShowBankModal(true);
            } else {
              // Initialize transfer form defaults
              const defSrcCb = cashBoxes.length > 0 ? cashBoxes[0] : null;
              const defSrcCur = defSrcCb?.currencies?.[0]?.currency_id || currencies[0]?.id || '';
              const defTgtCur = currencies.length > 1 ? currencies[1]?.id : (currencies[0]?.id || '');

              setTransferForm({
                transferDate: new Date().toISOString().slice(0, 10),
                sourceType: 'cash',
                sourceCashBoxId: defSrcCb?.id || '',
                sourceBankAccountId: '',
                sourceCurrencyId: defSrcCur,
                sourceAmount: 0,
                targetType: cashBoxes.length > 1 ? 'cash' : 'bank',
                targetCashBoxId: cashBoxes.length > 1 ? cashBoxes[1].id : '',
                targetBankAccountId: cashBoxes.length <= 1 && bankAccounts.length > 0 ? bankAccounts[0].id : '',
                targetCurrencyId: defTgtCur,
                targetAmount: 0,
                exchangeRate: 1,
                notes: '',
              });
              setShowTransferModal(true);
            }
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {activeTab === 'currencyTransfers' ? 'currency_exchange' : 'add'}
          </span>
          {activeTab === 'cashBoxes' ? 'إضافة صندوق جديد' :
           activeTab === 'bankAccounts' ? 'إضافة حساب بنكي جديد' : 'إجراء تحويل وصرف عملة'}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-outline-variant)' }}>
        <button
          className={`btn ${activeTab === 'cashBoxes' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => { setActiveTab('cashBoxes'); setSearch(''); }}
          style={{ borderRadius: '0.5rem 0.5rem 0 0' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>point_of_sale</span>
          الصناديق المالية (Cash Boxes)
        </button>
        <button
          className={`btn ${activeTab === 'bankAccounts' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => { setActiveTab('bankAccounts'); setSearch(''); }}
          style={{ borderRadius: '0.5rem 0.5rem 0 0' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>account_balance</span>
          الحسابات البنكية (Bank Accounts)
        </button>
        <button
          className={`btn ${activeTab === 'currencyTransfers' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => { setActiveTab('currencyTransfers'); setSearch(''); }}
          style={{ borderRadius: '0.5rem 0.5rem 0 0' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>currency_exchange</span>
          صرف وتحويل العملات (Currency Transfers)
        </button>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span
              className="material-symbols-outlined"
              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)' }}
            >
              search
            </span>
            <input
              className="input"
              style={{ paddingRight: '2.5rem' }}
              placeholder={activeTab === 'cashBoxes' ? 'بحث بكود أو اسم الصندوق...' : 'بحث برقم الحساب أو اسم البنك أو IBAN...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Loading & Error Status */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-on-surface-variant)' }}>
          جاري التحميل...
        </div>
      )}

      {error && (
        <div className="card" style={{ background: '#fde8e8', color: '#9b1c1c', padding: '1rem' }}>
          {error}
        </div>
      )}

      {/* CASH BOXES TABLE */}
      {!loading && !error && activeTab === 'cashBoxes' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>كود الصندوق</th>
                <th>اسم الصندوق (عربي)</th>
                <th>الفرع</th>
                <th>العملات المسموحة</th>
                <th>الحساب المحاسبي</th>
                <th>الموظف المسؤول</th>
                <th style={{ textAlign: 'left' }}>الأرصدة المستقلة بالعملات</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {cashBoxes.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                    لا توجد صناديق مالية معرفة
                  </td>
                </tr>
              ) : (
                cashBoxes.map((cb) => (
                  <tr key={cb.id}>
                    <td>
                      <span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        {cb.code}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{cb.name_ar}</td>
                    <td>{cb.branch_name_ar || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {cb.currencies && cb.currencies.length > 0 ? (
                          cb.currencies.map(cur => (
                            <span key={cur.currency_id} className="chip chip-primary" style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem' }}>
                              {cur.currency_code}
                            </span>
                          ))
                        ) : (
                          <span className="chip chip-info">{cb.currency_code || 'SAR'}</span>
                        )}
                      </div>
                    </td>
                    <td className="numeric">{cb.gl_account_code} - {cb.gl_account_name}</td>
                    <td>{cb.responsible_employee_name || '—'}</td>
                    <td style={{ textAlign: 'left' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {cb.currencies && cb.currencies.length > 0 ? (
                          cb.currencies.map(cur => {
                            const bal = Number(cur.current_balance) || 0;
                            return (
                              <div key={cur.currency_id} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.8rem', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, color: 'var(--color-text-muted)' }}>{cur.currency_code}:</span>
                                <span className="numeric" style={{ fontWeight: 700, color: bal > 0 ? 'var(--color-primary)' : 'inherit' }}>
                                  {bal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <span className="numeric" style={{ fontWeight: 700 }}>
                            {Number(cb.current_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {cb.currency_symbol || ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`chip ${cb.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>
                        {cb.status === 'Active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleEditCash(cb)} title="تعديل">
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteCash(cb.id)} title="حذف" style={{ color: 'var(--color-error)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* BANK ACCOUNTS TABLE */}
      {!loading && !error && activeTab === 'bankAccounts' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>كود البنك</th>
                <th>اسم البنك</th>
                <th>رقم الحساب</th>
                <th>IBAN</th>
                <th>الفرع</th>
                <th>العملة</th>
                <th>الحساب المحاسبي</th>
                <th style={{ textAlign: 'left' }}>الرصيد الحالي</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {bankAccounts.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '2rem' }}>
                    لا توجد حسابات بنكية معرفة
                  </td>
                </tr>
              ) : (
                bankAccounts.map((ba) => (
                  <tr key={ba.id}>
                    <td>
                      <span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        {ba.code}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{ba.name_ar}</td>
                    <td className="numeric">{ba.account_number}</td>
                    <td className="numeric" style={{ fontSize: '0.75rem' }}>{ba.iban || '—'}</td>
                    <td>{ba.branch_name_ar || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {ba.currencies && ba.currencies.length > 0 ? (
                          ba.currencies.map(cur => (
                            <span key={cur.currency_id} className="chip chip-primary" style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem' }}>
                              {cur.currency_code}
                            </span>
                          ))
                        ) : (
                          <span className="chip chip-info">{ba.currency_code || 'SAR'}</span>
                        )}
                      </div>
                    </td>
                    <td className="numeric">{ba.gl_account_code} - {ba.gl_account_name}</td>
                    <td style={{ textAlign: 'left' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {ba.currencies && ba.currencies.length > 0 ? (
                          ba.currencies.map(cur => {
                            const bal = Number(cur.current_balance) || 0;
                            return (
                              <div key={cur.currency_id} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.8rem', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, color: 'var(--color-text-muted)' }}>{cur.currency_code}:</span>
                                <span className="numeric" style={{ fontWeight: 700, color: bal > 0 ? 'var(--color-primary)' : 'inherit' }}>
                                  {bal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <span className="numeric" style={{ fontWeight: 700 }}>
                            {Number(ba.current_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {ba.currency_symbol || ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`chip ${ba.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>
                        {ba.status === 'Active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleEditBank(ba)} title="تعديل">
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteBank(ba.id)} title="حذف" style={{ color: 'var(--color-error)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CURRENCY TRANSFERS TABLE */}
      {!loading && !error && activeTab === 'currencyTransfers' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم التحويل</th>
                <th>التاريخ</th>
                <th>المصدر (صندوق/بنك)</th>
                <th style={{ textAlign: 'left' }}>المبلغ المصروف</th>
                <th>المستلم (صندوق/بنك)</th>
                <th style={{ textAlign: 'left' }}>المبلغ المستلم</th>
                <th>سعر الصرف</th>
                <th>الحالة</th>
                <th>البيان / ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                    لا توجد عمليات تحويل أو صرف عملات مسجلة
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        {t.transfer_number}
                      </span>
                    </td>
                    <td className="numeric">{t.transfer_date ? new Date(t.transfer_date).toLocaleDateString('ar-SA') : '—'}</td>
                    <td style={{ fontWeight: 600 }}>
                      {t.source_cash_box_name || t.source_bank_account_name || '—'}
                    </td>
                    <td className="numeric" style={{ textAlign: 'left', fontWeight: 700, color: 'var(--color-error)' }}>
                      - {Number(t.source_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {t.source_currency_code}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {t.target_cash_box_name || t.target_bank_account_name || '—'}
                    </td>
                    <td className="numeric" style={{ textAlign: 'left', fontWeight: 700, color: 'var(--color-primary)' }}>
                      + {Number(t.target_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {t.target_currency_code}
                    </td>
                    <td className="numeric" style={{ fontWeight: 600 }}>
                      {Number(t.exchange_rate || 1).toFixed(4)}
                    </td>
                    <td>
                      <span className="chip chip-success">
                        {t.status || 'Posted'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                      {t.notes || 'تحويل وصرف عملة'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CURRENCY TRANSFER MODAL */}
      {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal-box" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, verticalAlign: 'middle', marginLeft: 8, color: 'var(--color-primary)' }}>currency_exchange</span>
                تنفيذ عملية صرف وتحويل عملة
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowTransferModal(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>

            <form onSubmit={handleTransferSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Date */}
              <div>
                <label>تاريخ التحويل *</label>
                <input
                  type="date"
                  className="input"
                  value={transferForm.transferDate}
                  onChange={(e) => setTransferForm({ ...transferForm, transferDate: e.target.value })}
                  required
                />
              </div>

              {/* Source Box/Bank & Currency */}
              <div style={{ padding: '1rem', background: 'var(--color-surface-variant)', borderRadius: '0.75rem', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-error)' }}>arrow_upward</span>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>الجهة المصدرة (خصم العملة)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label>نوع الجهة</label>
                    <select
                      className="input"
                      value={transferForm.sourceType}
                      onChange={(e) => {
                        const type = e.target.value as 'cash' | 'bank';
                        setTransferForm(prev => ({
                          ...prev,
                          sourceType: type,
                          sourceCashBoxId: type === 'cash' ? (cashBoxes[0]?.id || '') : '',
                          sourceBankAccountId: type === 'bank' ? (bankAccounts[0]?.id || '') : '',
                        }));
                      }}
                    >
                      <option value="cash">صندوق مالي</option>
                      <option value="bank">حساب بنكي</option>
                    </select>
                  </div>
                  <div>
                    <label>{transferForm.sourceType === 'cash' ? 'الصندوق المصدر *' : 'الحساب البنكي المصدر *'}</label>
                    {transferForm.sourceType === 'cash' ? (
                      <select
                        className="input"
                        value={transferForm.sourceCashBoxId}
                        onChange={(e) => setTransferForm({ ...transferForm, sourceCashBoxId: e.target.value })}
                        required
                      >
                        <option value="">-- اختر الصندوق --</option>
                        {cashBoxes.map(cb => (
                          <option key={cb.id} value={cb.id}>{cb.code} - {cb.name_ar}</option>
                        ))}
                      </select>
                    ) : (
                      <select
                        className="input"
                        value={transferForm.sourceBankAccountId}
                        onChange={(e) => setTransferForm({ ...transferForm, sourceBankAccountId: e.target.value })}
                        required
                      >
                        <option value="">-- اختر الحساب البنكي --</option>
                        {bankAccounts.map(ba => (
                          <option key={ba.id} value={ba.id}>{ba.code} - {ba.name_ar}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label>العملة المصدرة *</label>
                    <select
                      className="input"
                      value={transferForm.sourceCurrencyId}
                      onChange={(e) => setTransferForm({ ...transferForm, sourceCurrencyId: e.target.value })}
                      required
                    >
                      {currencies.map(c => (
                        <option key={c.id} value={c.id}>{c.code} - {c.name_ar}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, maxWidth: '200px' }}>
                    <label>المبلغ المصروف *</label>
                    <input
                      className="input numeric"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={transferForm.sourceAmount || ''}
                      onChange={(e) => handleSourceAmountChange(parseFloat(e.target.value) || 0)}
                      required
                      placeholder="0.00"
                    />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', background: 'var(--color-surface)', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
                    الرصيد المتاح للعملة المصدر: <strong>{getSourceAvailableBalance().toLocaleString('ar-SA')}</strong>
                  </div>
                </div>
              </div>

              {/* Exchange Rate */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                <div>
                  <label>سعر الصرف (Exchange Rate) *</label>
                  <input
                    className="input numeric"
                    type="number"
                    min="0.000001"
                    step="0.0001"
                    value={transferForm.exchangeRate || ''}
                    onChange={(e) => handleExchangeRateChange(parseFloat(e.target.value) || 0)}
                    required
                    placeholder="مثال: 3.75"
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                    1 {currencies.find(c => c.id === transferForm.sourceCurrencyId)?.code || 'عملة مصدر'} = {transferForm.exchangeRate} {currencies.find(c => c.id === transferForm.targetCurrencyId)?.code || 'عملة استلام'}
                  </div>
                </div>
                <div>
                  <label>المبلغ المستلم المحسوب *</label>
                  <input
                    className="input numeric"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={transferForm.targetAmount || ''}
                    onChange={(e) => handleTargetAmountChange(parseFloat(e.target.value) || 0)}
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Target Box/Bank & Currency */}
              <div style={{ padding: '1rem', background: 'var(--color-surface-variant)', borderRadius: '0.75rem', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>arrow_downward</span>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>الجهة المستلمة (إضافة العملة)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label>نوع الجهة</label>
                    <select
                      className="input"
                      value={transferForm.targetType}
                      onChange={(e) => {
                        const type = e.target.value as 'cash' | 'bank';
                        setTransferForm(prev => ({
                          ...prev,
                          targetType: type,
                          targetCashBoxId: type === 'cash' ? (cashBoxes[0]?.id || '') : '',
                          targetBankAccountId: type === 'bank' ? (bankAccounts[0]?.id || '') : '',
                        }));
                      }}
                    >
                      <option value="cash">صندوق مالي</option>
                      <option value="bank">حساب بنكي</option>
                    </select>
                  </div>
                  <div>
                    <label>{transferForm.targetType === 'cash' ? 'الصندوق المستلم *' : 'الحساب البنكي المستلم *'}</label>
                    {transferForm.targetType === 'cash' ? (
                      <select
                        className="input"
                        value={transferForm.targetCashBoxId}
                        onChange={(e) => setTransferForm({ ...transferForm, targetCashBoxId: e.target.value })}
                        required
                      >
                        <option value="">-- اختر الصندوق --</option>
                        {cashBoxes.map(cb => (
                          <option key={cb.id} value={cb.id}>{cb.code} - {cb.name_ar}</option>
                        ))}
                      </select>
                    ) : (
                      <select
                        className="input"
                        value={transferForm.targetBankAccountId}
                        onChange={(e) => setTransferForm({ ...transferForm, targetBankAccountId: e.target.value })}
                        required
                      >
                        <option value="">-- اختر الحساب البنكي --</option>
                        {bankAccounts.map(ba => (
                          <option key={ba.id} value={ba.id}>{ba.code} - {ba.name_ar}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label>عملة الاستلام *</label>
                    <select
                      className="input"
                      value={transferForm.targetCurrencyId}
                      onChange={(e) => setTransferForm({ ...transferForm, targetCurrencyId: e.target.value })}
                      required
                    >
                      {currencies.map(c => (
                        <option key={c.id} value={c.id}>{c.code} - {c.name_ar}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label>البيان / ملاحظات التحويل</label>
                <textarea
                  className="input"
                  rows={2}
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                  placeholder="بيان عملية الصرف والتحويل..."
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowTransferModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                  تنفيذ عملية التحويل وتحديث الأرصدة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CASH BOX MODAL */}
      {showCashModal && (
        <div className="modal-overlay" onClick={() => setShowCashModal(false)}>
          <div className="modal-box" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, verticalAlign: 'middle', marginLeft: 8, color: 'var(--color-primary)' }}>point_of_sale</span>
                {editingId ? 'تعديل بيانات الصندوق المالي' : 'إضافة صندوق مالي جديد'}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCashModal(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
            <form onSubmit={handleCashSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--color-border)' }}>البيانات الأساسية</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label>كود الصندوق (Cash Code) *</label>
                    <input className="input numeric" value={cashForm.code} onChange={(e) => setCashForm({ ...cashForm, code: e.target.value })} required placeholder="مثال: CASH-01" />
                  </div>
                  <div>
                    <label>الاسم بالعربية *</label>
                    <input className="input" value={cashForm.nameAr} onChange={(e) => setCashForm({ ...cashForm, nameAr: e.target.value })} required placeholder="مثال: الخزينة الرئيسية" />
                  </div>
                  <div>
                    <label>الاسم بالإنجليزية</label>
                    <input className="input" value={cashForm.nameEn} onChange={(e) => setCashForm({ ...cashForm, nameEn: e.target.value })} placeholder="Main Cash Box" />
                  </div>
                  <div>
                    <label>الفرع *</label>
                    <select className="input" value={cashForm.branchId} onChange={(e) => setCashForm({ ...cashForm, branchId: e.target.value })} required>
                      {branches.map((b) => (<option key={b.id} value={b.id}>{b.name_ar}</option>))}
                    </select>
                  </div>
                  <div>
                    <label>الحساب المحاسبي (GL Account) *</label>
                    <select className="input" value={cashForm.glAccountId} onChange={(e) => setCashForm({ ...cashForm, glAccountId: e.target.value })} required>
                      {glAccounts.map((a) => (<option key={a.id} value={a.id}>{a.code} - {a.name_ar}</option>))}
                    </select>
                  </div>
                  <div>
                    <label>الموظف المسؤول</label>
                    <select className="input" value={cashForm.responsibleEmployeeId} onChange={(e) => setCashForm({ ...cashForm, responsibleEmployeeId: e.target.value })}>
                      <option value="">-- اختياري --</option>
                      {users.map((u) => (<option key={u.id} value={u.id}>{u.name_ar}</option>))}
                    </select>
                  </div>
                  <div>
                    <label>الرصيد الافتتاحي</label>
                    <input className="input numeric" type="number" step="0.01" value={cashForm.openingBalance} onChange={(e) => setCashForm({ ...cashForm, openingBalance: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label>الحد الأقصى للرصيد</label>
                    <input className="input numeric" type="number" step="0.01" value={cashForm.maximumBalance} onChange={(e) => setCashForm({ ...cashForm, maximumBalance: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label>الحالة</label>
                    <select className="input" value={cashForm.status} onChange={(e) => setCashForm({ ...cashForm, status: e.target.value as 'Active' | 'Inactive' })}>
                      <option value="Active">نشط</option>
                      <option value="Inactive">غير نشط</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Multi-currency */}
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--color-border)' }}>العملات المسموحة للصندوق</p>
                <div style={{ padding: '0.85rem', background: 'var(--color-surface-variant)', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 0.6rem' }}>لكل عملة رصيد مستقل تماماً. لا يتم دمج الأرصدة أو التحويل التلقائي بين العملات.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem' }}>
                    {currencies.map(cur => {
                      const isSelected = cashForm.currencyIds.includes(cur.id);
                      return (
                        <button key={cur.id} type="button" onClick={() => toggleCashCurrency(cur.id)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`, background: isSelected ? 'var(--color-primary-container)' : 'var(--color-surface)', color: isSelected ? 'var(--color-primary)' : 'var(--color-text)', fontWeight: isSelected ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s ease' }}>
                          <span>{cur.code} - {cur.name_ar}</span>
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{isSelected ? 'check_box' : 'check_box_outline_blank'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label>ملاحظات</label>
                <textarea className="input" rows={2} value={cashForm.notes} onChange={(e) => setCashForm({ ...cashForm, notes: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCashModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
                  حفظ بيانات الصندوق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BANK ACCOUNT MODAL */}
      {showBankModal && (
        <div className="modal-overlay" onClick={() => setShowBankModal(false)}>
          <div className="modal-box" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, verticalAlign: 'middle', marginLeft: 8, color: 'var(--color-primary)' }}>account_balance</span>
                {editingId ? 'تعديل بيانات الحساب البنكي' : 'إضافة حساب بنكي جديد'}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowBankModal(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
            <form onSubmit={handleBankSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--color-border)' }}>بيانات الحساب البنكي</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label>كود البنك (Bank Code) *</label>
                    <input className="input numeric" value={bankForm.code} onChange={(e) => setBankForm({ ...bankForm, code: e.target.value })} required placeholder="مثال: BANK-01" />
                  </div>
                  <div>
                    <label>اسم البنك (عربي) *</label>
                    <input className="input" value={bankForm.nameAr} onChange={(e) => setBankForm({ ...bankForm, nameAr: e.target.value })} required placeholder="مثال: مصرف الراجحي" />
                  </div>
                  <div>
                    <label>اسم البنك (إنجليزي)</label>
                    <input className="input" value={bankForm.nameEn} onChange={(e) => setBankForm({ ...bankForm, nameEn: e.target.value })} placeholder="Al Rajhi Bank" />
                  </div>
                  <div>
                    <label>رقم الحساب البنكي *</label>
                    <input className="input numeric" value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} required placeholder="1234567890" />
                  </div>
                  <div>
                    <label>رقم الآيبان (IBAN)</label>
                    <input className="input numeric" value={bankForm.iban} onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })} placeholder="SA0000000000000000000000" />
                  </div>
                  <div>
                    <label>رمز السويفت (SWIFT Code)</label>
                    <input className="input numeric" value={bankForm.swift} onChange={(e) => setBankForm({ ...bankForm, swift: e.target.value })} placeholder="RJHISASA" />
                  </div>
                  <div>
                    <label>الفرع *</label>
                    <select className="input" value={bankForm.branchId} onChange={(e) => setBankForm({ ...bankForm, branchId: e.target.value })} required>
                      {branches.map((b) => (<option key={b.id} value={b.id}>{b.name_ar}</option>))}
                    </select>
                  </div>
                  <div>
                    <label>الحساب المحاسبي (GL Account) *</label>
                    <select className="input" value={bankForm.glAccountId} onChange={(e) => setBankForm({ ...bankForm, glAccountId: e.target.value })} required>
                      {glAccounts.map((a) => (<option key={a.id} value={a.id}>{a.code} - {a.name_ar}</option>))}
                    </select>
                  </div>
                  <div>
                    <label>الشخص المسؤول / الاتصال</label>
                    <input className="input" value={bankForm.contactPerson} onChange={(e) => setBankForm({ ...bankForm, contactPerson: e.target.value })} />
                  </div>
                  <div>
                    <label>الهاتف</label>
                    <input className="input numeric" value={bankForm.phone} onChange={(e) => setBankForm({ ...bankForm, phone: e.target.value })} />
                  </div>
                  <div>
                    <label>البريد الإلكتروني</label>
                    <input className="input" type="email" value={bankForm.email} onChange={(e) => setBankForm({ ...bankForm, email: e.target.value })} />
                  </div>
                  <div>
                    <label>الرصيد الافتتاحي</label>
                    <input className="input numeric" type="number" step="0.01" value={bankForm.openingBalance} onChange={(e) => setBankForm({ ...bankForm, openingBalance: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label>الحالة</label>
                    <select className="input" value={bankForm.status} onChange={(e) => setBankForm({ ...bankForm, status: e.target.value as 'Active' | 'Inactive' })}>
                      <option value="Active">نشط</option>
                      <option value="Inactive">غير نشط</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Multi-currency */}
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--color-border)' }}>العملات المسموحة للحساب البنكي</p>
                <div style={{ padding: '0.85rem', background: 'var(--color-surface-variant)', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 0.6rem' }}>لكل عملة رصيد مستقل. لا يتم دمج الأرصدة أو التحويل التلقائي بين العملات.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem' }}>
                    {currencies.map(cur => {
                      const isSelected = bankForm.currencyIds.includes(cur.id);
                      return (
                        <button key={cur.id} type="button" onClick={() => toggleBankCurrency(cur.id)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`, background: isSelected ? 'var(--color-primary-container)' : 'var(--color-surface)', color: isSelected ? 'var(--color-primary)' : 'var(--color-text)', fontWeight: isSelected ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s ease' }}>
                          <span>{cur.code} - {cur.name_ar}</span>
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{isSelected ? 'check_box' : 'check_box_outline_blank'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label>ملاحظات</label>
                <textarea className="input" rows={2} value={bankForm.notes} onChange={(e) => setBankForm({ ...bankForm, notes: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowBankModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
                  حفظ الحساب البنكي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
