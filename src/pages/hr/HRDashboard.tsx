import { useState, useEffect } from 'react';
import api from '../../api/client';

const KPICard = ({ label, value, icon, color, sub }: { label: string; value: string | number; icon: string; color: string; sub?: string }) => (
  <div className="kpi-card fade-in" style={{ borderTop: `3px solid ${color}` }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span className="kpi-label">{label}</span>
      <div style={{ width: 36, height: 36, borderRadius: '8px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ color, fontSize: 20 }}>{icon}</span>
      </div>
    </div>
    <div className="kpi-value numeric" style={{ color }}>{value}</div>
    {sub && (
      <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', marginTop: '0.25rem' }}>
        <span>{sub}</span>
      </div>
    )}
  </div>
);

export default function HRDashboard() {
  const [stats, setStats] = useState<any>({
    totalEmployees: 0,
    activeEmployees: 0,
    onLeaveToday: 0,
    attendanceRate: '0%',
    activeLeaves: [],
    recentLogs: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hr/dashboard');
      setStats(res.data?.data || {});
    } catch (err) {
      console.error('Failed to load HR dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>
            لوحة الموارد البشرية
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0' }}>
            مراقبة الموظفين، الحضور والانصراف، وطلبات الإجازات النشطة من قاعدة البيانات
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchStats} disabled={loading}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
            تحديث
          </button>
          <a href="/hr/employees" className="btn btn-primary btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            تسجيل موظف جديد
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <KPICard 
          label="إجمالي الموظفين" 
          value={`${stats.totalEmployees || 0} موظف`} 
          icon="people" 
          color="var(--color-primary)" 
          sub={`${stats.activeEmployees || 0} على رأس العمل`} 
        />
        <KPICard 
          label="في إجازة اليوم" 
          value={`${stats.onLeaveToday || 0} موظف`} 
          icon="event_busy" 
          color="#d97706" 
          sub="إجازات معتمدة سارية" 
        />
        <KPICard 
          label="نسبة الانضباط والحضور" 
          value={stats.attendanceRate || '100%'} 
          icon="check_circle" 
          color="#059669" 
          sub="معدل الحضور المقدر" 
        />
        <KPICard 
          label="الطلبات المسجلة" 
          value={`${stats.activeLeaves?.length || 0} طلب`} 
          icon="pending_actions" 
          color="var(--color-secondary)" 
          sub="إجازات معتمدة حديثة" 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Active Leave Requests */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>event_available</span>
            الإجازات الجارية والمعتمدة
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(!stats.activeLeaves || stats.activeLeaves.length === 0) ? (
              <div style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.8125rem', textAlign: 'center', padding: '1.5rem 0' }}>
                لا توجد إجازات سارية حالياً
              </div>
            ) : (
              stats.activeLeaves.map((item: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: idx < stats.activeLeaves.length - 1 ? '1px solid var(--color-surface-container)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-on-surface)' }}>{item.employee_name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant)', marginTop: '0.125rem' }}>
                      النوع: {item.leave_type_name || 'سنوية'} | المدة: {item.total_days} يوم
                    </div>
                  </div>
                  <span className="chip chip-success">معتمد</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Attendance Logs */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#059669' }}>schedule</span>
            آخر تسجيلات الحضور المسجلة
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(!stats.recentLogs || stats.recentLogs.length === 0) ? (
              <div style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.8125rem', textAlign: 'center', padding: '1.5rem 0' }}>
                لا توجد سجلات حضور مدخلة اليوم
              </div>
            ) : (
              stats.recentLogs.map((item: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: idx < stats.recentLogs.length - 1 ? '1px solid var(--color-surface-container)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-on-surface)' }}>{item.employee_name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant)', marginTop: '0.125rem' }}>
                      وقت الحضور: {item.check_in || '—'} | تاريخ: {item.attendance_date ? new Date(item.attendance_date).toLocaleDateString('ar-SA') : '—'}
                    </div>
                  </div>
                  <span className="chip chip-neutral">{item.status || 'حاضر'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
