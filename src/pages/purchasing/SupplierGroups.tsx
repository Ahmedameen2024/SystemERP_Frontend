import { useState, useEffect } from 'react';
import api from '../../api/client';

interface SupplierGroup {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  description: string;
  status: 'Active' | 'Inactive';
  supplier_count: number;
  account_name?: string;
  currency_name?: string;
}

interface GlAccount {
  id: string;
  code: string;
  name_ar: string;
}

interface Currency {
  id: string;
  code: string;
  name_ar: string;
}

const emptyForm = {
  code: '',
  nameAr: '',
  nameEn: '',
  description: '',
  defaultAccountId: '',
  defaultCurrencyId: '',
  status: 'Active' as 'Active' | 'Inactive',
};

export default function SupplierGroups() {
  const [groups, setGroups] = useState<SupplierGroup[]>([]);
  const [accounts, setAccounts] = useState<GlAccount[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<SupplierGroup | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [grpRes, curRes, accRes] = await Promise.all([
        api.get('/purchasing/supplier-groups'),
        api.get('/setup/currencies'),
        api.get('/accounting/accounts?allowPosting=true'),
      ]);
      setGroups(grpRes.data.data || []);
      setCurrencies((curRes.data.data || []).filter((c: any) => c.status === 'Active'));
      setAccounts(accRes.data.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (g: SupplierGroup) => {
    setEditItem(g);
    setForm({
      code: g.code,
      nameAr: g.name_ar,
      nameEn: g.name_en || '',
      description: g.description || '',
      defaultAccountId: '',
      defaultCurrencyId: '',
      status: g.status,
    });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nameAr.trim()) e.nameAr = 'الاسم العربي مطلوب';
    if (!form.code.trim()) e.code = 'الكود مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        nameAr: form.nameAr,
        nameEn: form.nameEn || null,
        description: form.description || null,
        defaultAccountId: form.defaultAccountId || null,
        defaultCurrencyId: form.defaultCurrencyId || null,
        status: form.status,
      };
      if (editItem) {
        await api.put(`/purchasing/supplier-groups/${editItem.id}`, payload);
      } else {
        await api.post('/purchasing/supplier-groups', payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذه المجموعة؟')) return;
    try {
      await api.delete(`/purchasing/supplier-groups/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطأ في الحذف');
    }
  };

  const filtered = groups.filter(g =>
    g.name_ar.includes(search) || g.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>مجموعات الموردين</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
            تصنيف الموردين في مجموعات للتنظيم والتقارير
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          إضافة مجموعة
        </button>
      </div>

      <div style={{ position: 'relative', maxWidth: 380 }}>
        <span className="material-symbols-outlined" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)', fontSize: 18 }}>search</span>
        <input className="input" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingRight: '2.5rem' }} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>الكود</th>
                <th>اسم المجموعة</th>
                <th>الوصف</th>
                <th style={{ textAlign: 'center' }}>عدد الموردين</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-on-surface-variant)' }}>لا توجد مجموعات</td></tr>
              ) : filtered.map(g => (
                <tr key={g.id}>
                  <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{g.code}</span></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{g.name_ar}</div>
                    {g.name_en && <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>{g.name_en}</div>}
                  </td>
                  <td style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.85rem' }}>{g.description || '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="chip chip-info">{g.supplier_count} مورد</span>
                  </td>
                  <td><span className={`chip ${g.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>{g.status === 'Active' ? 'فعال' : 'متوقف'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(g)} title="تعديل">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                      </button>
                      {Number(g.supplier_count) === 0 && (
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(g.id)} title="حذف" style={{ color: 'var(--color-error)' }}>
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
          <div className="modal-box" style={{ maxWidth: 560, width: '95%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                {editItem ? 'تعديل مجموعة الموردين' : 'إضافة مجموعة موردين'}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => !saving && setShowModal(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.875rem' }}>
                <div>
                  <label>الكود <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <input className={`input numeric${errors.code ? ' input-error' : ''}`} value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value })} placeholder="مثال: GRP-001" />
                  {errors.code && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{errors.code}</span>}
                </div>
                <div>
                  <label>الاسم العربي <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <input className={`input${errors.nameAr ? ' input-error' : ''}`} value={form.nameAr}
                    onChange={e => setForm({ ...form, nameAr: e.target.value })} placeholder="مثال: موردون محليون" />
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div>
                  <label>الحساب المحاسبي الافتراضي</label>
                  <select className="input" value={form.defaultAccountId} onChange={e => setForm({ ...form, defaultAccountId: e.target.value })}>
                    <option value="">— لا يوجد —</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name_ar}</option>)}
                  </select>
                </div>
                <div>
                  <label>العملة الافتراضية</label>
                  <select className="input" value={form.defaultCurrencyId} onChange={e => setForm({ ...form, defaultCurrencyId: e.target.value })}>
                    <option value="">— لا يوجد —</option>
                    {currencies.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name_ar}</option>)}
                  </select>
                </div>
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
                  {saving ? <><span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>progress_activity</span> جارٍ الحفظ...</> : <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>{editItem ? 'حفظ التعديلات' : 'إضافة'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
