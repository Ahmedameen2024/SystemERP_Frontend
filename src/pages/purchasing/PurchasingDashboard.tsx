import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const KPICard = ({
  label,
  value,
  icon,
  color,
  sub,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
  sub?: string;
}) => (
  <div className="kpi-card fade-in" style={{ borderTop: `3px solid ${color}` }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span className="kpi-label">{label}</span>
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: '10px',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span className="material-symbols-outlined" style={{ color, fontSize: 22 }}>{icon}</span>
      </div>
    </div>
    <div className="kpi-value numeric" style={{ color, fontSize: '1.4rem' }}>{value}</div>
    {sub && (
      <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', marginTop: '0.25rem' }}>
        <span>{sub}</span>
      </div>
    )}
  </div>
);

export default function PurchasingDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/purchasing/dashboard');
      setData(res.data.data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const inv = data?.invoices || {};
  const sup = data?.suppliers || {};

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>
            لوحة قيادة المشتريات والموردين
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            نظرة شاملة ومباشرة على دورة المشتريات، المستحقات، أوامر الشراء، وفواتير الموردين
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link to="/purchasing/requests" className="btn btn-outline btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_circle</span>
            طلب شراء
          </Link>
          <Link to="/purchasing/orders" className="btn btn-outline btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>inventory</span>
            أمر شراء
          </Link>
          <Link to="/purchasing/receipts" className="btn btn-outline btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>input</span>
            استلام بضاعة
          </Link>
          <Link to="/purchasing/invoices" className="btn btn-primary btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>receipt</span>
            فاتورة مشتريات
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <KPICard
          label="إجمالي المشتريات"
          value={loading ? '...' : `${(inv.totalPurchases || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س`}
          icon="shopping_cart"
          color="var(--color-primary)"
          sub="إجمالي الفواتير المرحلة"
        />
        <KPICard
          label="مستحقات الموردين (AP)"
          value={loading ? '...' : `${(inv.totalOutstanding || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س`}
          icon="payments"
          color="#ba1a1a"
          sub={`${inv.openInvoices || 0} فاتورة مفتوحة`}
        />
        <KPICard
          label="إجمالي المسدد للموردين"
          value={loading ? '...' : `${(inv.totalPaid || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س`}
          icon="check_circle"
          color="#059669"
          sub="دفعات وسندات صرف مرحّلة"
        />
        <KPICard
          label="أوامر شراء قيد التوريد"
          value={loading ? '...' : `${data?.openOrders || 0} أمر`}
          icon="hourglass_empty"
          color="#d97706"
          sub="أوامر معتمدة بانتظار الاستلام"
        />
        <KPICard
          label="فواتير متأخرة السداد"
          value={loading ? '...' : `${inv.overdueInvoices || 0} فاتورة`}
          icon="warning"
          color="#dc2626"
          sub={`${data?.overdueSuppliers || 0} موردين متأخرين`}
        />
        <KPICard
          label="الموردون النشطون"
          value={loading ? '...' : `${sup.active || 0} من أصل ${sup.total || 0}`}
          icon="local_shipping"
          color="#6366f1"
          sub="مسجلين بالنظام"
        />
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        {[
          { title: 'دليل الموردين', path: '/purchasing/suppliers', icon: 'local_shipping', desc: 'ملفات الموردين والحد الائتماني' },
          { title: 'مجموعات الموردين', path: '/purchasing/supplier-groups', icon: 'group_work', desc: 'تصنيف وتقسيم الموردين' },
          { title: 'أنواع الموردين', path: '/purchasing/supplier-types', icon: 'category', desc: 'محلي، خارجي، خدمات' },
          { title: 'شروط الدفع', path: '/purchasing/payment-terms', icon: 'calendar_month', desc: 'فترات واستحقاقات السداد' },
          { title: 'مردودات المشتريات', path: '/purchasing/returns', icon: 'assignment_return', desc: 'إشعارات دائنة ورد بضاعة' },
          { title: 'التقارير التحليلية', path: '/purchasing/reports', icon: 'assessment', desc: 'أعمار الديون وكشوف الحسابات' },
        ].map((c, i) => (
          <Link
            key={i}
            to={c.path}
            className="card"
            style={{
              padding: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'var(--color-primary-light, #e0e7ff)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{c.icon}</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{c.title}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant)' }}>{c.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Two Column Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Recent Invoices */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>receipt</span>
              آخر فواتير المشتريات
            </h3>
            <Link to="/purchasing/invoices" style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>
              عرض الكل &larr;
            </Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم الفاتورة</th>
                  <th>المورد</th>
                  <th style={{ textAlign: 'left' }}>المبلغ</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '1rem' }}>جاري التحميل...</td></tr>
                ) : (!data?.recentInvoices || data.recentInvoices.length === 0) ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-on-surface-variant)' }}>لا توجد فواتير مسجلة بعد</td></tr>
                ) : (
                  data.recentInvoices.map((inv: any, idx: number) => (
                    <tr key={idx}>
                      <td><span className="numeric font-bold" style={{ color: 'var(--color-primary)' }}>{inv.invoice_number}</span></td>
                      <td style={{ fontWeight: 500 }}>{inv.supplier_name}</td>
                      <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>
                        {(Number(inv.net_amount) || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })} {inv.currency_code}
                      </td>
                      <td>
                        <span className={`chip ${inv.status === 'Posted' ? 'chip-success' : 'chip-neutral'}`}>
                          {inv.status === 'Posted' ? 'مرحلة' : 'مسودة'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>inventory</span>
              آخر أوامر الشراء
            </h3>
            <Link to="/purchasing/orders" style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>
              عرض الكل &larr;
            </Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم الأمر</th>
                  <th>المورد</th>
                  <th style={{ textAlign: 'left' }}>المبلغ</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '1rem' }}>جاري التحميل...</td></tr>
                ) : (!data?.recentOrders || data.recentOrders.length === 0) ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-on-surface-variant)' }}>لا توجد أوامر شراء مسجلة بعد</td></tr>
                ) : (
                  data.recentOrders.map((ord: any, idx: number) => (
                    <tr key={idx}>
                      <td><span className="numeric font-bold" style={{ color: 'var(--color-primary)' }}>{ord.order_number}</span></td>
                      <td style={{ fontWeight: 500 }}>{ord.supplier_name}</td>
                      <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>
                        {(Number(ord.net_amount) || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })} {ord.currency_code}
                      </td>
                      <td>
                        <span className={`chip ${
                          ord.status === 'FullyReceived' ? 'chip-success' :
                          ord.status === 'Approved' ? 'chip-info' : 'chip-warning'
                        }`}>
                          {ord.status === 'Approved' ? 'معتمد' :
                           ord.status === 'FullyReceived' ? 'مستلم بالكامل' :
                           ord.status === 'PartiallyReceived' ? 'مستلم جزئياً' : 'مسودة'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Suppliers */}
      {data?.topSuppliers && data.topSuppliers.length > 0 && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>leaderboard</span>
            كبار الموردين حسب حجم المشتريات
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>كود المورد</th>
                  <th>اسم المورد</th>
                  <th style={{ textAlign: 'left' }}>إجمالي المشتريات (ر.س)</th>
                  <th>نسبة التعامل</th>
                </tr>
              </thead>
              <tbody>
                {data.topSuppliers.map((s: any, idx: number) => {
                  const maxPurchases = Number(data.topSuppliers[0]?.total_purchases) || 1;
                  const pct = Math.min(100, Math.round((Number(s.total_purchases) / maxPurchases) * 100));
                  return (
                    <tr key={idx}>
                      <td><span className="numeric font-bold">{s.supplier_code}</span></td>
                      <td style={{ fontWeight: 600 }}>{s.supplier_name}</td>
                      <td className="numeric font-bold" style={{ textAlign: 'left', color: 'var(--color-primary)' }}>
                        {(Number(s.total_purchases) || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س
                      </td>
                      <td style={{ width: '30%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 4 }} />
                          </div>
                          <span className="numeric" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
