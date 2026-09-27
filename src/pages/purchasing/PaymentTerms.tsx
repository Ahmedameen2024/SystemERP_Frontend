import { useState, useEffect } from 'react';
import api from '../../api/client';

interface PaymentTerm {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  days: number;
  description: string;
  is_default: boolean;
  status: 'Active' | 'Inactive';
}

export default function PaymentTerms() {
  const [terms, setTerms] = useState<PaymentTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<PaymentTerm | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    days: 30,
    description: '',
    isDefault: false,
    status: 'Active' as 'Active' | 'Inactive',
  });

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    setLoading(true);
    try {
      const res = await api.get('/purchasing/payment-terms');
      setTerms(res.data.data || []);
    } catch {
      setMsg({ type: 'error', text: 'فشل في جلب شروط الدفع' });
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({
      code: `PT-${(terms.length + 1).toString().padStart(2, '0')}`,
      nameAr: '',
      nameEn: '',
      days: 30,
      description: '',
      isDefault: terms.length === 0,
      status: 'Active',
    });
    setShowModal(true);
  };

  const openEdit = (t: PaymentTerm) => {
    setEditItem(t);
    setForm({
      code: t.code,
      nameAr: t.name_ar,
      nameEn: t.name_en || '',
      days: t.days,
      description: t.description || '',
      isDefault: t.is_default,
      status: t.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.nameAr) {
      setMsg({ type: 'error', text: 'الرجاء إدخال الكود والاسم بالعربية' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      if (editItem) {
        await api.put(`/purchasing/payment-terms/${editItem.id}`, form);
        setMsg({ type: 'success', text: 'تم تعديل شرط الدفع بنجاح' });
      } else {
        await api.post('/purchasing/payment-terms', form);
        setMsg({ type: 'success', text: 'تمت إضافة شرط الدفع بنجاح' });
      }
      setShowModal(false);
      fetchTerms();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'فشلت العملية' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف شرط الدفع؟')) return;
    try {
      await api.delete(`/purchasing/payment-terms/${id}`);
      setMsg({ type: 'success', text: 'تم حذف شرط الدفع بنجاح' });
      fetchTerms();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'فشل الحذف' });
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>
            شروط الدفع للموردين
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            تحديد فترات السداد واستحقاقات الفواتير المطبقة على الموردين والمشتريات
          </p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          إضافة شرط دفع جديد
        </button>
      </div>

      {msg && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          <span className="material-symbols-outlined">{msg.type === 'success' ? 'check_circle' : 'error'}</span>
          <span>{msg.text}</span>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>الكود</th>
                <th>اسم شرط الدفع</th>
                <th>الاسم الإنجليزي</th>
                <th>فترة السداد (بالأيام)</th>
                <th>الافتراضي</th>
                <th>الحالة</th>
                <th>الوصف</th>
                <th style={{ textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                    جاري تحميل شروط الدفع...
                  </td>
                </tr>
              ) : terms.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد شروط دفع معرفة حالياً. اضغط "إضافة شرط دفع جديد" للبدء.
                  </td>
                </tr>
              ) : (
                terms.map((t) => (
                  <tr key={t.id}>
                    <td><span className="numeric font-bold" style={{ color: 'var(--color-primary)' }}>{t.code}</span></td>
                    <td style={{ fontWeight: 600 }}>{t.name_ar}</td>
                    <td style={{ color: 'var(--color-on-surface-variant)' }}>{t.name_en || '-'}</td>
                    <td>
                      <span className="numeric" style={{ fontWeight: 700 }}>
                        {t.days === 0 ? 'سداد فوري (نقدي)' : `${t.days} يوم`}
                      </span>
                    </td>
                    <td>
                      {t.is_default ? (
                        <span className="chip chip-success" style={{ fontSize: '0.75rem' }}>نعم (افتراضي)</span>
                      ) : (
                        <span style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.8rem' }}>لا</span>
                      )}
                    </td>
                    <td>
                      <span className={`chip ${t.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>
                        {t.status === 'Active' ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-on-surface-variant)' }}>{t.description || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => openEdit(t)}
                          className="btn btn-outline btn-sm"
                          title="تعديل"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="btn btn-outline btn-sm"
                          style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                          title="حذف"
                        >
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                {editItem ? 'تعديل شرط الدفع' : 'إضافة شرط دفع جديد'}
              </h2>
              <button onClick={() => setShowModal(false)} className="btn-close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">الكود *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">الاسم بالعربية *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="مثال: سداد خلال 30 يوم"
                    value={form.nameAr}
                    onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">الاسم بالإنجليزية</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Net 30 Days"
                    value={form.nameEn}
                    onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">عدد الأيام *</label>
                  <input
                    type="number"
                    min={0}
                    max={365}
                    className="form-input"
                    value={form.days}
                    onChange={(e) => setForm({ ...form, days: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">الوصف / تفاصيل</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  />
                  <span style={{ fontSize: '0.875rem' }}>تعيين كشرط دفع افتراضي</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>الحالة:</label>
                  <select
                    className="form-input"
                    style={{ padding: '0.25rem 0.5rem' }}
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })}
                  >
                    <option value="Active">نشط</option>
                    <option value="Inactive">معطل</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">
                  إلغاء
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'جاري الحفظ...' : editItem ? 'حفظ التعديلات' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
