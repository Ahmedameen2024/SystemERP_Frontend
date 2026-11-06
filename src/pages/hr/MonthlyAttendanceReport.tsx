import { useState, useEffect } from 'react';
import api from '../../api/client';

interface AttendanceReportRow {
  empCode: string;
  name: string;
  department: string;
  presentDays: number;
  absentDays: number;
  lateHours: number;
  overtimeHours: number;
  netWorkHours: number;
}

export default function MonthlyAttendanceReport() {
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const currentYear = String(new Date().getFullYear());

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [reportRows, setReportRows] = useState<AttendanceReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const [empRes, attRes] = await Promise.all([
        api.get('/hr/employees'),
        api.get(`/hr/attendances?month=${selectedMonth}&year=${selectedYear}`),
      ]);

      const employees = empRes.data?.data || [];
      const attendances = attRes.data?.data || [];

      // Aggregate attendances per employee
      const rows: AttendanceReportRow[] = employees.map((emp: any) => {
        const empAtts = attendances.filter((a: any) => a.employee_id === emp.id);
        const presentDays = empAtts.filter((a: any) => a.status === 'Present' || a.status === 'Late').length;
        const absentDays = empAtts.filter((a: any) => a.status === 'Absent').length;
        const lateHours = empAtts.reduce((sum: number, a: any) => sum + Number(a.delay_hours || 0), 0);
        const overtimeHours = empAtts.reduce((sum: number, a: any) => sum + Number(a.overtime_hours || 0), 0);
        const netWorkHours = empAtts.reduce((sum: number, a: any) => sum + Number(a.work_hours || 8), 0) + overtimeHours - lateHours;

        return {
          empCode: emp.employee_number,
          name: emp.name_ar,
          department: emp.department_name || '—',
          presentDays,
          absentDays,
          lateHours,
          overtimeHours,
          netWorkHours: Math.max(0, netWorkHours),
        };
      });

      setReportRows(rows);
    } catch (err) {
      console.error('Failed to load monthly attendance report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedMonth, selectedYear]);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>تقرير الحضور والانصراف الشهري</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            ملخص مجمع لساعات العمل والغيابات والتأخيرات الشهرية لكل موظف
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchReport} disabled={loading}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
            تحديث
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
            طباعة التقرير
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <label className="label" style={{ margin: 0 }}>الشهر:</label>
        <select className="input" style={{ maxWidth: 130 }} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
          <option value="01">يناير (01)</option>
          <option value="02">فبراير (02)</option>
          <option value="03">مارس (03)</option>
          <option value="04">أبريل (04)</option>
          <option value="05">مايو (05)</option>
          <option value="06">يونيو (06)</option>
          <option value="07">يوليو (07)</option>
          <option value="08">أغسطس (08)</option>
          <option value="09">سبتمبر (09)</option>
          <option value="10">أكتوبر (10)</option>
          <option value="11">نوفمبر (11)</option>
          <option value="12">ديسمبر (12)</option>
        </select>
        <select className="input" style={{ maxWidth: 110 }} value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
          <option value="2027">2027</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem', width: 32, height: 32, borderWidth: 3 }} />
            جاري استخراج التقرير من سجلات الحضور...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>كود الموظف</th>
                <th>اسم الموظف</th>
                <th>القسم</th>
                <th style={{ textAlign: 'center' }}>أيام الحضور</th>
                <th style={{ textAlign: 'center' }}>أيام الغياب</th>
                <th style={{ textAlign: 'center' }}>ساعات التأخير</th>
                <th style={{ textAlign: 'center' }}>ساعات الإضافي</th>
                <th style={{ textAlign: 'center' }}>صافي ساعات العمل</th>
              </tr>
            </thead>
            <tbody>
              {reportRows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد بيانات موظفين مسجلة
                  </td>
                </tr>
              ) : (
                reportRows.map(row => (
                  <tr key={row.empCode}>
                    <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{row.empCode}</span></td>
                    <td style={{ fontWeight: 500 }}>{row.name}</td>
                    <td>{row.department}</td>
                    <td className="numeric" style={{ textAlign: 'center', color: '#059669', fontWeight: 700 }}>{row.presentDays} يوم</td>
                    <td className="numeric" style={{ textAlign: 'center', color: row.absentDays > 0 ? '#ba1a1a' : 'inherit' }}>{row.absentDays} يوم</td>
                    <td className="numeric" style={{ textAlign: 'center', color: row.lateHours > 0 ? '#d97706' : 'inherit' }}>{row.lateHours} س</td>
                    <td className="numeric" style={{ textAlign: 'center', color: '#059669' }}>{row.overtimeHours} س</td>
                    <td className="numeric" style={{ textAlign: 'center', fontWeight: 700 }}>{row.netWorkHours} ساعة</td>
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
