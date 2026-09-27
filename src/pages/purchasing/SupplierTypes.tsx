import { useState, useEffect } from 'react';
import api from '../../api/client';

interface SupplierType {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  description: string;
  status: 'Active' | 'Inactive';
  supplier_count: number;
}

const defaultTypes = [
  { code: 'GOODS', nameAr: 'مورد بضاعة', nameEn: 'Goods Supplier' },
  { code: 'SERVICE', nameAr: 'مورد خدمة', nameEn: 'Service Supplier' },
  { code: 'ASSETS', nameAr: 'مورد أصول', nameEn: 'Asset Supplier' },
  { code: 'EXTERNAL', nameAr: 'مورد خارجي', nameEn: 'External Supplier' },
];

export default function SupplierTypes() {
  const [types, setTypes] = useState<SupplierType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<SupplierType | null>(null);
  const [form, setForm] = useState({ code: '', nameAr: '', nameEn: '', description: '', status: 'Active' as 'Active' | 'Inactive' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/purchasing/supplier-types');
      setTypes(res.data.data || []);
    } catch { }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ code: '', nameAr: '', nameEn: '', description: '', status: 'Active' });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (t: SupplierType) => {
    setEditItem(t);
    setForm({ code: t.code, nameAr: t.name_ar, nameEn: t.name_en || '', description: t.description || '', status: t.status });
    setErrors({});
    setShowModal(true);
  };

  const seedDefault = async (dt: typeof defaultTypes[0]) => {
    try {
      await api.post('/purchasing/supplier-types', { code: dt.code, nameAr: dt.nameAr, nameEn: dt.nameEn, status: 'Active' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطأ');
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nameAr.trim()) e.nameAr = 'الاسم العربي مطلوب';
    if (!form.code.trim()) e.code = 'الكود مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { code: form.code, nameAr: form.nameAr, nameEn: form.nameEn || null, description: form.description || null, status: form.status };
      if (editItem) await api.put(`/purchasing/supplier-types/${editItem.id}`, payload);
      else await api.post('/purchasing/supplier-types', payload);
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطأ في الحفظ');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا النوع؟')) return;
    try {
      await api.delete(`/purchasing/supplier-types/${id}`);
      fetchData();
    } catch (err: any) { alert(err.response?.data?.message || 'خطأ'); }
  };

  const existingCodes = new Set(types.map(t => t.code));
  const missingDefaults = defaultTypes.filter(dt => !existingCodes.has(dt.code));

  const filtered = types.filter(t => t.name_ar.includes(search) || t.code.includes(search));

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>أنواع الموردين</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>تحديد أنواع الموردين (بضاعة، خدمات، أصول...)</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>إضافة نوع
        </button>
      </div>

      {/* Seed defaults suggestion */}
      {missingDefaults.length > 0 && (
        <div style={{ padding: '0.875rem 1rem', background: 'var(--color-primary-container)', borderRadius: '0.625rem', border: '1px solid var(--color-primary)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 20 }}>lightbulb</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', flex: 1 }}>إضافة الأنواع الافتراضية المقترحة:</span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {missingDefaults.map(dt => (
              <button key={dt.code} className="btn btn-sm" style={{ background: 'var(--color-primary)', color: 'white', fontSize: '0.78rem' }} onClick={() => seedDefault(dt)}>
                + {dt.nameAr}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ position: 'relative', maxWidth: 380 }}>
        <span className="material-symbols-outlined" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)', fontSize: 18 }}>search</span>
        <input className="input" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingRight: '2.5rem' }} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>الكود</th>
                <th>نوع المورد</th>
                <th>الوصف</th>
                <th style={{ textAlign: 'center' }}>عدد الموردين</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-on-surface-variant)' }}>لا توجد أنواع مسجلة</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id}>
                  <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{t.code}</span></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{t.name_ar}</div>
                    {t.name_en && <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>{t.name_en}</div>}
                  </td>
                  <td style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.85rem' }}>{t.description || '—'}</td>
                  <td style={{ textAlign: 'center' }}><span className="chip chip-info">{t.supplier_count} مورد</span></td>
                  <td><span className={`chip ${t.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>{t.status === 'Active' ? 'فعال' : 'متوقف'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)} title="تعديل">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                      </button>
                      {Number(t.supplier_count) === 0 && (
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(t.id)} style={{ color: 'var(--color-error)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 500, width: '95%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>{editItem ? 'تعديل نوع المورد' : 'إضافة نوع مورد'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => !saving && setShowModal(false)}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.875rem' }}>
                <div>
                  <label>الكود <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <input className={`input numeric${errors.code ? ' input-error' : ''}`} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
                  {errors.code && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{errors.code}</span>}
                </div>
                <div>
                  <label>الاسم العربي <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <input className={`input${errors.nameAr ? ' input-error' : ''}`} value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} />
                  {errors.nameAr && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{errors.nameAr}</span>}
                </div>
              </div>
              <div>
                <label>الاسم الإنجليزي</label>
                <input className="input" value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} />
              </div>
              <div>
                <label>الوصف</label>
                <textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label>الحالة</label>
                <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                  <option value="Active">فعال</option>
                  <option value="Inactive">متوقف</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)} disabled={saving}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'جارٍ الحفظ...' : editItem ? 'حفظ' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
