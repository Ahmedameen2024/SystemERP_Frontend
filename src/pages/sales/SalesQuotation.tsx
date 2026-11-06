import { useState, useEffect } from 'react';
import api from '../../api/client';

interface Quotation {
  id: string;
  quotation_number: string;
  customer_name: string;
  quotation_date: string;
  valid_until: string;
  net_amount: number | string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
}

interface Customer {
  id: string;
  name_ar: string;
}

export default function SalesQuotation() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Quotation | null>(null);
  const [form, setForm] = useState({
    customerId: '',
    date: new Date().toISOString().slice(0, 10),
    validUntil: '',
    amount: 0,
    status: 'Draft' as any,
    notes: '',
  });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [quotesRes, custRes] = await Promise.all([
        api.get('/sales/quotations'),
        api.get('/sales/customers'),
      ]);
      setQuotations(quotesRes.data?.data || []);
      const custList = custRes.data?.data || [];
      setCustomers(custList);
      if (custList.length > 0 && !form.customerId) {
        setForm(f => ({ ...f, customerId: custList[0].id }));
      }
    } catch (err: any) {
      console.error('Failed to load quotations:', err);
      setError('حدث خطأ في جلب عروض الأسعار');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setEditItem(null);
    setForm({
      customerId: customers[0]?.id || '',
      date: new Date().toISOString().slice(0, 10),
      validUntil: '',
      amount: 0,
      status: 'Draft',
      notes: '',
    });
    setShowModal(true);
  };

  const openEdit = (q: Quotation) => {
    setEditItem(q);
    setForm({
      customerId: '',
      date: q.quotation_date,
      validUntil: q.valid_until || '',
      amount: Number(q.net_amount || 0),
      status: q.status,
      notes: '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`/sales/quotations/${editItem.id}`, {
          status: form.status,
          validUntil: form.validUntil || null,
          notes: form.notes,
        });
      } else {
        await api.post('/sales/quotations', {
          customerId: form.customerId,
          quotationDate: form.date,
          validUntil: form.validUntil || null,
          notes: form.notes,
          lines: [
            {
              itemId: null,
              quantity: 1,
              unitPrice: Number(form.amount || 0),
              totalAmount: Number(form.amount || 0),
              taxAmount: 0,
            },
          ],
        });
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطأ في حفظ عرض السعر');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف عرض السعر هذا؟')) return;
    try {
      await api.delete(`/sales/quotations/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطأ في حذف عرض السعر');
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>عروض الأسعار للعملاء</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            إنشاء وإدارة عروض الأسعار ومتابعة الموافقات والتحويل إلى فواتير
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchData} disabled={loading}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
            تحديث
          </button>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            عرض سعر جديد
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
            جاري جلب عروض الأسعار من قاعدة البيانات...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم العرض</th>
                <th>العميل</th>
                <th>تاريخ العرض</th>
                <th>صالح حتى</th>
                <th style={{ textAlign: 'left' }}>القيمة الصافية</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد عروض أسعار مسجلة. اضغط "عرض سعر جديد" لإضافة أول عرض.
                  </td>
                </tr>
              ) : (
                quotations.map(q => (
                  <tr key={q.id}>
                    <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{q.quotation_number}</span></td>
                    <td style={{ fontWeight: 500 }}>{q.customer_name}</td>
                    <td className="numeric">{q.quotation_date ? new Date(q.quotation_date).toLocaleDateString('ar-SA') : '—'}</td>
                    <td className="numeric">{q.valid_until ? new Date(q.valid_until).toLocaleDateString('ar-SA') : '—'}</td>
                    <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>
                      {Number(q.net_amount || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س
                    </td>
                    <td>
                      <span className={`chip ${
                        q.status === 'Accepted' ? 'chip-success' : 
                        q.status === 'Sent' ? 'chip-warning' : 
                        q.status === 'Rejected' ? 'chip-error' : 'chip-neutral'
                      }`}>
                        {q.status === 'Accepted' ? 'مقبول' : 
                         q.status === 'Sent' ? 'مرسل للعميل' : 
                         q.status === 'Rejected' ? 'مرفوض' : 'مسودة'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(q)} title="تعديل">
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(q.id)} title="حذف" style={{ color: '#ba1a1a' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 500 }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: '0 0 1rem' }}>
              {editItem ? `تعديل عرض السعر (${editItem.quotation_number})` : 'إنشاء عرض سعر جديد'}
            </h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {!editItem && (
                <div>
                  <label className="label">العميل</label>
                  <select 
                    className="input" 
                    value={form.customerId} 
                    onChange={e => setForm({ ...form, customerId: e.target.value })}
                    required
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name_ar}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label">تاريخ العرض</label>
                  <input 
                    type="date" 
                    className="input" 
                    value={form.date} 
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    required 
                  />
                </div>
                <div>
                  <label className="label">صالح حتى</label>
                  <input 
                    type="date" 
                    className="input" 
                    value={form.validUntil} 
                    onChange={e => setForm({ ...form, validUntil: e.target.value })} 
                  />
                </div>
              </div>

              {!editItem && (
                <div>
                  <label className="label">القيمة الإجمالية التقديرية (ر.س)</label>
                  <input 
                    type="number" 
                    className="input" 
                    value={form.amount} 
                    onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01" 
                    required 
                  />
                </div>
              )}

              <div>
                <label className="label">الحالة</label>
                <select 
                  className="input" 
                  value={form.status} 
                  onChange={e => setForm({ ...form, status: e.target.value as any })}
                >
                  <option value="Draft">مسودة</option>
                  <option value="Sent">مرسل للعميل</option>
                  <option value="Accepted">مقبول</option>
                  <option value="Rejected">مرفوض</option>
                </select>
              </div>

              <div>
                <label className="label">ملاحظات وشروط العرض</label>
                <textarea 
                  className="input" 
                  rows={3} 
                  value={form.notes} 
                  onChange={e => setForm({ ...form, notes: e.target.value })} 
                />
              </div>

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
