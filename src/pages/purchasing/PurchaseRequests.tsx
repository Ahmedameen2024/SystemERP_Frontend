import { useState, useEffect } from 'react';
import api from '../../api/client';

interface RequestItem {
  item_id: string;
  item_name?: string;
  item_code?: string;
  quantity: number;
  estimated_cost: number;
  notes?: string;
}

interface PurchaseRequest {
  id: string;
  request_number: string;
  request_date: string;
  required_date: string;
  department: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Draft' | 'Approved' | 'Converted' | 'Cancelled';
  notes: string;
  suggested_supplier_id?: string;
  suggested_supplier_name?: string;
  total_estimated_amount: number;
  converted_po_id?: string;
  converted_po_number?: string;
  items?: RequestItem[];
  created_at: string;
}

interface ItemOption {
  id: string;
  code: string;
  name_ar: string;
  purchase_price?: number;
}

interface SupplierOption {
  id: string;
  code: string;
  name_ar: string;
}

export default function PurchaseRequests() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [itemsList, setItemsList] = useState<ItemOption[]>([]);
  const [suppliersList, setSuppliersList] = useState<SupplierOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewItem, setViewItem] = useState<PurchaseRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    requiredDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    department: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
    suggestedSupplierId: '',
    notes: '',
    items: [
      { item_id: '', quantity: 1, estimated_cost: 0, notes: '' }
    ]
  });

  useEffect(() => {
    fetchInitial();
  }, []);

  const fetchInitial = async () => {
    setLoading(true);
    try {
      const [reqRes, itemsRes, supRes] = await Promise.all([
        api.get('/purchasing/requests').catch(() => ({ data: { data: [] } })),
        api.get('/inventory/items').catch(() => ({ data: { data: [] } })),
        api.get('/purchasing/suppliers').catch(() => ({ data: { data: [] } })),
      ]);
      setRequests(reqRes.data.data || []);
      setItemsList(itemsRes.data.data || []);
      setSuppliersList(supRes.data.data || []);
    } catch {
      setMsg({ type: 'error', text: 'حدث خطأ أثناء تحميل البيانات' });
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get('/purchasing/requests');
      setRequests(res.data.data || []);
    } catch {
      // ignore
    }
  };

  const handleAddItem = () => {
    setForm({
      ...form,
      items: [...form.items, { item_id: '', quantity: 1, estimated_cost: 0, notes: '' }]
    });
  };

  const handleRemoveItem = (index: number) => {
    if (form.items.length <= 1) return;
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index)
    });
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...form.items];
    (updated[index] as any)[field] = val;
    if (field === 'item_id') {
      const found = itemsList.find(it => it.id === val);
      if (found && found.purchase_price) {
        updated[index].estimated_cost = Number(found.purchase_price);
      }
    }
    setForm({ ...form, items: updated });
  };

  const calculateTotal = () => {
    return form.items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.estimated_cost) || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.items.some(it => !it.item_id || it.quantity <= 0)) {
      setMsg({ type: 'error', text: 'يرجى اختيار الصنف وتحديد كمية صحيحة لكل بند' });
      return;
    }

    setSaving(true);
    setMsg(null);
    try {
      await api.post('/purchasing/requests', {
        requestDate: new Date().toISOString().split('T')[0],
        expectedDate: form.requiredDate,
        supplierId: form.suggestedSupplierId || null,
        priority: form.priority === 'Urgent' ? 'Urgent' : form.priority === 'High' ? 'High' : form.priority === 'Low' ? 'Low' : 'Normal',
        notes: `${form.department ? `[القسم: ${form.department}] ` : ''}${form.notes || ''}`,
        lines: form.items.map(it => {
          const itemObj = itemsList.find(x => x.id === it.item_id);
          return {
            itemId: it.item_id,
            uomId: (itemObj as any)?.uom_id || null,
            quantity: Number(it.quantity),
            estimatedPrice: Number(it.estimated_cost),
            notes: it.notes
          };
        })
      });
      setMsg({ type: 'success', text: 'تم إنشاء طلب الشراء بنجاح' });
      setShowModal(false);
      setForm({
        requiredDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        department: '',
        priority: 'Medium',
        suggestedSupplierId: '',
        notes: '',
        items: [{ item_id: '', quantity: 1, estimated_cost: 0, notes: '' }]
      });
      fetchRequests();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'فشل إنشاء طلب الشراء' });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('هل أنت متأكد من اعتماد طلب الشراء هذا؟')) return;
    try {
      await api.post(`/purchasing/requests/${id}/approve`);
      setMsg({ type: 'success', text: 'تم اعتماد طلب الشراء بنجاح' });
      fetchRequests();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'فشل اعتماد الطلب' });
    }
  };

  const handleConvert = async (id: string) => {
    if (!confirm('سيتم إنشاء أمر شراء مباشر بناء على هذا الطلب المعتمد، هل تود المتابعة؟')) return;
    try {
      const res = await api.post(`/purchasing/requests/${id}/convert`);
      setMsg({ type: 'success', text: `تم تحويل الطلب بنجاح إلى أمر شراء رقم: ${res.data.data?.orderNumber || res.data.data?.order_number || ''}` });
      fetchRequests();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'فشل تحويل الطلب إلى أمر شراء' });
    }
  };

  const filteredRequests = requests.filter(r => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>
            طلبات الشراء (Purchase Requests)
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            تسجيل احتياجات الأقسام، مراجعتها واعتمادها، وتحويلها إلى أوامر شراء رسمية
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
          طلب شراء جديد
        </button>
      </div>

      {msg && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          <span className="material-symbols-outlined">{msg.type === 'success' ? 'check_circle' : 'error'}</span>
          <span>{msg.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="kpi-card">
          <span className="kpi-label">إجمالي الطلبات</span>
          <span className="kpi-value numeric" style={{ color: 'var(--color-primary)' }}>{requests.length}</span>
        </div>
        <div className="kpi-card" style={{ borderTop: '3px solid #d97706' }}>
          <span className="kpi-label">بانتظار الاعتماد (مسودة)</span>
          <span className="kpi-value numeric" style={{ color: '#d97706' }}>
            {requests.filter(r => r.status === 'Draft').length}
          </span>
        </div>
        <div className="kpi-card" style={{ borderTop: '3px solid #059669' }}>
          <span className="kpi-label">معتمدة جاهزة للتحويل</span>
          <span className="kpi-value numeric" style={{ color: '#059669' }}>
            {requests.filter(r => r.status === 'Approved').length}
          </span>
        </div>
        <div className="kpi-card" style={{ borderTop: '3px solid #6366f1' }}>
          <span className="kpi-label">محولة لأوامر شراء</span>
          <span className="kpi-value numeric" style={{ color: '#6366f1' }}>
            {requests.filter(r => r.status === 'Converted').length}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>تصفية حسب الحالة:</span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'الكل' },
            { id: 'Draft', label: 'مسودة' },
            { id: 'Approved', label: 'معتمد' },
            { id: 'Converted', label: 'محول لأمر شراء' },
            { id: 'Cancelled', label: 'ملغي' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`btn btn-sm ${statusFilter === f.id ? 'btn-primary' : 'btn-outline'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>التاريخ</th>
                <th>تاريخ الحاجة</th>
                <th>القسم / الطالب</th>
                <th>الأولوية</th>
                <th>المورد المقترح</th>
                <th style={{ textAlign: 'left' }}>التكلفة التقديرية</th>
                <th>الحالة</th>
                <th style={{ textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                    جاري تحميل طلبات الشراء...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد طلبات شراء مطابقة.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(r => (
                  <tr key={r.id}>
                    <td>
                      <span className="numeric font-bold" style={{ color: 'var(--color-primary)' }}>
                        {r.request_number}
                      </span>
                    </td>
                    <td className="numeric">{new Date(r.request_date || r.created_at).toLocaleDateString('ar-EG')}</td>
                    <td className="numeric">{r.required_date ? new Date(r.required_date).toLocaleDateString('ar-EG') : '-'}</td>
                    <td style={{ fontWeight: 500 }}>{r.department || 'عام'}</td>
                    <td>
                      <span className={`chip ${
                        r.priority === 'Urgent' ? 'chip-danger' :
                        r.priority === 'High' ? 'chip-warning' : 'chip-neutral'
                      }`}>
                        {r.priority === 'Urgent' ? 'طارئ' : r.priority === 'High' ? 'عالي' : r.priority === 'Low' ? 'منخفض' : 'متوسط'}
                      </span>
                    </td>
                    <td>{r.suggested_supplier_name || '-'}</td>
                    <td className="numeric font-bold" style={{ textAlign: 'left', color: 'var(--color-primary)' }}>
                      {(Number(r.total_estimated_amount) || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س
                    </td>
                    <td>
                      <span className={`chip ${
                        r.status === 'Approved' ? 'chip-success' :
                        r.status === 'Converted' ? 'chip-info' :
                        r.status === 'Cancelled' ? 'chip-danger' : 'chip-neutral'
                      }`}>
                        {r.status === 'Draft' ? 'مسودة' :
                         r.status === 'Approved' ? 'معتمد' :
                         r.status === 'Converted' ? 'تم تحويله لأمر' : 'ملغي'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          onClick={() => setViewItem(r)}
                          className="btn btn-outline btn-sm"
                          title="عرض التفاصيل"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                        </button>

                        {r.status === 'Draft' && (
                          <button
                            onClick={() => handleApprove(r.id)}
                            className="btn btn-sm btn-primary"
                            style={{ background: '#059669', borderColor: '#059669' }}
                            title="اعتماد الطلب"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                            اعتماد
                          </button>
                        )}

                        {r.status === 'Approved' && (
                          <button
                            onClick={() => handleConvert(r.id)}
                            className="btn btn-sm btn-primary"
                            style={{ background: '#6366f1', borderColor: '#6366f1' }}
                            title="تحويل إلى أمر شراء"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>transform</span>
                            تحويل لأمر شراء
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {viewItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 650 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                تفاصيل طلب الشراء: {viewItem.request_number}
              </h2>
              <button onClick={() => setViewItem(null)} className="btn-close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: 'var(--color-surface-variant)', padding: '0.75rem', borderRadius: 8 }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>تاريخ الطلب:</span>
                  <div className="numeric font-bold">{new Date(viewItem.request_date || viewItem.created_at).toLocaleDateString('ar-EG')}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>تاريخ الحاجة:</span>
                  <div className="numeric font-bold">{viewItem.required_date ? new Date(viewItem.required_date).toLocaleDateString('ar-EG') : '-'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>القسم / الطالب:</span>
                  <div style={{ fontWeight: 600 }}>{viewItem.department || 'عام'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>المورد المقترح:</span>
                  <div>{viewItem.suggested_supplier_name || 'غير محدد'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>الحالة:</span>
                  <div>
                    <span className="chip chip-info">{viewItem.status}</span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>التكلفة التقديرية:</span>
                  <div className="numeric font-bold" style={{ color: 'var(--color-primary)' }}>
                    {(Number(viewItem.total_estimated_amount) || 0).toLocaleString('ar-SA')} ر.س
                  </div>
                </div>
              </div>

              {viewItem.notes && (
                <div style={{ fontSize: '0.875rem', background: '#f8fafc', padding: '0.5rem', borderRadius: 6 }}>
                  <strong>ملاحظات / أسباب الطلب:</strong> {viewItem.notes}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button onClick={() => setViewItem(null)} className="btn btn-outline">
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 850 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                إنشاء طلب شراء جديد
              </h2>
              <button onClick={() => setShowModal(false)} className="btn-close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem' }}>
              {/* Header Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">القسم / الطالب *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="مثال: قسم الصيانة / المستودع"
                    value={form.department}
                    onChange={e => setForm({ ...form, department: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">تاريخ الحاجة *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.requiredDate}
                    onChange={e => setForm({ ...form, requiredDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">الأولوية</label>
                  <select
                    className="form-input"
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value as any })}
                  >
                    <option value="Low">منخفضة</option>
                    <option value="Medium">متوسطة</option>
                    <option value="High">عالية</option>
                    <option value="Urgent">طارئة ومستعجلة</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">المورد المقترح (اختياري)</label>
                  <select
                    className="form-input"
                    value={form.suggestedSupplierId}
                    onChange={e => setForm({ ...form, suggestedSupplierId: e.target.value })}
                  >
                    <option value="">-- اختياري --</option>
                    {suppliersList.map(s => (
                      <option key={s.id} value={s.id}>{s.name_ar} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>الأصناف والبنود المطلوبة</label>
                  <button type="button" onClick={handleAddItem} className="btn btn-outline btn-sm">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                    إضافة صنف
                  </button>
                </div>
                <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 8 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40%' }}>الصنف المطلوب *</th>
                        <th style={{ width: '15%' }}>الكمية</th>
                        <th style={{ width: '20%' }}>التكلفة التقديرية</th>
                        <th style={{ width: '20%' }}>المجموع التقديري</th>
                        <th style={{ width: '5%', textAlign: 'center' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((it, idx) => (
                        <tr key={idx}>
                          <td>
                            <select
                              className="form-input"
                              value={it.item_id}
                              onChange={e => handleItemChange(idx, 'item_id', e.target.value)}
                              required
                            >
                              <option value="">-- اختر الصنف --</option>
                              {itemsList.map(item => (
                                <option key={item.id} value={item.id}>
                                  {item.name_ar} ({item.code})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              min={1}
                              className="form-input"
                              value={it.quantity}
                              onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              className="form-input"
                              value={it.estimated_cost}
                              onChange={e => handleItemChange(idx, 'estimated_cost', e.target.value)}
                            />
                          </td>
                          <td className="numeric font-bold" style={{ color: 'var(--color-primary)' }}>
                            {((Number(it.quantity) || 0) * (Number(it.estimated_cost) || 0)).toLocaleString('ar-SA')} ر.س
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {form.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                style={{ color: 'var(--color-error)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700 }}>
                          إجمالي التكلفة التقديرية للطلب:
                        </td>
                        <td className="numeric font-bold" style={{ fontSize: '1.05rem', color: 'var(--color-primary)' }}>
                          {calculateTotal().toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">ملاحظات ومبررات الشراء</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="بيان سبب طلب الشراء أو أي مواصفات خاصة..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">
                  إلغاء
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'جاري الحفظ...' : 'حفظ وإرسال الطلب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
