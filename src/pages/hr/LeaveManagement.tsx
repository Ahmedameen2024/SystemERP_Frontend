import { useState, useEffect } from 'react';
import api from '../../api/client';

interface LeaveRequest {
  id: string;
  request_number: string;
  employee_name: string;
  employee_number: string;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface Employee {
  id: string;
  name_ar: string;
  employee_number: string;
}

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    totalDays: 5,
    reason: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leavesRes, empRes] = await Promise.all([
        api.get('/hr/leaves'),
        api.get('/hr/employees'),
      ]);
      setLeaves(leavesRes.data?.data || []);
      const empList = empRes.data?.data || [];
      setEmployees(empList);
      if (empList.length > 0 && !form.employeeId) {
        setForm(f => ({ ...f, employeeId: empList[0].id }));
      }
    } catch (err) {
      console.error('Failed to load leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/hr/leaves', {
        employeeId: form.employeeId,
        startDate: form.startDate,
        endDate: form.endDate,
        totalDays: form.totalDays,
        reason: form.reason,
      });
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطأ في تقديم طلب الإجازة');
    }
  };

  const handleStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await api.put(`/hr/leaves/${id}/status`, { status });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطأ في تحديث حالة الإجازة');
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>إدارة طلبات الإجازات</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            متابعة واعتماد طلبات الإجازات السنوية والمرضية والاضطرارية
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchData} disabled={loading}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
            تحديث
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            تقديم طلب إجازة
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem', width: 32, height: 32, borderWidth: 3 }} />
            جاري جلب طلبات الإجازات...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>الموظف</th>
                <th>نوع الإجازة</th>
                <th>من تاريخ</th>
                <th>إلى تاريخ</th>
                <th>الأيام</th>
                <th>السبب</th>
                <th>الحالة</th>
                <th>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-on-surface-variant)' }}>
                    لا توجد طلبات إجازة مسجلة
                  </td>
                </tr>
              ) : (
                leaves.map(l => (
                  <tr key={l.id}>
                    <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{l.request_number}</span></td>
                    <td style={{ fontWeight: 500 }}>{l.employee_name}</td>
                    <td>{l.leave_type_name || 'إجازة اعتيادية'}</td>
                    <td className="numeric">{l.start_date ? new Date(l.start_date).toLocaleDateString('ar-SA') : '—'}</td>
                    <td className="numeric">{l.end_date ? new Date(l.end_date).toLocaleDateString('ar-SA') : '—'}</td>
                    <td className="numeric">{l.total_days} يوم</td>
                    <td>{l.reason || '—'}</td>
                    <td>
                      <span className={`chip ${
                        l.status === 'Approved' ? 'chip-success' : 
                        l.status === 'Rejected' ? 'chip-error' : 'chip-warning'
                      }`}>
                        {l.status === 'Approved' ? 'معتمد' : 
                         l.status === 'Rejected' ? 'مرفوض' : 'قيد المراجعة'}
                      </span>
                    </td>
                    <td>
                      {l.status === 'Pending' && (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button 
                            className="btn btn-primary btn-sm" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => handleStatus(l.id, 'Approved')}
                          >
                            موافقة
                          </button>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#ba1a1a' }}
                            onClick={() => handleStatus(l.id, 'Rejected')}
                          >
                            رفض
                          </button>
                        </div>
                      )}
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
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: '0 0 1rem' }}>تقديم طلب إجازة جديد</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
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
                  <label className="label">من تاريخ *</label>
                  <input 
                    type="date" 
                    className="input" 
                    value={form.startDate} 
                    onChange={e => setForm({ ...form, startDate: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <label className="label">إلى تاريخ *</label>
                  <input 
                    type="date" 
                    className="input" 
                    value={form.endDate} 
                    onChange={e => setForm({ ...form, endDate: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="label">عدد الأيام</label>
                <input 
                  type="number" 
                  className="input" 
                  value={form.totalDays} 
                  onChange={e => setForm({ ...form, totalDays: parseInt(e.target.value) || 1 })} 
                  min="1"
                />
              </div>

              <div>
                <label className="label">سبب الإجازة</label>
                <textarea 
                  className="input" 
                  rows={2} 
                  value={form.reason} 
                  onChange={e => setForm({ ...form, reason: e.target.value })} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  إرسال الطلب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
