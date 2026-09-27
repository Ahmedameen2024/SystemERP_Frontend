import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { PERMISSION_REGISTRY, type PermissionDefinition } from '../../config/permissionRegistry';

interface User {
  id: string;
  username: string;
  name_ar: string;
  name_en: string;
  email: string;
  role_id: string;
  role_name: string;
  branch_id: string;
  branch_name: string;
  status: 'Active' | 'Inactive';
  last_login: string;
}

interface Role {
  id: string;
  name_ar: string;
  name_en: string;
  description?: string;
  is_system_role?: boolean;
  user_count?: number;
  active_user_count?: number;
  active_permissions_count?: number;
}

interface Branch {
  id: string;
  name_ar: string;
}

interface PermissionState {
  moduleName: string;
  screenName: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canPrint: boolean;
  canExport: boolean;
}

const MODULE_METADATA: Record<string, { label: string; icon: string; color: string }> = {
  accounting: { label: 'المحاسبة والمالية', icon: 'account_balance', color: '#3b82f6' },
  vouchers: { label: 'سندات القبض والصرف', icon: 'receipt_long', color: '#10b981' },
  sales: { label: 'المبيعات والعملاء', icon: 'point_of_sale', color: '#8b5cf6' },
  purchasing: { label: 'المشتريات والموردون', icon: 'shopping_cart', color: '#f59e0b' },
  inventory: { label: 'المخازن والمستودعات', icon: 'warehouse', color: '#06b6d4' },
  hr: { label: 'الموارد البشرية', icon: 'badge', color: '#ec4899' },
  payroll: { label: 'الرواتب والأجور', icon: 'payments', color: '#14b8a6' },
  system: { label: 'تهيئة وإدارة النظام', icon: 'settings', color: '#64748b' },
  reports: { label: 'التقارير والتحليلات', icon: 'bar_chart', color: '#f97316' },
};

