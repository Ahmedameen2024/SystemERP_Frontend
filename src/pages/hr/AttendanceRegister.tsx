import { useState, useEffect } from 'react';
import api from '../../api/client';

interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_number: string;
  attendance_date: string;
  check_in: string;
  check_out: string;
  work_hours: number;
  delay_hours: number;
  overtime_hours: number;
  status: 'Present' | 'Late' | 'Absent' | 'OnLeave';
}

interface Employee {
  id: string;
  name_ar: string;
  employee_number: string;
}

export default function AttendanceRegister() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    date: new Date().toISOString().slice(0, 10),
    checkIn: '08:00',
    checkOut: '16:00',
    status: 'Present',
    workHours: 8,
    delayHours: 0,
    overtimeHours: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attRes, empRes] = await Promise.all([
        api.get(`/hr/attendances?date=${selectedDate}`),
        api.get('/hr/employees'),
      ]);
      setRecords(attRes.data?.data || []);
      const empList = empRes.data?.data || [];
      setEmployees(empList);
      if (empList.length > 0 && !form.employeeId) {
        setForm(f => ({ ...f, employeeId: empList[0].id }));
      }
    } catch (err) {
      console.error('Failed to load attendances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/hr/attendances', {
        employeeId: form.employeeId,
        attendanceDate: form.date,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        status: form.status,
        workHours: form.workHours,
        delayHours: form.delayHours,
        overtimeHours: form.overtimeHours,
      });
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطأ في تسجيل الحضور');
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>سجل الحضور والانصراف اليومي</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            متابعة تواجد الموظفين وساعات العمل الإضافية والتأخيرات اليومية
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchData} disabled={loading}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
            تحديث
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            تسجيل حركة يدوية
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <label className="label" style={{ margin: 0 }}>تاريخ اليوم:</label>
        <input 
          type="date" 
          className="input" 
          style={{ maxWidth: 170 }}
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem', width: 32, height: 32, borderWidth: 3 }} />
            جاري جلب سجلات الحضور...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم الموظف</th>
                <th>اسم الموظف</th>
                <th>وقت الحضور</th>
                <th>وقت الانصراف</th>
                <th>ساعات العمل</th>
                <th>ساعات التأخير</th>
                <th>ساعات إضافية</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد تسجيلات حضور مسجلة لهذا التاريخ
                  </td>
                </tr>
              ) : (
                records.map(r => (
                  <tr key={r.id}>
                    <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{r.employee_number}</span></td>
                    <td style={{ fontWeight: 500 }}>{r.employee_name}</td>
                    <td className="numeric">{r.check_in || '—'}</td>
                    <td className="numeric">{r.check_out || '—'}</td>
                    <td className="numeric">{r.work_hours} س</td>
                    <td className="numeric" style={{ color: r.delay_hours > 0 ? '#ba1a1a' : 'inherit' }}>{r.delay_hours > 0 ? `${r.delay_hours} س` : '—'}</td>
                    <td className="numeric" style={{ color: r.overtime_hours > 0 ? '#059669' : 'inherit' }}>{r.overtime_hours > 0 ? `${r.overtime_hours} س` : '—'}</td>
                    <td>
                      <span className={`chip ${
                        r.status === 'Present' ? 'chip-success' : 
                        r.status === 'Late' ? 'chip-warning' : 'chip-error'
                      }`}>
                        {r.status === 'Present' ? 'حاضر' : 
                         r.status === 'Late' ? 'متأخر' : 
                         r.status === 'OnLeave' ? 'إجازة' : 'غائب'}
                      </span>
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
          <div className="modal-card" style={{ maxWidth: 450 }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: '0 0 1rem' }}>تسجيل حركة حضور / انصراف</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label className="label">الموظف *</label>
                <select 
                  className="input" 
                  value={form.employeeId} 
                  onChange={e => setForm({ ...form, employeeId: e.target.value })}
                  required
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.employee_number} - {emp.name_ar}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label">وقت الحضور</label>
                  <input 
                    type="time" 
                    className="input" 
                    value={form.checkIn} 
                    onChange={e => setForm({ ...form, checkIn: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="label">وقت الانصراف</label>
                  <input 
                    type="time" 
                    className="input" 
                    value={form.checkOut} 
                    onChange={e => setForm({ ...form, checkOut: e.target.value })} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label">الحالة</label>
                  <select 
                    className="input" 
                    value={form.status} 
                    onChange={e => setForm({ ...form, status: e.target.value as any })}
                  >
                    <option value="Present">حاضر</option>
                    <option value="Late">متأخر</option>
                    <option value="Absent">غائب</option>
                  </select>
                </div>
                <div>
                  <label className="label">ساعات العمل</label>
                  <input 
                    type="number" 
                    className="input" 
                    value={form.workHours} 
                    onChange={e => setForm({ ...form, workHours: parseFloat(e.target.value) || 0 })} 
                    min="0"
                  />
                </div>
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
