import { useState, useEffect } from 'react';
import api from '../../api/client';

interface AllowanceType {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  calculation_method: string;
  is_taxable: boolean;
  status: string;
}

interface DeductionType {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  calculation_method: string;
  status: string;
}

export default function AllowancesDeductions() {
  const [activeTab, setActiveTab] = useState<'allowances' | 'deductions'>('allowances');
  const [allowances, setAllowances] = useState<AllowanceType[]>([]);
  const [deductions, setDeductions] = useState<DeductionType[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    calculationMethod: 'Fixed',
    isTaxable: false,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payroll/allowances-deductions');
      setAllowances(res.data?.data?.allowances || []);
      setDeductions(res.data?.data?.deductions || []);
    } catch (err) {
      console.error('Failed to load allowances and deductions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeTab === 'allowances') {
        await api.post('/payroll/allowance-types', {
          code: form.code,
          nameAr: form.nameAr,
          nameEn: form.nameEn,
          calculationMethod: form.calculationMethod,
          isTaxable: form.isTaxable,
        });
      } else {
        await api.post('/payroll/deduction-types', {
          code: form.code,
          nameAr: form.nameAr,
          nameEn: form.nameEn,
          calculationMethod: form.calculationMethod,
        });
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطأ في الحفظ');
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>البدلات والاستقطاعات</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            تعريف أنواع البدلات الإضافية والاستقطاعات المعتمدة في كشوف الرواتب
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchData} disabled={loading}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
            تحديث
          </button>
          <button 
            className="btn btn-primary btn-sm" 
            onClick={() => {
              setForm({ code: '', nameAr: '', nameEn: '', calculationMethod: 'Fixed', isTaxable: false });
              setShowModal(true);
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            {activeTab === 'allowances' ? 'إضافة نوع بدل جديد' : 'إضافة نوع استقطاع جديد'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '0.5rem' }}>
        <button
          className={`btn ${activeTab === 'allowances' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('allowances')}
        >
          أنواع البدلات ({allowances.length})
        </button>
        <button
          className={`btn ${activeTab === 'deductions' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('deductions')}
        >
          أنواع الاستقطاعات ({deductions.length})
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem', width: 32, height: 32, borderWidth: 3 }} />
            جاري جلب البيانات...
          </div>
        ) : activeTab === 'allowances' ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>الكود</th>
                <th>اسم البدل بالعربي</th>
                <th>الاسم بالإنجليزي</th>
                <th>طريقة الاحتساب</th>
                <th>خاضع للضريبة</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {allowances.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد أنواع بدلات مسجلة
                  </td>
                </tr>
              ) : (
                allowances.map(a => (
                  <tr key={a.id}>
                    <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{a.code}</span></td>
                    <td style={{ fontWeight: 500 }}>{a.name_ar}</td>
                    <td>{a.name_en || '—'}</td>
                    <td>{a.calculation_method === 'Percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}</td>
                    <td>{a.is_taxable ? 'نعم' : 'لا'}</td>
                    <td><span className="chip chip-success">{a.status || 'نشط'}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>الكود</th>
                <th>اسم الاستقطاع بالعربي</th>
                <th>الاسم بالإنجليزي</th>
                <th>طريقة الاحتساب</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {deductions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد أنواع استقطاعات مسجلة
                  </td>
                </tr>
              ) : (
                deductions.map(d => (
                  <tr key={d.id}>
                    <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{d.code}</span></td>
                    <td style={{ fontWeight: 500 }}>{d.name_ar}</td>
                    <td>{d.name_en || '—'}</td>
                    <td>{d.calculation_method === 'Percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}</td>
                    <td><span className="chip chip-success">{d.status || 'نشط'}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 450 }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: '0 0 1rem' }}>
              {activeTab === 'allowances' ? 'إضافة نوع بدل' : 'إضافة نوع استقطاع'}
            </h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label className="label">الكود</label>
                <input 
                  type="text" 
                  className="input" 
                  value={form.code} 
                  onChange={e => setForm({ ...form, code: e.target.value })} 
                  placeholder="مثال: ALW-01" 
                />
              </div>

              <div>
                <label className="label">الاسم بالعربية *</label>
                <input 
                  type="text" 
                  className="input" 
                  value={form.nameAr} 
                  onChange={e => setForm({ ...form, nameAr: e.target.value })} 
                  required 
                />
              </div>

              <div>
                <label className="label">الاسم بالإنجليزية</label>
                <input 
                  type="text" 
                  className="input" 
                  value={form.nameEn} 
                  onChange={e => setForm({ ...form, nameEn: e.target.value })} 
                />
              </div>

              <div>
                <label className="label">طريقة الاحتساب</label>
                <select 
                  className="input" 
                  value={form.calculationMethod} 
                  onChange={e => setForm({ ...form, calculationMethod: e.target.value })}
                >
                  <option value="Fixed">مبلغ ثابت</option>
                  <option value="Percentage">نسبة مئوية من الأساسي</option>
                </select>
              </div>

              {activeTab === 'allowances' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="isTaxable"
                    checked={form.isTaxable} 
                    onChange={e => setForm({ ...form, isTaxable: e.target.checked })} 
                  />
                  <label htmlFor="isTaxable" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>خاضع للتأمينات / الضرائب</label>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