export default function UsersPermissions() {
  const { reloadProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles');

  // Data states
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Role & Permissions state
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [permissionsMap, setPermissionsMap] = useState<Record<string, PermissionState>>({});
  const [roleSearch, setRoleSearch] = useState('');
  const [permissionSearch, setPermissionSearch] = useState('');
  const [activeModuleFilter, setActiveModuleFilter] = useState<string>('all');

  // Toast & Feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({ nameAr: '', nameEn: '', description: '' });

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userForm, setUserForm] = useState({
    username: '',
    nameAr: '',
    nameEn: '',
    email: '',
    roleId: '',
    branchId: '',
    status: 'Active' as 'Active' | 'Inactive',
    password: '',
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedRoleId) {
      fetchRolePermissions(selectedRoleId);
    }
  }, [selectedRoleId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [roleRes, userRes, branchRes] = await Promise.all([
        api.get('/setup/roles'),
        api.get('/setup/users?limit=200'),
        api.get('/setup/branches?limit=100'),
      ]);

      const fetchedRoles: Role[] = roleRes.data.data || [];
      setRoles(fetchedRoles);
      setUsers(userRes.data.data || []);
      setBranches(branchRes.data.data || []);

      if (fetchedRoles.length > 0 && !selectedRoleId) {
        setSelectedRoleId(fetchedRoles[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
      showToast('تعذر جلب البيانات من الخادم', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId);
  }, [roles, selectedRoleId]);

  const isSuperAdminRole = useMemo(() => {
    if (!selectedRole) return false;
    return (
      selectedRole.is_system_role === true ||
      selectedRole.name_ar === 'مدير النظام' ||
      selectedRole.name_en === 'System Administrator'
    );
  }, [selectedRole]);

  const fetchRolePermissions = async (roleId: string) => {
    try {
      const res = await api.get(`/setup/permissions/${roleId}`);
      const savedPerms: any[] = res.data.data || [];

      const initialMap: Record<string, PermissionState> = {};

      // Initialize map from central registry
      PERMISSION_REGISTRY.forEach((def) => {
        const key = `${def.module}.${def.screen}`;
        const saved = savedPerms.find(
          (p) => p.module_name === def.module && p.screen_name === def.screen
        );

        initialMap[key] = {
          moduleName: def.module,
          screenName: def.screen,
          canView: saved?.can_view ?? false,
          canCreate: saved?.can_create ?? false,
          canEdit: saved?.can_edit ?? false,
          canDelete: saved?.can_delete ?? false,
          canApprove: saved?.can_approve ?? false,
          canPrint: saved?.can_print ?? false,
          canExport: saved?.can_export ?? false,
        };
      });

      setPermissionsMap(initialMap);
    } catch (err) {
      console.error('Failed to fetch permissions for role:', err);
    }
  };

  const handleTogglePermission = (
    module: string,
    screen: string,
    action: keyof Omit<PermissionState, 'moduleName' | 'screenName'>
  ) => {
    if (isSuperAdminRole) return;

    const key = `${module}.${screen}`;
    const current = permissionsMap[key] || {
      moduleName: module,
      screenName: screen,
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canApprove: false,
      canPrint: false,
      canExport: false,
    };

    setPermissionsMap((prev) => ({
      ...prev,
      [key]: {
        ...current,
        [action]: !current[action],
      },
    }));
  };

  const handleToggleModuleAll = (moduleKey: string, grant: boolean) => {
    if (isSuperAdminRole) return;

    setPermissionsMap((prev) => {
      const updated = { ...prev };
      PERMISSION_REGISTRY.filter((def) => def.module === moduleKey).forEach((def) => {
        const key = `${def.module}.${def.screen}`;
        const available = def.availableActions;
        updated[key] = {
          moduleName: def.module,
          screenName: def.screen,
          canView: available.includes('view') ? grant : false,
          canCreate: available.includes('create') ? grant : false,
          canEdit: available.includes('edit') ? grant : false,
          canDelete: available.includes('delete') ? grant : false,
          canApprove: available.includes('approve') ? grant : false,
          canPrint: available.includes('print') ? grant : false,
          canExport: available.includes('export') ? grant : false,
        };
      });
      return updated;
    });
  };

  const handleToggleSystemAll = (grant: boolean) => {
    if (isSuperAdminRole) return;

    setPermissionsMap((prev) => {
      const updated = { ...prev };
      PERMISSION_REGISTRY.forEach((def) => {
        const key = `${def.module}.${def.screen}`;
        const available = def.availableActions;
        updated[key] = {
          moduleName: def.module,
          screenName: def.screen,
          canView: available.includes('view') ? grant : false,
          canCreate: available.includes('create') ? grant : false,
          canEdit: available.includes('edit') ? grant : false,
          canDelete: available.includes('delete') ? grant : false,
          canApprove: available.includes('approve') ? grant : false,
          canPrint: available.includes('print') ? grant : false,
          canExport: available.includes('export') ? grant : false,
        };
      });
      return updated;
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId || isSuperAdminRole) return;
    setSavingPermissions(true);
    try {
      const permissionsArray = Object.values(permissionsMap);
      await api.put(`/setup/permissions/${selectedRoleId}`, {
        permissions: permissionsArray,
      });
      showToast('تم حفظ وتحديث مصفوفة الصلاحيات بنجاح');
      reloadProfile();
      fetchInitialData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'تعذر حفظ الصلاحيات', 'error');
    } finally {
      setSavingPermissions(false);
    }
  };

  const openAddRole = () => {
    setEditingRole(null);
    setRoleForm({ nameAr: '', nameEn: '', description: '' });
    setShowRoleModal(true);
  };

  const openEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      nameAr: role.name_ar,
      nameEn: role.name_en || '',
      description: role.description || '',
    });
    setShowRoleModal(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await api.put(`/setup/roles/${editingRole.id}`, roleForm);
        showToast('تم تحديث بيانات الدور بنجاح');
      } else {
        const res = await api.post('/setup/roles', roleForm);
        const newRole = res.data.data;
        showToast('تم إنشاء الدور الجديد بنجاح');
        setSelectedRoleId(newRole.id);
      }
      setShowRoleModal(false);
      fetchInitialData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'خطأ في حفظ الدور', 'error');
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.is_system_role) {
      alert('لا يمكن حذف دور مدير النظام الأساسي (Super Admin)');
      return;
    }
    if ((role.user_count || 0) > 0) {
      alert(`لا يمكن حذف الدور لوجود ${role.user_count} مستخدم/موظف مرتبط به حالياً. يرجى نقل المستخدمين لدور آخر أولاً.`);
      return;
    }
    if (!window.confirm(`هل أنت متأكد من حذف الدور: ${role.name_ar}؟`)) return;

    try {
      await api.delete(`/setup/roles/${role.id}`);
      showToast('تم حذف الدور بنجاح');
      fetchInitialData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'تعذر حذف الدور', 'error');
    }
  };

  const handleSeedDefaults = async () => {
    try {
      await api.post('/setup/roles/seed-defaults', {});
      showToast('تم زرع وتحديث الأدوار القياسية بنجاح');
      fetchInitialData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'تعذر زرع الأدوار القياسية', 'error');
    }
  };

  const openAddUser = () => {
    setEditingUser(null);
    setUserForm({
      username: '',
      nameAr: '',
      nameEn: '',
      email: '',
      roleId: roles.length > 0 ? roles[0].id : '',
      branchId: branches.length > 0 ? branches[0].id : '',
      status: 'Active',
      password: '',
    });
    setShowUserModal(true);
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      nameAr: user.name_ar,
      nameEn: user.name_en || '',
      email: user.email,
      roleId: user.role_id,
      branchId: user.branch_id || '',
      status: user.status,
      password: '',
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/setup/users/${editingUser.id}`, userForm);
        showToast('تم تحديث بيانات المستخدم بنجاح');
      } else {
        await api.post('/setup/users', userForm);
        showToast('تم إنشاء حساب المستخدم وتعيين الدور بنجاح');
      }
      setShowUserModal(false);
      fetchInitialData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'خطأ في حفظ المستخدم', 'error');
    }
  };

  const groupedPermissions = useMemo(() => {
    const map: Record<string, PermissionDefinition[]> = {};
    PERMISSION_REGISTRY.forEach((def) => {
      if (permissionSearch.trim()) {
        const q = permissionSearch.toLowerCase();
        const match =
          def.screenNameAr.toLowerCase().includes(q) ||
          def.screenNameEn.toLowerCase().includes(q) ||
          def.description.toLowerCase().includes(q) ||
          def.moduleNameAr.toLowerCase().includes(q) ||
          def.screen.toLowerCase().includes(q);
        if (!match) return;
      }

      if (activeModuleFilter !== 'all' && def.module !== activeModuleFilter) {
        return;
      }

      if (!map[def.module]) {
        map[def.module] = [];
      }
      map[def.module].push(def);
    });
    return map;
  }, [permissionSearch, activeModuleFilter]);

  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return roles;
    const q = roleSearch.toLowerCase();
    return roles.filter(
      (r) =>
        r.name_ar.toLowerCase().includes(q) ||
        (r.name_en && r.name_en.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q))
    );
  }, [roles, roleSearch]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !userSearch.trim() ||
        u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.name_ar.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchRole = !userRoleFilter || u.role_id === userRoleFilter;
      return matchSearch && matchRole;
    });
  }, [users, userSearch, userRoleFilter]);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            padding: '0.75rem 1.5rem',
            borderRadius: '0.75rem',
            background: toastMessage.type === 'success' ? '#059669' : '#dc2626',
            color: '#fff',
            fontWeight: 600,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            {toastMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {toastMessage.text}
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--color-on-surface)' }}>
            إدارة الأدوار والصلاحيات والمستخدمين
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)', margin: '0.25rem 0 0 0' }}>
            نظام الصلاحيات المركزي: إنشاء الأدوار ← تحديد الصلاحيات ← ربط الموظفين/المستخدمين
          </p>
        </div>

        {/* Global Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'var(--color-surface-container)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid var(--color-outline-variant)',
          }}
        >
          <button
            onClick={() => setActiveTab('roles')}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'roles' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'roles' ? '#fff' : 'var(--color-on-surface-variant)',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              admin_panel_settings
            </span>
            الأدوار والصلاحيات (Roles & Matrix)
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'users' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'users' ? '#fff' : 'var(--color-on-surface-variant)',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              group
            </span>
            المستخدمون وحسابات الدخول ({users.length})
          </button>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
          <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 0.75rem auto' }} />
          جاري تحميل البيانات والصلاحيات...
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: ROLES & PERMISSIONS MATRIX */}
      {/* ========================================================= */}
      {!loading && activeTab === 'roles' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.25rem', alignItems: 'start' }}>
          {/* Left Column: Roles List */}
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 800, fontSize: '0.9375rem' }}>الأدوار الوظيفية ({roles.length})</span>
              <button
                className="btn btn-primary btn-sm"
                onClick={openAddRole}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                title="إنشاء دور مخصص جديد"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                دور جديد
              </button>
            </div>

            {/* Role Search */}
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                placeholder="بحث في الأدوار..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                style={{ fontSize: '0.8125rem', paddingRight: '2rem' }}
              />
              <span
                className="material-symbols-outlined"
                style={{
                  position: 'absolute',
                  right: '0.6rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 18,
                  color: 'var(--color-outline)',
                }}
              >
                search
              </span>
            </div>

            {/* Roles List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '550px', overflowY: 'auto' }}>
              {filteredRoles.map((role) => {
                const isSelected = role.id === selectedRoleId;
                const isSys = role.is_system_role || role.name_ar === 'مدير النظام';

                return (
                  <div
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '0.625rem',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-outline-variant)',
                      background: isSelected
                        ? 'var(--color-primary-container)'
                        : 'var(--color-surface-container-low)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.375rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: 18,
                            color: isSys ? '#f59e0b' : 'var(--color-primary)',
                          }}
                        >
                          {isSys ? 'shield_person' : 'badge'}
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            color: isSelected ? 'var(--color-on-primary-container)' : 'var(--color-on-surface)',
                          }}
                        >
                          {role.name_ar}
                        </span>
                      </div>
                      {isSys ? (
                        <span className="chip chip-warning" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                          مدير النظام
                        </span>
                      ) : (
                        <span className="chip chip-neutral" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                          {role.user_count || 0} مستخدم
                        </span>
                      )}
                    </div>

                    {role.description && (
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-on-surface-variant)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {role.description}
                      </div>
                    )}

                    {/* Action buttons inside card */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem', marginTop: '0.25rem' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '2px 6px', height: 'auto', fontSize: '0.75rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditRole(role);
                        }}
                        title="تعديل بيانات الدور"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
                      </button>
                      {!isSys && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '2px 6px', height: 'auto', fontSize: '0.75rem', color: '#dc2626' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRole(role);
                          }}
                          title="حذف الدور"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Seed Default Roles Button */}
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleSeedDefaults}
              style={{
                border: '1px dashed var(--color-outline-variant)',
                justifyContent: 'center',
                fontSize: '0.75rem',
                color: 'var(--color-primary)',
                marginTop: '0.5rem',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_fix_high</span>
              زرع وتحديث الأدوار القياسية
            </button>
          </div>

          {/* Right Column: Permission Matrix for Selected Role */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Selected Role Banner */}
            {selectedRole && (
              <div
                className="card"
                style={{
                  padding: '1.25rem',
                  borderRight: isSuperAdminRole ? '4px solid #f59e0b' : '4px solid var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  background: isSuperAdminRole
                    ? 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, var(--color-surface) 100%)'
                    : 'var(--color-surface)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 28, color: isSuperAdminRole ? '#f59e0b' : 'var(--color-primary)' }}
                    >
                      {isSuperAdminRole ? 'verified_user' : 'security'}
                    </span>
                    <div>
                      <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}>
                        {selectedRole.name_ar} {selectedRole.name_en ? `(${selectedRole.name_en})` : ''}
                      </h2>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)' }}>
                        {selectedRole.description || 'تحديد وتعديل الصلاحيات الممنوحة لهذا الدور'}
                      </p>
                    </div>
                  </div>
                </div>

                {isSuperAdminRole ? (
                  <div
                    style={{
                      background: '#fef3c7',
                      border: '1px solid #fde68a',
                      color: '#92400e',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lock</span>
                    يمتلك جميع صلاحيات النظام الحالية والمستقبلية تلقائياً وبشكل كامل
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleToggleSystemAll(true)}
                      style={{ fontSize: '0.8125rem' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>select_all</span>
                      تحديد جميع الصلاحيات
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleToggleSystemAll(false)}
                      style={{ fontSize: '0.8125rem', color: '#dc2626' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>deselect</span>
                      إلغاء الكل
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleSavePermissions}
                      disabled={savingPermissions}
                      style={{
                        padding: '0.5rem 1.25rem',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        gap: '0.5rem',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
                      {savingPermissions ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Filter and Search Bar for Permissions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              {/* Module Filter Pills */}
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActiveModuleFilter('all')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '20px',
                    border: '1px solid var(--color-outline-variant)',
                    background: activeModuleFilter === 'all' ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: activeModuleFilter === 'all' ? '#fff' : 'var(--color-on-surface)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  جميع الوحدات ({PERMISSION_REGISTRY.length})
                </button>
                {Object.entries(MODULE_METADATA).map(([modKey, meta]) => {
                  const count = PERMISSION_REGISTRY.filter((p) => p.module === modKey).length;
                  const isCur = activeModuleFilter === modKey;
                  return (
                    <button
                      key={modKey}
                      onClick={() => setActiveModuleFilter(modKey)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        border: '1px solid var(--color-outline-variant)',
                        background: isCur ? 'var(--color-primary)' : 'var(--color-surface)',
                        color: isCur ? '#fff' : 'var(--color-on-surface)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        {meta.icon}
                      </span>
                      {meta.label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Search Permissions */}
              <div style={{ position: 'relative', width: '220px' }}>
                <input
                  className="input"
                  placeholder="بحث في الشاشات..."
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  style={{ fontSize: '0.8125rem', paddingRight: '2rem' }}
                />
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 16,
                    color: 'var(--color-outline)',
                  }}
                >
                  search
                </span>
              </div>
            </div>

            {/* Grouped Modules and Screens Matrix */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {Object.entries(groupedPermissions).map(([modKey, screens]) => {
                const meta = MODULE_METADATA[modKey] || {
                  label: modKey,
                  icon: 'folder',
                  color: '#64748b',
                };

                return (
                  <div key={modKey} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Module Header */}
                    <div
                      style={{
                        padding: '0.875rem 1.25rem',
                        background: 'var(--color-surface-container-low)',
                        borderBottom: '1px solid var(--color-outline-variant)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '8px',
                            background: meta.color,
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                            {meta.icon}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontWeight: 800, fontSize: '0.9375rem' }}>{meta.label}</span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--color-on-surface-variant)',
                              marginRight: '0.5rem',
                            }}
                          >
                            ({screens.length} شاشات)
                          </span>
                        </div>
                      </div>

                      {!isSuperAdminRole && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleToggleModuleAll(modKey, true)}
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                          >
                            تحديد كل الوحدة
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleToggleModuleAll(modKey, false)}
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', color: '#dc2626' }}
                          >
                            إلغاء كل الوحدة
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Screens Permission Table */}
                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table" style={{ margin: 0 }}>
                        <thead>
                          <tr style={{ background: 'var(--color-surface)' }}>
                            <th style={{ minWidth: '220px' }}>الشاشة / الوحدة الفرعية</th>
                            <th style={{ textAlign: 'center', width: '80px' }}>عرض</th>
                            <th style={{ textAlign: 'center', width: '80px' }}>إضافة</th>
                            <th style={{ textAlign: 'center', width: '80px' }}>تعديل</th>
                            <th style={{ textAlign: 'center', width: '80px' }}>حذف</th>
                            <th style={{ textAlign: 'center', width: '80px' }}>اعتماد</th>
                            <th style={{ textAlign: 'center', width: '80px' }}>طباعة</th>
                            <th style={{ textAlign: 'center', width: '80px' }}>تصدير</th>
                          </tr>
                        </thead>
                        <tbody>
                          {screens.map((def) => {
                            const key = `${def.module}.${def.screen}`;
                            const perm = permissionsMap[key] || {
                              moduleName: def.module,
                              screenName: def.screen,
                              canView: false,
                              canCreate: false,
                              canEdit: false,
                              canDelete: false,
                              canApprove: false,
                              canPrint: false,
                              canExport: false,
                            };

                            const has = (action: keyof Omit<PermissionState, 'moduleName' | 'screenName'>) => {
                              if (isSuperAdminRole) return true;
                              return perm[action];
                            };

                            const isAvailable = (action: string) => def.availableActions.includes(action as any);

                            return (
                              <tr key={key}>
                                <td>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{def.screenNameAr}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>
                                      {def.description}
                                    </span>
                                  </div>
                                </td>

                                {/* Actions Checkboxes */}
                                {(['canView', 'canCreate', 'canEdit', 'canDelete', 'canApprove', 'canPrint', 'canExport'] as const).map(
                                  (actionKey) => {
                                    const rawAction = actionKey.replace('can', '').toLowerCase();
                                    const available = isAvailable(rawAction);

                                    return (
                                      <td key={actionKey} style={{ textAlign: 'center' }}>
                                        {available ? (
                                          <input
                                            type="checkbox"
                                            checked={has(actionKey)}
                                            disabled={isSuperAdminRole}
                                            onChange={() => handleTogglePermission(def.module, def.screen, actionKey)}
                                            style={{
                                              width: 18,
                                              height: 18,
                                              cursor: isSuperAdminRole ? 'default' : 'pointer',
                                              accentColor: 'var(--color-primary)',
                                            }}
                                            title={isSuperAdminRole ? 'ممنوحة تلقائياً لمدير النظام' : `صلاحية ${rawAction}`}
                                          />
                                        ) : (
                                          <span style={{ color: 'var(--color-outline-variant)', fontSize: '0.75rem' }}>
                                            —
                                          </span>
                                        )}
                                      </td>
                                    );
                                  }
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              {Object.keys(groupedPermissions).length === 0 && (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
                  لا توجد شاشات مطابقة لمعايير البحث الحالية.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: USERS & ACCOUNTS MANAGEMENT */}
      {/* ========================================================= */}
      {!loading && activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Action Bar */}
          <div
            className="card"
            style={{
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '260px' }}>
                <input
                  className="input"
                  placeholder="بحث باسم المستخدم، البريد، الاسم..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{ fontSize: '0.8125rem', paddingRight: '2rem' }}
                />
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    right: '0.6rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 18,
                    color: 'var(--color-outline)',
                  }}
                >
                  search
                </span>
              </div>

              <select
                className="input"
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                style={{ width: '180px', fontSize: '0.8125rem' }}
              >
                <option value="">كل الأدوار الوظيفية</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name_ar}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn btn-primary" onClick={openAddUser}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
              إضافة مستخدم جديد
            </button>
          </div>

          {/* Users Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>اسم المستخدم (دخول)</th>
                  <th>الاسم الكامل</th>
                  <th>البريد الإلكتروني</th>
                  <th>الدور الوظيفي (الصلاحيات)</th>
                  <th>الفرع التابع</th>
                  <th>الحالة</th>
                  <th>آخر تسجيل دخول</th>
                  <th style={{ textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        {u.username}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{u.name_ar}</td>
                    <td className="numeric">{u.email}</td>
                    <td>
                      <span
                        className={`chip ${
                          u.role_name === 'مدير النظام' || u.role_name === 'System Administrator'
                            ? 'chip-warning'
                            : 'chip-info'
                        }`}
                        style={{ fontWeight: 700 }}
                      >
                        {u.role_name || 'غير محدد'}
                      </span>
                    </td>
                    <td>{u.branch_name || 'كل الفروع'}</td>
                    <td>
                      <span className={`chip ${u.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>
                        {u.status === 'Active' ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="numeric" style={{ fontSize: '0.75rem' }}>
                      {u.last_login ? new Date(u.last_login).toLocaleString('ar-SA') : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => openEditUser(u)}
                        title="تعديل بيانات المستخدم أو تغيير الدور"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-on-surface-variant)' }}>
                      لا يوجد مستخدمين مطابقين لمعايير البحث
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT ROLE */}
      {/* ========================================================= */}
      {showRoleModal && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              {editingRole ? 'تعديل بيانات الدور الوظيفي' : 'إنشاء دور وظيفي جديد'}
            </h2>
            <form onSubmit={handleSaveRole} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label>اسم الدور بالعربية *</label>
                <input
                  className="input"
                  placeholder="مثال: محاسب أول، أمين مخزن..."
                  value={roleForm.nameAr}
                  onChange={(e) => setRoleForm({ ...roleForm, nameAr: e.target.value })}
                  required
                  disabled={editingRole?.is_system_role}
                />
              </div>
              <div>
                <label>اسم الدور بالإنجليزية (اختياري)</label>
                <input
                  className="input"
                  placeholder="e.g. Senior Accountant"
                  value={roleForm.nameEn}
                  onChange={(e) => setRoleForm({ ...roleForm, nameEn: e.target.value })}
                  disabled={editingRole?.is_system_role}
                />
              </div>
              <div>
                <label>الوصف والمسؤوليات</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="وصف مختصر للمهام المنوطة بهذا الدور..."
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowRoleModal(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRole ? 'حفظ التعديلات' : 'إنشاء الدور'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT USER */}
      {/* ========================================================= */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              {editingUser ? 'تعديل بيانات المستخدم والدور' : 'إنشاء مستخدم جديد وربطه بالدور'}
            </h2>
            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>اسم المستخدم (لتسجيل الدخول) *</label>
                  <input
                    className="input"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    required
                    disabled={!!editingUser}
                  />
                </div>
                <div>
                  <label>الاسم الكامل بالعربية *</label>
                  <input
                    className="input"
                    value={userForm.nameAr}
                    onChange={(e) => setUserForm({ ...userForm, nameAr: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>البريد الإلكتروني *</label>
                  <input
                    className="input"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>
                    كلمة المرور {editingUser ? '(اتركها فارغة لعدم التغيير)' : '*'}
                  </label>
                  <input
                    className="input"
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    required={!editingUser}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--color-primary)' }}>الدور الوظيفي (يرث صلاحياته) *</label>
                  <select
                    className="input"
                    value={userForm.roleId}
                    onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })}
                    required
                    style={{ border: '2px solid var(--color-primary)' }}
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name_ar} {r.is_system_role ? '★ (مدير النظام)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>الفرع الافتراضي</label>
                  <select
                    className="input"
                    value={userForm.branchId}
                    onChange={(e) => setUserForm({ ...userForm, branchId: e.target.value })}
                  >
                    <option value="">كافة الفروع</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label>حالة الحساب</label>
                  <select
                    className="input"
                    value={userForm.status}
                    onChange={(e) => setUserForm({ ...userForm, status: e.target.value as 'Active' | 'Inactive' })}
                  >
                    <option value="Active">نشط - يسمح بتسجيل الدخول</option>
                    <option value="Inactive">معطل - إيقاف الدخول مؤقتاً</option>
                  </select>
                </div>
              </div>

              {/* Helpful note on automatic permission inheritance */}
              <div
                style={{
                  background: 'var(--color-surface-container)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  color: 'var(--color-on-surface-variant)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-primary)' }}>
                  info
                </span>
                <span>
                  <strong>ملاحظة:</strong> بمجرد تحديد الدور الوظيفي، يرث المستخدم فورياً وبشكل تلقائي كافة الصلاحيات
                  المعرفة لذلك الدور دون الحاجة لإدخال صلاحيات منفصلة لكل موظف.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowUserModal(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'حفظ التعديلات' : 'إنشاء المستخدم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
