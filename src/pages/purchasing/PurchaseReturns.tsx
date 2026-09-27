import { useState, useEffect } from 'react';
import api from '../../api/client';

interface ReturnLine {
  item_id: string;
  item_name?: string;
  quantity: number;
  unit_cost: number;
  tax_rate?: number;
  total_amount?: number;
  reason?: string;
}

interface PurchaseReturn {
  id: string;
  return_number: string;
  return_date: string;
  original_invoice_id: string;
  original_invoice_number: string;
  supplier_id: string;
  supplier_name: string;
  total_amount: number;
  tax_amount: number;
  net_amount: number;
  currency_id: string;
  currency_code: string;
  reason: string;
  status: 'Draft' | 'Posted' | 'Cancelled';
  notes: string;
  created_at: string;
  lines?: ReturnLine[];
}

interface InvoiceOption {
  id: string;
  invoice_number: string;
  invoice_date: string;
  supplier_id: string;
  supplier_name: string;
  warehouse_id?: string;
  net_amount: number;
  lines?: any[];
}

interface WarehouseOption {
  id: string;
  name_ar: string;
}

export default function PurchaseReturns() {
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewItem, setViewItem] = useState<PurchaseReturn | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [selectedInvoice, setSelectedInvoice] = useState<string>('');
  const [returnDate, setReturnDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [reason, setReason] = useState<string>('Damaged');
  const [notes, setNotes] = useState<string>('');
  const [formLines, setFormLines] = useState<{
    itemId: string;
    itemName: string;
    invoiceQuantity: number;
    returnQuantity: number;
    unitCost: number;
    taxRate: number;
    notes?: string;
  }[]>([]);

  useEffect(() => {
    fetchInitial();
  }, []);

  const fetchInitial = async () => {
    setLoading(true);
    try {
      const [retRes, invRes, whRes] = await Promise.all([
        api.get('/purchasing/returns').catch(() => ({ data: { data: [] } })),
        api.get('/purchasing/invoices').catch(() => ({ data: { data: [] } })),
        api.get('/inventory/warehouses').catch(() => ({ data: { data: [] } })),
      ]);
      setReturns(retRes.data.data || []);
      // Only Posted invoices can be returned
      const postedInvoices = (invRes.data.data || []).filter((inv: any) => inv.status === 'Posted');
      setInvoices(postedInvoices);
      setWarehouses(whRes.data.data || []);
    } catch {
      setMsg({ type: 'error', text: 'حدث خطأ أثناء تحميل البيانات' });
    } finally {
      setLoading(false);
    }
  };

  const fetchReturns = async () => {
    try {
      const res = await api.get('/purchasing/returns');
      setReturns(res.data.data || []);
    } catch {
      // ignore
    }
  };

  const handleSelectInvoice = async (invId: string) => {
    setSelectedInvoice(invId);
    if (!invId) {
      setFormLines([]);
      return;
    }
    try {
      const res = await api.get(`/purchasing/invoices/${invId}`);
      const invData = res.data.data;
      if (invData.warehouse_id) setWarehouseId(invData.warehouse_id);
      if (invData.lines && invData.lines.length > 0) {
        const lines = invData.lines.map((l: any) => ({
          itemId: l.item_id,
          itemName: l.item_name || l.item_name_ar || 'صنف',
          invoiceQuantity: Number(l.quantity) || 0,
          returnQuantity: 0,
          unitCost: Number(l.unit_price || l.unit_cost) || 0,
          taxRate: Number(l.tax_rate) || 15,
          notes: '',
        }));
        setFormLines(lines);
      }
    } catch {
      setMsg({ type: 'error', text: 'فشل في تحميل تفاصيل الفاتورة المختارة' });
    }
  };

  const handleLineQtyChange = (index: number, val: number) => {
    const updated = [...formLines];
    updated[index].returnQuantity = val;
    setFormLines(updated);
  };

  const calculateReturnTotal = () => {
    return formLines.reduce((acc, l) => {
      const gross = (Number(l.returnQuantity) || 0) * (Number(l.unitCost) || 0);
      const tax = gross * ((Number(l.taxRate) || 0) / 100);
      return acc + gross + tax;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) {
      setMsg({ type: 'error', text: 'يرجى اختيار الفاتورة الأصلية' });
      return;
    }
    const linesToSubmit = formLines.filter(l => l.returnQuantity > 0);
    if (linesToSubmit.length === 0) {
      setMsg({ type: 'error', text: 'يرجى إدخال كمية مرتجعة واحدة على الأقل أكبر من صفر' });
      return;
    }

    setSaving(true);
    setMsg(null);
    try {
      await api.post('/purchasing/returns', {
        originalInvoiceId: selectedInvoice,
        returnDate,
        warehouseId: warehouseId || null,
        reason,
        notes,
        lines: linesToSubmit.map(l => ({
          itemId: l.itemId,
          quantity: l.returnQuantity,
          unitCost: l.unitCost,
          taxRate: l.taxRate,
          notes: l.notes,
        }))
      });
      setMsg({ type: 'success', text: 'تم إنشاء إشعار مردود المشتريات (مسودة) بنجاح' });
      setShowModal(false);
      setSelectedInvoice('');
      setFormLines([]);
      setNotes('');
      fetchReturns();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'فشل إنشاء مردود المشتريات' });
    } finally {
      setSaving(false);
    }
  };

  const handlePostReturn = async (id: string) => {
    if (!confirm('ترحيل المردود سيقوم بإنشاء قيد عكسي وتخفيض رصيد المورد وخصم المخزون. هل تود المتابعة؟')) {
      return;
    }
    try {
      await api.post(`/purchasing/returns/${id}/post`);
      setMsg({ type: 'success', text: 'تم ترحيل مردود المشتريات والتأثير على الحسابات والمخزون بنجاح!' });
      fetchReturns();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'فشل ترحيل المردود' });
    }
  };

  const filteredReturns = returns.filter(r => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>
            مردودات المشتريات (Purchase Returns)
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            إصدار إشعارات دائنة للموردين، رد البضائع للمخازن، وعكس القيود المحاسبية
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>assignment_return</span>
          مردود شراء جديد
        </button>
      </div>

      {msg && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          <span className="material-symbols-outlined">{msg.type === 'success' ? 'check_circle' : 'error'}</span>
          <span>{msg.text}</span>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div className="kpi-card">
          <span className="kpi-label">إجمالي سندات المردود</span>
          <span className="kpi-value numeric" style={{ color: 'var(--color-primary)' }}>{returns.length}</span>
        </div>
        <div className="kpi-card" style={{ borderTop: '3px solid #d97706' }}>
          <span className="kpi-label">مردودات قيد المراجعة (مسودة)</span>
          <span className="kpi-value numeric" style={{ color: '#d97706' }}>
            {returns.filter(r => r.status === 'Draft').length}
          </span>
        </div>
        <div className="kpi-card" style={{ borderTop: '3px solid #059669' }}>
          <span className="kpi-label">مردودات مرحّلة (تأثير مالي ومخزني)</span>
          <span className="kpi-value numeric" style={{ color: '#059669' }}>
            {returns.filter(r => r.status === 'Posted').length}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>تصفية الحالة:</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { id: 'ALL', label: 'الكل' },
            { id: 'Draft', label: 'مسودة' },
            { id: 'Posted', label: 'مرحّل' },
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

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم المردود</th>
                <th>التاريخ</th>
                <th>رقم الفاتورة الأصلية</th>
                <th>المورد</th>
                <th>سبب المردود</th>
                <th style={{ textAlign: 'left' }}>المبلغ المرتجع</th>
                <th>الحالة</th>
                <th style={{ textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                    جاري تحميل مردودات المشتريات...
                  </td>
                </tr>
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد مردودات مشتريات مسجلة.
                  </td>
                </tr>
              ) : (
                filteredReturns.map(r => (
                  <tr key={r.id}>
                    <td>
                      <span className="numeric font-bold" style={{ color: 'var(--color-primary)' }}>
                        {r.return_number}
                      </span>
                    </td>
                    <td className="numeric">{new Date(r.return_date || r.created_at).toLocaleDateString('ar-EG')}</td>
                    <td>
                      <span className="numeric font-bold" style={{ color: 'var(--color-secondary)' }}>
                        {r.original_invoice_number}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.supplier_name}</td>
                    <td>
                      {r.reason === 'Damaged' ? 'بضاعة تالفة' :
                       r.reason === 'NonCompliant' ? 'غير مطابقة للمواصفات' :
                       r.reason === 'Surplus' ? 'فائض عن الحاجة' : r.reason || 'أخرى'}
                    </td>
                    <td className="numeric font-bold" style={{ textAlign: 'left', color: 'var(--color-error)' }}>
                      {(Number(r.net_amount) || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })} {r.currency_code}
                    </td>
                    <td>
                      <span className={`chip ${r.status === 'Posted' ? 'chip-success' : 'chip-warning'}`}>
                        {r.status === 'Posted' ? 'مرحّل' : 'مسودة'}
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
                            onClick={() => handlePostReturn(r.id)}
                            className="btn btn-sm btn-primary"
                            style={{ background: '#059669', borderColor: '#059669' }}
                            title="ترحيل المردود"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                            ترحيل
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
                تفاصيل مردود المشتريات: {viewItem.return_number}
              </h2>
              <button onClick={() => setViewItem(null)} className="btn-close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: 'var(--color-surface-variant)', padding: '0.75rem', borderRadius: 8 }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>تاريخ المردود:</span>
                  <div className="numeric font-bold">{new Date(viewItem.return_date || viewItem.created_at).toLocaleDateString('ar-EG')}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>الفاتورة الأصلية:</span>
                  <div className="numeric font-bold" style={{ color: 'var(--color-secondary)' }}>{viewItem.original_invoice_number}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>المورد:</span>
                  <div style={{ fontWeight: 600 }}>{viewItem.supplier_name}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>المبلغ الإجمالي المرتجع:</span>
                  <div className="numeric font-bold" style={{ color: 'var(--color-error)' }}>
                    {(Number(viewItem.net_amount) || 0).toLocaleString('ar-SA')} {viewItem.currency_code}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>الحالة:</span>
                  <div>
                    <span className={`chip ${viewItem.status === 'Posted' ? 'chip-success' : 'chip-warning'}`}>
                      {viewItem.status === 'Posted' ? 'مرحّل' : 'مسودة'}
                    </span>
                  </div>
                </div>
              </div>

              {viewItem.notes && (
                <div style={{ fontSize: '0.875rem', background: '#f8fafc', padding: '0.5rem', borderRadius: 6 }}>
                  <strong>ملاحظات:</strong> {viewItem.notes}
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
          <div className="modal-content" style={{ maxWidth: 900 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                تسجيل مردود مشتريات جديد
              </h2>
              <button onClick={() => setShowModal(false)} className="btn-close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">الفاتورة الأصلية المرحّلة *</label>
                  <select
                    className="form-input"
                    value={selectedInvoice}
                    onChange={e => handleSelectInvoice(e.target.value)}
                    required
                  >
                    <option value="">-- اختر الفاتورة --</option>
                    {invoices.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_number} - {inv.supplier_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">تاريخ المردود *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={returnDate}
                    onChange={e => setReturnDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">المستودع المردود منه</label>
                  <select
                    className="form-input"
                    value={warehouseId}
                    onChange={e => setWarehouseId(e.target.value)}
                  >
                    <option value="">-- المستودع --</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name_ar}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">سبب الرد *</label>
                  <select
                    className="form-input"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    required
                  >
                    <option value="Damaged">بضاعة تالفة</option>
                    <option value="NonCompliant">غير مطابقة للمواصفات</option>
                    <option value="Surplus">فائض عن الحاجة</option>
                    <option value="Expired">منتهية الصلاحية</option>
                    <option value="Other">سبب آخر</option>
                  </select>
                </div>
              </div>

              {/* Items in Invoice */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
                  أصناف الفاتورة والكميات المراد إرجاعها للمورد
                </label>
                {formLines.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', background: '#f8fafc', borderRadius: 8, color: 'var(--color-on-surface-variant)' }}>
                    يرجى اختيار فاتورة شراء مرحلة لعرض بنودها وتحديد كميات المردود
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 8 }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>الصنف</th>
                          <th>كمية الفاتورة</th>
                          <th>الكمية المرتجعة *</th>
                          <th>سعر الوحدة</th>
                          <th>نسبة الضريبة</th>
                          <th>إجمالي القيمة المرتجعة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formLines.map((l, idx) => {
                          const gross = (l.returnQuantity || 0) * (l.unitCost || 0);
                          const tax = gross * ((l.taxRate || 0) / 100);
                          const total = gross + tax;
                          return (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600 }}>{l.itemName}</td>
                              <td><span className="numeric">{l.invoiceQuantity}</span></td>
                              <td>
                                <input
                                  type="number"
                                  min={0}
                                  max={l.invoiceQuantity}
                                  className="form-input"
                                  style={{ maxWidth: 120 }}
                                  value={l.returnQuantity}
                                  onChange={e => handleLineQtyChange(idx, Number(e.target.value))}
                                  required
                                />
                              </td>
                              <td><span className="numeric">{l.unitCost.toFixed(2)}</span></td>
                              <td><span className="numeric">{l.taxRate}%</span></td>
                              <td className="numeric font-bold" style={{ color: 'var(--color-error)' }}>
                                {total.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'right', fontWeight: 700 }}>
                            إجمالي قيمة المردود المستحقة على المورد (شامل الضريبة):
                          </td>
                          <td className="numeric font-bold" style={{ fontSize: '1.05rem', color: 'var(--color-error)' }}>
                            {calculateReturnTotal().toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">ملاحظات وتفاصيل إضافية</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="ملاحظات حول سبب الرد، موافقة المورد..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">
                  إلغاء
                </button>
                <button type="submit" disabled={saving || formLines.length === 0} className="btn btn-primary">
                  {saving ? 'جاري الحفظ...' : 'حفظ مردود المشتريات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
