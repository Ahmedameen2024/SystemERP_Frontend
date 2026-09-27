import { useState, useEffect } from 'react';
import api from '../../api/client';

interface ReceiptLine {
  item_id: string;
  item_name?: string;
  uom_id?: string;
  ordered_quantity: number;
  received_quantity: number;
  unit_cost: number;
  total_cost?: number;
  notes?: string;
  po_line_id?: string;
}

interface PurchaseReceipt {
  id: string;
  receipt_number: string;
  receipt_date: string;
  purchase_order_id: string;
  order_number: string;
  supplier_id: string;
  supplier_name: string;
  warehouse_id: string;
  warehouse_name: string;
  currency_id: string;
  currency_code: string;
  exchange_rate: number;
  status: 'Draft' | 'Posted' | 'Cancelled';
  notes: string;
  created_at: string;
  lines?: ReceiptLine[];
}

interface PurchaseOrderOption {
  id: string;
  order_number: string;
  order_date: string;
  supplier_id: string;
  supplier_name: string;
  warehouse_id: string;
  currency_id: string;
  exchange_rate: number;
  status: string;
  lines?: any[];
}

interface WarehouseOption {
  id: string;
  name_ar: string;
}

export default function PurchaseReceipts() {
  const [receipts, setReceipts] = useState<PurchaseReceipt[]>([]);
  const [orders, setOrders] = useState<PurchaseOrderOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewItem, setViewItem] = useState<PurchaseReceipt | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [selectedPO, setSelectedPO] = useState<string>('');
  const [receiptDate, setReceiptDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [formLines, setFormLines] = useState<{
    poLineId?: string;
    itemId: string;
    itemName: string;
    uomId?: string;
    orderedQuantity: number;
    previouslyReceived: number;
    receivedQuantity: number;
    unitCost: number;
    notes?: string;
  }[]>([]);

  useEffect(() => {
    fetchInitial();
  }, []);

  const fetchInitial = async () => {
    setLoading(true);
    try {
      const [recRes, ordRes, whRes] = await Promise.all([
        api.get('/purchasing/receipts').catch(() => ({ data: { data: [] } })),
        api.get('/purchasing/orders').catch(() => ({ data: { data: [] } })),
        api.get('/inventory/warehouses').catch(() => ({ data: { data: [] } })),
      ]);
      setReceipts(recRes.data.data || []);
      // Only POs that are Approved or PartiallyReceived
      const poList = (ordRes.data.data || []).filter((o: any) =>
        ['Approved', 'PartiallyReceived'].includes(o.status)
      );
      setOrders(poList);
      setWarehouses(whRes.data.data || []);
    } catch {
      setMsg({ type: 'error', text: 'فشل في تحميل بيانات استلام المشتريات' });
    } finally {
      setLoading(false);
    }
  };

  const fetchReceipts = async () => {
    try {
      const res = await api.get('/purchasing/receipts');
      setReceipts(res.data.data || []);
    } catch {
      // ignore
    }
  };

  const handleSelectPO = async (poId: string) => {
    setSelectedPO(poId);
    if (!poId) {
      setFormLines([]);
      return;
    }
    try {
      const res = await api.get(`/purchasing/orders/${poId}`);
      const poData = res.data.data;
      if (poData.warehouse_id) {
        setWarehouseId(poData.warehouse_id);
      }
      if (poData.lines && poData.lines.length > 0) {
        const lines = poData.lines.map((l: any) => {
          const ordered = Number(l.quantity) || 0;
          const prev = Number(l.received_quantity) || 0;
          const remaining = Math.max(0, ordered - prev);
          return {
            poLineId: l.id,
            itemId: l.item_id,
            itemName: l.item_name || l.item_name_ar || 'صنف',
            uomId: l.uom_id,
            orderedQuantity: ordered,
            previouslyReceived: prev,
            receivedQuantity: remaining,
            unitCost: Number(l.unit_cost) || 0,
            notes: '',
          };
        });
        setFormLines(lines);
      }
    } catch {
      setMsg({ type: 'error', text: 'فشل في تحميل تفاصيل أمر الشراء المختار' });
    }
  };

  const handleLineQtyChange = (index: number, val: number) => {
    const updated = [...formLines];
    updated[index].receivedQuantity = val;
    setFormLines(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) {
      setMsg({ type: 'error', text: 'يرجى اختيار أمر الشراء' });
      return;
    }
    const linesToSubmit = formLines.filter(l => l.receivedQuantity > 0);
    if (linesToSubmit.length === 0) {
      setMsg({ type: 'error', text: 'يرجى إدخال كمية مستلمة واحدة على الأقل أكبر من صفر' });
      return;
    }

    setSaving(true);
    setMsg(null);
    try {
      await api.post('/purchasing/receipts', {
        purchaseOrderId: selectedPO,
        receiptDate,
        warehouseId: warehouseId || null,
        notes,
        lines: linesToSubmit.map(l => ({
          poLineId: l.poLineId,
          itemId: l.itemId,
          uomId: l.uomId,
          orderedQuantity: l.orderedQuantity,
          receivedQuantity: l.receivedQuantity,
          unitCost: l.unitCost,
          notes: l.notes,
        }))
      });
      setMsg({ type: 'success', text: 'تم إنشاء سند استلام المشتريات (مسودة) بنجاح' });
      setShowModal(false);
      setSelectedPO('');
      setFormLines([]);
      setNotes('');
      fetchReceipts();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'فشل إنشاء سند الاستلام' });
    } finally {
      setSaving(false);
    }
  };

  const handlePostReceipt = async (id: string) => {
    if (!confirm('ترحيل سند الاستلام سيقوم بإضافة الكميات إلى رصيد المخزون في المستودع وتحديث حالة أمر الشراء. هل تود المتابعة؟')) {
      return;
    }
    try {
      await api.post(`/purchasing/receipts/${id}/post`);
      setMsg({ type: 'success', text: 'تم ترحيل سند الاستلام وتحديث أرصدة المخزون بنجاح!' });
      fetchReceipts();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'فشل ترحيل سند الاستلام' });
    }
  };

  const filteredReceipts = receipts.filter(r => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>
            استلام بضاعة المشتريات (Goods Receipt Note - GRN)
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            فحص وتوريد البضاعة للمستودعات بناءً على أوامر الشراء المعتمدة مع التأثير الفوري على المخزون
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>input</span>
          سند استلام جديد
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
          <span className="kpi-label">إجمالي سندات الاستلام</span>
          <span className="kpi-value numeric" style={{ color: 'var(--color-primary)' }}>{receipts.length}</span>
        </div>
        <div className="kpi-card" style={{ borderTop: '3px solid #d97706' }}>
          <span className="kpi-label">سندات قيد الفحص (مسودة)</span>
          <span className="kpi-value numeric" style={{ color: '#d97706' }}>
            {receipts.filter(r => r.status === 'Draft').length}
          </span>
        </div>
        <div className="kpi-card" style={{ borderTop: '3px solid #059669' }}>
          <span className="kpi-label">سندات مرحّلة بالمخزون</span>
          <span className="kpi-value numeric" style={{ color: '#059669' }}>
            {receipts.filter(r => r.status === 'Posted').length}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>تصفية الحالة:</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { id: 'ALL', label: 'الكل' },
            { id: 'Draft', label: 'مسودة (غير مرحل)' },
            { id: 'Posted', label: 'مرحّل بالمخزن' },
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
                <th>رقم السند</th>
                <th>تاريخ الاستلام</th>
                <th>رقم أمر الشراء</th>
                <th>المورد</th>
                <th>المستودع المستلم</th>
                <th>العملة</th>
                <th>الحالة</th>
                <th style={{ textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                    جاري تحميل سندات الاستلام...
                  </td>
                </tr>
              ) : filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد سندات استلام مطابقة.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map(r => (
                  <tr key={r.id}>
                    <td>
                      <span className="numeric font-bold" style={{ color: 'var(--color-primary)' }}>
                        {r.receipt_number}
                      </span>
                    </td>
                    <td className="numeric">{new Date(r.receipt_date || r.created_at).toLocaleDateString('ar-EG')}</td>
                    <td>
                      <span className="numeric font-bold" style={{ color: 'var(--color-secondary)' }}>
                        {r.order_number}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.supplier_name}</td>
                    <td>{r.warehouse_name || 'المستودع الرئيسي'}</td>
                    <td><span className="numeric">{r.currency_code}</span></td>
                    <td>
                      <span className={`chip ${r.status === 'Posted' ? 'chip-success' : 'chip-warning'}`}>
                        {r.status === 'Posted' ? 'مرحّل بالمخزون' : 'مسودة'}
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
                            onClick={() => handlePostReceipt(r.id)}
                            className="btn btn-sm btn-primary"
                            style={{ background: '#059669', borderColor: '#059669' }}
                            title="ترحيل للمخزون"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                            ترحيل للمخزون
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
                تفاصيل سند الاستلام: {viewItem.receipt_number}
              </h2>
              <button onClick={() => setViewItem(null)} className="btn-close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: 'var(--color-surface-variant)', padding: '0.75rem', borderRadius: 8 }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>تاريخ الاستلام:</span>
                  <div className="numeric font-bold">{new Date(viewItem.receipt_date || viewItem.created_at).toLocaleDateString('ar-EG')}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>أمر الشراء:</span>
                  <div className="numeric font-bold" style={{ color: 'var(--color-secondary)' }}>{viewItem.order_number}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>المورد:</span>
                  <div style={{ fontWeight: 600 }}>{viewItem.supplier_name}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>المستودع:</span>
                  <div>{viewItem.warehouse_name || 'الرئيسي'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>العملة:</span>
                  <div>{viewItem.currency_code}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>الحالة:</span>
                  <div>
                    <span className={`chip ${viewItem.status === 'Posted' ? 'chip-success' : 'chip-warning'}`}>
                      {viewItem.status === 'Posted' ? 'مرحّل بالمخزون' : 'مسودة'}
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
                إنشاء سند استلام بضاعة جديد (GRN)
              </h2>
              <button onClick={() => setShowModal(false)} className="btn-close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">أمر الشراء المعتمد *</label>
                  <select
                    className="form-input"
                    value={selectedPO}
                    onChange={e => handleSelectPO(e.target.value)}
                    required
                  >
                    <option value="">-- اختر أمر الشراء --</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.order_number} - {o.supplier_name} ({o.status === 'Approved' ? 'معتمد' : 'مستلم جزئياً'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">تاريخ الاستلام الفعلي *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={receiptDate}
                    onChange={e => setReceiptDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">المستودع المستلم *</label>
                  <select
                    className="form-input"
                    value={warehouseId}
                    onChange={e => setWarehouseId(e.target.value)}
                    required
                  >
                    <option value="">-- اختر المستودع --</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name_ar}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items in PO */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
                  أصناف أمر الشراء والكميات المستلمة
                </label>
                {formLines.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', background: '#f8fafc', borderRadius: 8, color: 'var(--color-on-surface-variant)' }}>
                    يرجى اختيار أمر شراء معتمد لعرض بنوده وتحديد الكميات المستلمة
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 8 }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>الصنف</th>
                          <th>الكمية المطلوبة بأمر الشراء</th>
                          <th>المستلم سابقاً</th>
                          <th>الكمية المستلمة الآن *</th>
                          <th>سعر الوحدة</th>
                          <th>إجمالي الاستلام</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formLines.map((l, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{l.itemName}</td>
                            <td><span className="numeric">{l.orderedQuantity}</span></td>
                            <td><span className="numeric">{l.previouslyReceived}</span></td>
                            <td>
                              <input
                                type="number"
                                min={0}
                                max={l.orderedQuantity - l.previouslyReceived}
                                className="form-input"
                                style={{ maxWidth: 120 }}
                                value={l.receivedQuantity}
                                onChange={e => handleLineQtyChange(idx, Number(e.target.value))}
                                required
                              />
                            </td>
                            <td><span className="numeric">{l.unitCost.toFixed(2)}</span></td>
                            <td className="numeric font-bold" style={{ color: 'var(--color-primary)' }}>
                              {(l.receivedQuantity * l.unitCost).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">ملاحظات الاستلام والفحص</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="حالة البضاعة، مطابقة المواصفات، رقم إذن الاستلام الورقي إن وجد..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">
                  إلغاء
                </button>
                <button type="submit" disabled={saving || formLines.length === 0} className="btn btn-primary">
                  {saving ? 'جاري الحفظ...' : 'حفظ سند الاستلام'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
