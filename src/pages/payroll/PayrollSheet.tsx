import { useState, useEffect } from 'react';
import api from '../../api/client';

interface PayrollHeader {
  id: string;
  payroll_number: string;
  pay_period_month: number;
  pay_period_year: number;
  total_basic_salary: number | string;
  total_allowances: number | string;
  total_deductions: number | string;
  total_net_salary: number | string;
  employee_count: number;
  status: string;
}

interface PayrollLine {
  id: string;
  employee_name: string;
  employee_number: string;
  job_title: string;
  basic_salary: number | string;
  total_allowances: number | string;
  total_deductions: number | string;
  net_salary: number | string;
  work_days: number;
}

export default function PayrollSheet() {
  const [payrolls, setPayrolls] = useState<PayrollHeader[]>([]);
  const [selectedPayrollId, setSelectedPayrollId] = useState<string>('');
  const [lines, setLines] = useState<PayrollLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payroll/sheet');
      const list = res.data?.data || [];
      setPayrolls(list);
      if (list.length > 0 && !selectedPayrollId) {
        setSelectedPayrollId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load payroll sheets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLines = async (payrollId: string) => {
    if (!payrollId) return;
    try {
      const res = await api.get(`/payroll/sheet/${payrollId}/lines`);
      setLines(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load payroll lines:', err);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, []);

  useEffect(() => {
    if (selectedPayrollId) {
      fetchLines(selectedPayrollId);
    }
  }, [selectedPayrollId]);

  const handleGeneratePayroll = async () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    if (!window.confirm(`هل تريد إصدار مسير الرواتب لشهر ${currentMonth}/${currentYear} لجميع الموظفين النشطين؟`)) return;

    setGenerating(true);
    try {
      await api.post('/payroll/generate', { month: currentMonth, year: currentYear });
      await fetchPayrolls();
      alert('تم توليد مسير الرواتب بنجاح');
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطأ في توليد مسير الرواتب');
    } finally {
      setGenerating(false);
    }
  };

  const currentPayroll = payrolls.find(p => p.id === selectedPayrollId);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>مسيرات الرواتب الشهرية</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            احتساب الرواتب والبدلات واستقطاعات التأمينات وإصدار الكشوف المعتمدة
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchPayrolls} disabled={loading}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
            تحديث
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleGeneratePayroll} disabled={generating}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>bolt</span>
            {generating ? 'جاري التوليد...' : 'إصدار مسير جديد'}
          </button>
        </div>
      </div>

      {payrolls.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <label className="label" style={{ margin: 0 }}>اختر المسير:</label>
          <select 
            className="input" 
            style={{ maxWidth: 300 }}
            value={selectedPayrollId}
            onChange={e => setSelectedPayrollId(e.target.value)}
          >
            {payrolls.map(p => (
              <option key={p.id} value={p.id}>
                {p.payroll_number} (شهر {p.pay_period_month}/{p.pay_period_year})
              </option>
            ))}
          </select>
        </div>
      )}

      {currentPayroll && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div className="kpi-card" style={{ borderTop: '3px solid var(--color-primary)' }}>
            <span className="kpi-label">عدد الموظفين بالمسير</span>
            <div className="kpi-value numeric">{currentPayroll.employee_count} موظف</div>
          </div>
          <div className="kpi-card" style={{ borderTop: '3px solid #059669' }}>
            <span className="kpi-label">إجمالي الرواتب الأساسية</span>
            <div className="kpi-value numeric" style={{ color: '#059669', fontSize: '1.25rem' }}>
              {Number(currentPayroll.total_basic_salary || 0).toLocaleString('ar-SA')} ر.س
            </div>
          </div>
          <div className="kpi-card" style={{ borderTop: '3px solid #d97706' }}>
            <span className="kpi-label">إجمالي البدلات</span>
            <div className="kpi-value numeric" style={{ color: '#d97706', fontSize: '1.25rem' }}>
              {Number(currentPayroll.total_allowances || 0).toLocaleString('ar-SA')} ر.س
            </div>
          </div>
          <div className="kpi-card" style={{ borderTop: '3px solid #ba1a1a' }}>
            <span className="kpi-label">صافي الرواتب المستحقة</span>
            <div className="kpi-value numeric" style={{ color: 'var(--color-primary)', fontSize: '1.25rem' }}>
              {Number(currentPayroll.total_net_salary || 0).toLocaleString('ar-SA')} ر.س
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem', width: 32, height: 32, borderWidth: 3 }} />
            جاري جلب تفاصيل مسير الرواتب...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم الموظف</th>
                <th>اسم الموظف</th>
                <th>المسمى الوظيفي</th>
                <th style={{ textAlign: 'left' }}>الراتب الأساسي</th>
                <th style={{ textAlign: 'left' }}>إجمالي البدلات</th>
                <th style={{ textAlign: 'left' }}>الاستقطاعات</th>
                <th style={{ textAlign: 'left' }}>الصافي المستحق</th>
                <th>أيام العمل</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد مسيرات رواتب مسجلة بعد. اضغط "إصدار مسير جديد" لتوليد مسير الشهر.
                  </td>
                </tr>
              ) : (
                lines.map(l => (
                  <tr key={l.id}>
                    <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{l.employee_number}</span></td>
                    <td style={{ fontWeight: 500 }}>{l.employee_name}</td>
                    <td>{l.job_title || '—'}</td>
                    <td className="numeric" style={{ textAlign: 'left' }}>{Number(l.basic_salary || 0).toLocaleString('ar-SA')} ر.س</td>
                    <td className="numeric" style={{ textAlign: 'left', color: '#059669' }}>{Number(l.total_allowances || 0).toLocaleString('ar-SA')} ر.س</td>
                    <td className="numeric" style={{ textAlign: 'left', color: '#ba1a1a' }}>{Number(l.total_deductions || 0).toLocaleString('ar-SA')} ر.س</td>
                    <td className="numeric" style={{ textAlign: 'left', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {Number(l.net_salary || 0).toLocaleString('ar-SA')} ر.س
                    </td>
                    <td className="numeric">{l.work_days} يوم</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
