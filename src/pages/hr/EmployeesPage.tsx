import { useState, useEffect } from 'react';
import api from '../../api/client';

interface Employee {
  id: string;
  employee_number: string;
  name_ar: string;
  name_en: string;
  national_id: string;
  department_id?: string;
  department_name?: string;
  job_title: string;
  basic_salary: number | string;
  contract_type: string;
  phone: string;
  email?: string;
  status: 'Active' | 'OnLeave' | 'Terminated';
}

interface Department {
  id: string;
  name_ar: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Employee | null>(null);
  const [form, setForm] = useState({
    nameAr: '',
    nameEn: '',
    nationalId: '',
    departmentId: '',
    jobTitle: '',
    salary: 0,
    contractType: 'دائم',
    phone: '',
    email: '',
    status: 'Active' as 'Active' | 'OnLeave' | 'Terminated',
  });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [empRes, deptRes] = await Promise.all([
        api.get('/hr/employees'),
        api.get('/setup/departments').catch(() => ({ data: { data: [] } })),
      ]);
      setEmployees(empRes.data?.data || []);
      setDepartments(deptRes.data?.data || []);
    } catch (err: any) {
      console.error('Failed to load employees:', err);
      setError('حدث خطأ أثناء تحميل بيانات الموظفين من الخادم');
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
      nameAr: '',
      nameEn: '',
      nationalId: '',
      departmentId: departments[0]?.id || '',
      jobTitle: '',
      salary: 0,
      contractType: 'دائم',
      phone: '',
      email: '',
      status: 'Active',
    });
    setShowModal(true);
  };

  const openEdit = (e: Employee) => {
    setEditItem(e);
    setForm({
      nameAr: e.name_ar,
      nameEn: e.name_en || '',
      nationalId: e.national_id || '',
      departmentId: e.department_id || '',
      jobTitle: e.job_title || '',
      salary: Number(e.basic_salary || 0),
      contractType: e.contract_type || 'دائم',
      phone: e.phone || '',
      email: e.email || '',
      status: e.status,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`/hr/employees/${editItem.id}`, {
          nameAr: form.nameAr,
          nameEn: form.nameEn,
          nationalId: form.nationalId,
          departmentId: form.departmentId || null,
          jobTitle: form.jobTitle,
          contractType: form.contractType,
          basicSalary: form.salary,
          phone: form.phone,
          email: form.email,
          status: form.status,
        });
      } else {
        await api.post('/hr/employees', {
          nameAr: form.nameAr,
          nameEn: form.nameEn,
          nationalId: form.nationalId,
          departmentId: form.departmentId || null,
          jobTitle: form.jobTitle,
          contractType: form.contractType,
          basicSalary: form.salary,
          phone: form.phone,
          email: form.email,
          status: form.status,
        });
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطأ في حفظ الموظف');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;
    try {
      await api.delete(`/hr/employees/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطأ في حذف الموظف');
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>شؤون الموظفين (سجل الموظفين)</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            إدارة بيانات الموظفين والعقود والرواتب الأساسية في قاعدة البيانات
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchData} disabled={loading}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
            تحديث
          </button>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            إضافة موظف جديد
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
            جاري جلب سجلات الموظفين من الخادم...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم الموظف</th>
                <th>الاسم العربي</th>
                <th>رقم الهوية / الإقامة</th>
                <th>القسم الإداري</th>
                <th>المسمى الوظيفي</th>
                <th style={{ textAlign: 'left' }}>الراتب الأساسي</th>
                <th>نوع العقد</th>
                <th>الجوال</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-on-surface-variant)' }}>
                    لا يوجد موظفون مسجلون. اضغط "إضافة موظف جديد" للبدء.
                  </td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp.id}>
                    <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{emp.employee_number}</span></td>
                    <td style={{ fontWeight: 500 }}>{emp.name_ar}</td>
                    <td className="numeric">{emp.national_id || '—'}</td>
                    <td>{emp.department_name || '—'}</td>
                    <td>{emp.job_title || '—'}</td>
                    <td className="numeric" style={{ textAlign: 'left', fontWeight: 700 }}>
                      {Number(emp.basic_salary || 0).toLocaleString('ar-SA')} ر.س
                    </td>
                    <td>{emp.contract_type}</td>
                    <td className="numeric">{emp.phone || '—'}</td>
                    <td>
                      <span className={`chip ${
                        emp.status === 'Active' ? 'chip-success' : 
                        emp.status === 'OnLeave' ? 'chip-warning' : 'chip-error'
                      }`}>
                        {emp.status === 'Active' ? 'نشط وعلى رأس العمل' : 
                         emp.status === 'OnLeave' ? 'في إجازة' : 'منتهية خدماته'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(emp)} title="تعديل">
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(emp.id)} title="حذف" style={{ color: '#ba1a1a' }}>
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
          <div className="modal-card" style={{ maxWidth: 550 }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: '0 0 1rem' }}>
              {editItem ? `تعديل بيانات الموظف (${editItem.employee_number})` : 'إضافة موظف جديد'}
            </h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label">الاسم باللغة العربية *</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={form.nameAr} 
                    onChange={e => setForm({ ...form, nameAr: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <label className="label">الاسم بالإنجليزية</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={form.nameEn} 
                    onChange={e => setForm({ ...form, nameEn: e.target.value })} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label">رقم الهوية الوطنية / الإقامة</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={form.nationalId} 
                    onChange={e => setForm({ ...form, nationalId: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="label">القسم الإداري</label>
                  <select 
                    className="input" 
                    value={form.departmentId} 
                    onChange={e => setForm({ ...form, departmentId: e.target.value })}
                  >
                    <option value="">بدون قسم</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name_ar}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label">المسمى الوظيفي</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={form.jobTitle} 
                    onChange={e => setForm({ ...form, jobTitle: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="label">الراتب الأساسي (ر.س)</label>
                  <input 
                    type="number" 
                    className="input" 
                    value={form.salary} 
                    onChange={e => setForm({ ...form, salary: parseFloat(e.target.value) || 0 })} 
                    min="0"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label">نوع العقد</label>
                  <select 
                    className="input" 
                    value={form.contractType} 
                    onChange={e => setForm({ ...form, contractType: e.target.value })}
                  >
                    <option value="دائم">دائم</option>
                    <option value="محدد المدة">محدد المدة</option>
                    <option value="مؤقت">مؤقت</option>
                    <option value="تدريب">تدريب</option>
                  </select>
                </div>
                <div>
                  <label className="label">رقم الجوال</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={form.phone} 
                    onChange={e => setForm({ ...form, phone: e.target.value })} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label">البريد الإلكتروني</label>
                  <input 
                    type="email" 
                    className="input" 
                    value={form.email} 
                    onChange={e => setForm({ ...form, email: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="label">الحالة</label>
                  <select 
                    className="input" 
                    value={form.status} 
                    onChange={e => setForm({ ...form, status: e.target.value as any })}
                  >
                    <option value="Active">نشط</option>
                    <option value="OnLeave">في إجازة</option>
                    <option value="Terminated">منتهي العقد</option>
                  </select>
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
