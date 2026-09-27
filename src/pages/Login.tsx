import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

type ModalType = 'privacy' | 'terms' | 'accessibility' | 'help' | 'forgot' | null;

export default function Login() {
  const { isAuthenticated, login } = useAuthStore();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@1234');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  
  // Modal state
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactSending, setContactSending] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      window.location.pathname = '/';
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'حدث خطأ أثناء تسجيل الدخول. يرجى التحقق من بيانات الدخول.');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSending(true);
    setTimeout(() => {
      setContactSending(false);
      setContactSuccess(true);
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactSubject('');
      setContactMessage('');
      setTimeout(() => setContactSuccess(false), 5000);
    }, 800);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="eq-landing-page" dir="rtl">
      {/* ── Top Header Navigation ─────────────────────────────────── */}
      <header className="eq-header">
        <div className="eq-header-container">
          <div className="eq-brand">
            <div className="eq-brand-icon">
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#ffffff' }}>hub</span>
            </div>
            <span className="eq-brand-title">نظام إدارة الموارد المؤسسية</span>
          </div>

          <nav className="eq-nav" aria-label="شريط التنقل الرئيسي">
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="eq-nav-link active">
              الرئيسية
            </button>
            <button type="button" onClick={() => scrollToSection('modules-section')} className="eq-nav-link">
              الخدمات
            </button>
            <button type="button" onClick={() => scrollToSection('faq-section')} className="eq-nav-link">
              الأسئلة الشائعة
            </button>
            <button type="button" onClick={() => scrollToSection('contact-section')} className="eq-nav-link">
              اتصل بنا
            </button>
          </nav>

          <button type="button" onClick={() => scrollToSection('login-card-anchor')} className="eq-btn-header-login">
            <span className="material-symbols-outlined eq-btn-icon-mobile" style={{ fontSize: 18 }}>login</span>
            <span>تسجيل الدخول</span>
          </button>
        </div>
      </header>

      {/* ── Main Hero & Login Split Section ────────────────────────── */}
      <main className="eq-hero-section">
        <div className="eq-hero-container">
          {/* Hero Content Side */}
          <div className="eq-hero-content">
            <div className="eq-hero-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified</span>
              <span>الجيل الأحدث من أنظمة الـ ERP الذكية</span>
            </div>
            <h1 className="eq-hero-heading">
              مرحباً بكم في <span className="eq-highlight">نظام إدارة الموارد المؤسسية</span>
            </h1>
            <p className="eq-hero-subtext">
              الحل البرمجي السحابي المتكامل لإدارة الحسابات المالية، المخزون، وسلاسل الإمداد، المبيعات والمشتريات، وإدارة شؤون الموظفين والرواتب. صُمم النظام بدقة متناهية لمساعدة الشركات والمؤسسات على أتمتة العمليات اليومية واتخاذ القرارات الاستراتيجية بكل ثقة وسرعة.
            </p>

            <div className="eq-hero-actions">
              <button type="button" onClick={() => scrollToSection('modules-section')} className="eq-btn-primary">
                استكشف الخدمات <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_downward</span>
              </button>
              <button type="button" onClick={() => scrollToSection('login-card-anchor')} className="eq-btn-secondary">
                تسجيل الدخول السريع
              </button>
            </div>
          </div>

          {/* Hero Login Card Side */}
          <div id="login-card-anchor" className="eq-login-card-wrapper">
            <div className="eq-login-card">
              <div className="eq-card-header">
                <div className="eq-avatar-icon">
                  <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#ffffff' }}>lock_open</span>
                </div>
                <h2 className="eq-card-title">تسجيل الدخول للنظام</h2>
                <p className="eq-card-subtitle">أدخل بيانات الاعتماد الخاصة بك للوصول</p>
              </div>

              <form onSubmit={handleSubmit} className="eq-login-form">
                <div className="eq-form-group">
                  <label htmlFor="username">البريد الإلكتروني / اسم المستخدم</label>
                  <div className="eq-input-field">
                    <input
                      id="username"
                      type="text"
                      placeholder="أدخل البريد الإلكتروني أو اسم المستخدم"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      required
                    />
                    <span className="material-symbols-outlined eq-input-icon">person</span>
                  </div>
                </div>

                <div className="eq-form-group">
                  <label htmlFor="password">كلمة المرور</label>
                  <div className="eq-input-field">
                    <input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      placeholder="أدخل كلمة المرور"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="eq-pass-toggle"
                      onClick={() => setShowPass(!showPass)}
                      aria-label="إظهار/إخفاء كلمة المرور"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#94a3b8' }}>
                        {showPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="eq-form-options">
                  <label className="eq-checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>تذكرني على هذا الجهاز</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveModal('forgot')}
                    className="eq-forgot-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>

                {error && (
                  <div className="eq-error-banner">
                    <span className="material-symbols-outlined">error</span>
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" className="eq-btn-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                      <span>جاري التحقق والدخول...</span>
                    </>
                  ) : (
                    <>
                      <span>تسجيل الدخول</span>
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
                    </>
                  )}
                </button>

                <div className="eq-demo-credentials">
                  <span className="eq-demo-title">بيانات الدخول التجريبية:</span>
                  <div className="eq-demo-pills">
                    <span className="eq-demo-pill">مستخدم: <strong>admin</strong></span>
                    <span className="eq-demo-pill">كلمة المرور: <strong>Admin@1234</strong></span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* ── System Modules Section ────────────────────────────────── */}
      <section id="modules-section" className="eq-modules-section">
        <div className="eq-section-header">
          <h2 className="eq-section-title">وحدات النظام المتكاملة</h2>
          <p className="eq-section-subtitle">
            مجموعة متكاملة من الأدوات الإدارية والمالية مصممة للعمل معاً بتناغم تام لدعم اتخاذ القرار المؤسسي.
          </p>
        </div>

        <div className="eq-modules-grid">
          {/* Module 1 */}
          <div className="eq-module-card">
            <div className="eq-module-icon">
              <span className="material-symbols-outlined">account_balance</span>
            </div>
            <h3 className="eq-module-title">الدورة المحاسبية</h3>
            <p className="eq-module-desc">
              إدارة شاملة لدفاتر الأستاذ، القيود اليومية المزدوجة، موازين المراجعة، والتقارير الختامية بدقة متناهية وفق المعايير الدولية.
            </p>
            <button type="button" onClick={() => scrollToSection('login-card-anchor')} className="eq-module-link">
              <span>اكتشف المزيد</span>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_left_alt</span>
            </button>
          </div>

          {/* Module 2 */}
          <div className="eq-module-card">
            <div className="eq-module-icon">
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
            <h3 className="eq-module-title">إدارة المخزون</h3>
            <p className="eq-module-desc">
              تتبع دقيق لحركات المستودعات، مستويات إعادة الطلب، وتحديد تكلفة الأصناف بطرق الوارد أولاً صادر أولاً (FIFO) والمتوسط المرجح.
            </p>
            <button type="button" onClick={() => scrollToSection('login-card-anchor')} className="eq-module-link">
              <span>اكتشف المزيد</span>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_left_alt</span>
            </button>
          </div>

          {/* Module 3 */}
          <div className="eq-module-card">
            <div className="eq-module-icon">
              <span className="material-symbols-outlined">handshake</span>
            </div>
            <h3 className="eq-module-title">إدارة المشتريات والموردين</h3>
            <p className="eq-module-desc">
              أتمتة دورة المشتريات بدءاً من طلبات الشراء، عروض الأسعار، أوامر الشراء، وفواتير الموردين مع متابعة الدفعات المستحقة.
            </p>
            <button type="button" onClick={() => scrollToSection('login-card-anchor')} className="eq-module-link">
              <span>اكتشف المزيد</span>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_left_alt</span>
            </button>
          </div>

          {/* Module 4 */}
          <div className="eq-module-card">
            <div className="eq-module-icon">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <h3 className="eq-module-title">المبيعات ونقاط البيع</h3>
            <p className="eq-module-desc">
              إصدار الفواتير الضريبية المبسطة والإلكترونية، إدارة حسابات العملاء، خطط الأسعار، والخصومات الترويجية مع تحليلات لحظية.
            </p>
            <button type="button" onClick={() => scrollToSection('login-card-anchor')} className="eq-module-link">
              <span>اكتشف المزيد</span>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_left_alt</span>
            </button>
          </div>

          {/* Module 5 */}
          <div className="eq-module-card">
            <div className="eq-module-icon">
              <span className="material-symbols-outlined">badge</span>
            </div>
            <h3 className="eq-module-title">الموارد البشرية والرواتب</h3>
            <p className="eq-module-desc">
              إدارة ملفات الموظفين، سجلات الحضور والانصراف، مسيرات الرواتب الشهرية، البدلات والاستقطاعات، وأرصدة الإجازات الرسمية.
            </p>
            <button type="button" onClick={() => scrollToSection('login-card-anchor')} className="eq-module-link">
              <span>اكتشف المزيد</span>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_left_alt</span>
            </button>
          </div>

          {/* Module 6 */}
          <div className="eq-module-card">
            <div className="eq-module-icon">
              <span className="material-symbols-outlined">settings</span>
            </div>
            <h3 className="eq-module-title">إعدادات النظام والأمان</h3>
            <p className="eq-module-desc">
              تحكم كامل في الأدوار والصلاحيات، دعم تعدد الفروع والعملات، وسجلات التدقيق المالي لضمان أعلى مستويات الحماية والامتثال.
            </p>
            <button type="button" onClick={() => scrollToSection('login-card-anchor')} className="eq-module-link">
              <span>اكتشف المزيد</span>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_left_alt</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats Counter Section ─────────────────────────────────── */}
      <section id="about-section" className="eq-stats-section">
        <div className="eq-stats-container">
          <div className="eq-stat-item">
            <div className="eq-stat-number">+500</div>
            <div className="eq-stat-label">منشأة ومؤسسة رائدة</div>
          </div>
          <div className="eq-stat-item">
            <div className="eq-stat-number">99.9%</div>
            <div className="eq-stat-label">معدل استقرار وتشغيل السحابة</div>
          </div>
          <div className="eq-stat-item">
            <div className="eq-stat-number">24/7</div>
            <div className="eq-stat-label">دعم فني واستشاري متواصل</div>
          </div>
          <div className="eq-stat-item">
            <div className="eq-stat-number">+15</div>
            <div className="eq-stat-label">عاماً من الخبرة والريادة التقنية</div>
          </div>
        </div>
      </section>

      {/* ── FAQ & Deep Knowledge Section (Content Depth & SEO) ──────── */}
      <section id="faq-section" className="eq-faq-section">
        <div className="eq-faq-container">
          <div className="eq-section-header" style={{ marginBottom: '2.5rem' }}>
            <h2 className="eq-section-title">الأسئلة الشائعة والمزايا التقنية</h2>
            <p className="eq-section-subtitle">
              إجابات شاملة حول مميزات النظام، توافق المعايير، وإجراءات الأمان وحماية البيانات السحابية.
            </p>
          </div>

          <div className="eq-faq-list">
            <div className="eq-faq-item">
              <h4>
                <span className="material-symbols-outlined">verified_user</span>
                هل يدعم النظام معايير الفوترة الإلكترونية والمحاسبة المزدوجة؟
              </h4>
              <p>
                نعم، يعتمد النظام على مبادئ القيد المزدوج المحاسبي المعتمدة دولياً، ويوفر توافقاً كاملاً مع متطلبات الفاتورة الضريبية الإلكترونية وإمكانية توليد وطباعة الفواتير مع رموز الاستجابة السريعة (QR Codes) والترميز المالي المطلوب.
              </p>
            </div>

            <div className="eq-faq-item">
              <h4>
                <span className="material-symbols-outlined">cloud_done</span>
                كيف يتم تأمين وحماية البيانات المالية والمحاسبية؟
              </h4>
              <p>
                يتم تشفير كافة البيانات أثناء النقل والتخزين بأحدث بروتوكولات الأمان (HTTPS/TLS) مع سياسات أمان مشددة (CSP) لمنع هجمات الحقن البرمجي، بالإضافة إلى النسخ الاحتياطي التلقائي المتكرر لضمان عدم فقدان أي معاملة مالية.
              </p>
            </div>

            <div className="eq-faq-item">
              <h4>
                <span className="material-symbols-outlined">devices</span>
                هل يعمل النظام بسلاسة على الهواتف والأجهزة اللوحية؟
              </h4>
              <p>
                تم تصميم وتطوير النظام بواجهات مستجيبة بالكامل تدعم مختلف أحجام الشاشات مع أزرار لمس مريحة بقياسات قياسية تمنع التأخير وخطأ النقر، وتمنع التقريب غير المرغوب به على هواتف آيفون وأندرويد.
              </p>
            </div>

            <div className="eq-faq-item">
              <h4>
                <span className="material-symbols-outlined">sync_alt</span>
                هل يمكن ربط النظام مع أنظمة وتطبيقات خارجية عبر API؟
              </h4>
              <p>
                يوفر النظام واجهة برمجة تطبيقات (RESTful API) قوية تمكن المنشآت من ربط منظومة ERP مع المتاجر الإلكترونية، بوابات الدفع، أجهزة البصمة للحضور والانصراف، وأي برمجيات مساندة أخرى بكل سهولة ومرونة.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact Section ───────────────────────────────────────── */}
      <section id="contact-section" className="eq-contact-section">
        <div className="eq-section-header" style={{ marginBottom: '2.5rem' }}>
          <h2 className="eq-section-title">تواصل معنا واستشر خبراءنا</h2>
          <p className="eq-section-subtitle">
            فريقنا المتخصص جاهز للإجابة على استفساراتك وتقديم عروض مخصصة تناسب حجم ونشاط منشأتك.
          </p>
        </div>

        <div className="eq-contact-grid">
          {/* Contact Details Cards */}
          <div className="eq-contact-info">
            <div className="eq-contact-card">
              <div className="eq-contact-icon">
                <span className="material-symbols-outlined">mail</span>
              </div>
              <div className="eq-contact-details">
                <h4>البريد الإلكتروني المباشر</h4>
                <p>راسلنا لأي استفسارات تجارية أو دعم تقني:</p>
                <a href="mailto:contact@system-erp.com">contact@system-erp.com</a>
              </div>
            </div>

            <div className="eq-contact-card">
              <div className="eq-contact-icon">
                <span className="material-symbols-outlined">call</span>
              </div>
              <div className="eq-contact-details">
                <h4>الهاتف وخدمة العملاء</h4>
                <p>متاحون خلال أوقات العمل الرسمية:</p>
                <a href="tel:+966112345678" dir="ltr">+966 11 234 5678</a>
              </div>
            </div>

            <div className="eq-contact-card">
              <div className="eq-contact-icon">
                <span className="material-symbols-outlined">location_on</span>
              </div>
              <div className="eq-contact-details">
                <h4>المقر الرئيسي</h4>
                <p>طريق الملك فهد، حي المروج، الرياض، المملكة العربية السعودية</p>
                <p style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#046a67', fontWeight: 600 }}>
                  أوقات العمل: الأحد - الخميس | 8:00 ص - 5:00 م
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Contact Form */}
          <div className="eq-contact-form-box">
            <h3>أرسل استفسارك الآن</h3>
            <p>املأ النموذج أدناه وسيقوم فريق الاستشارات بالتواصل معك خلال ساعات قليلة.</p>

            {contactSuccess ? (
              <div className="eq-error-banner" style={{ background: '#d1fae5', color: '#065f46', borderColor: '#a7f3d0' }}>
                <span className="material-symbols-outlined">check_circle</span>
                <span>تم استلام رسالتك بنجاح! سيتواصل معك أحد ممثلينا في أقرب وقت.</span>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="eq-contact-form">
                <div className="eq-form-row">
                  <div className="eq-form-group">
                    <label htmlFor="contact-name">الاسم الكامل *</label>
                    <div className="eq-input-field">
                      <input
                        id="contact-name"
                        type="text"
                        placeholder="أدخل اسمك الكريم"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="eq-form-group">
                    <label htmlFor="contact-email">البريد الإلكتروني *</label>
                    <div className="eq-input-field">
                      <input
                        id="contact-email"
                        type="email"
                        placeholder="name@company.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="eq-form-row">
                  <div className="eq-form-group">
                    <label htmlFor="contact-phone">رقم الجوال</label>
                    <div className="eq-input-field">
                      <input
                        id="contact-phone"
                        type="tel"
                        placeholder="+966 5x xxx xxxx"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="eq-form-group">
                    <label htmlFor="contact-subject">موضوع الاستفسار *</label>
                    <div className="eq-input-field">
                      <input
                        id="contact-subject"
                        type="text"
                        placeholder="مثال: طلب عرض سعر / استفسار تقني"
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="eq-form-group">
                  <label htmlFor="contact-msg">تفاصيل الرسالة *</label>
                  <textarea
                    id="contact-msg"
                    placeholder="اكتب استفسارك بالتفصيل..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="eq-btn-submit" disabled={contactSending}>
                  {contactSending ? (
                    <>
                      <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                      <span>جاري إرسال الرسالة...</span>
                    </>
                  ) : (
                    <>
                      <span>إرسال الرسالة الآن</span>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="eq-footer">
        <div className="eq-footer-top">
          <div className="eq-footer-brand">
            <div className="eq-brand" style={{ marginBottom: '0.75rem' }}>
              <div className="eq-brand-icon" style={{ width: 32, height: 32, borderRadius: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#ffffff' }}>hub</span>
              </div>
              <span className="eq-brand-title" style={{ fontSize: '1.2rem' }}>نظام إدارة الموارد المؤسسية</span>
            </div>
            <p className="eq-footer-desc">
              الحل الأمثل لإدارة الموارد المالية، المخزون، وسلاسل الإمداد، والموارد البشرية بذكاء وكفاءة وأعلى معايير الأمان العالمية.
            </p>
          </div>

          <div className="eq-footer-links-group">
            <div className="eq-footer-col">
              <h4>عن النظام</h4>
              <ul>
                <li><button type="button" onClick={() => scrollToSection('about-section')}>حول المنظومة</button></li>
                <li><button type="button" onClick={() => scrollToSection('modules-section')}>الوحدات والخدمات</button></li>
                <li><button type="button" onClick={() => scrollToSection('faq-section')}>الأسئلة الشائعة</button></li>
              </ul>
            </div>
            <div className="eq-footer-col">
              <h4>التواصل والدعم</h4>
              <ul>
                <li><button type="button" onClick={() => scrollToSection('contact-section')}>اتصل بنا</button></li>
                <li><button type="button" onClick={() => setActiveModal('help')}>مركز المساعدة والدعم</button></li>
                <li><button type="button" onClick={() => setActiveModal('accessibility')}>إمكانية الوصول (A11Y)</button></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="eq-footer-bottom">
          <div className="eq-footer-copyright">
            نظام إدارة الموارد المؤسسية المتكامل (ERP System). جميع الحقوق محفوظة © 2026
          </div>
          <div className="eq-footer-legal">
            <button type="button" onClick={() => setActiveModal('privacy')} className="eq-footer-legal-btn">
              سياسة الخصوصية و GDPR
            </button>
            <button type="button" onClick={() => setActiveModal('terms')} className="eq-footer-legal-btn">
              شروط الاستخدام
            </button>
            <button type="button" onClick={() => setActiveModal('accessibility')} className="eq-footer-legal-btn">
              بيان إمكانية الوصول
            </button>
            <button type="button" onClick={() => scrollToSection('contact-section')} className="eq-footer-legal-btn">
              الدعم الفني
            </button>
          </div>
        </div>
      </footer>

      {/* ── Legal & Info Modals ────────────────────────────────────── */}
      {activeModal && (
        <div className="eq-legal-modal-overlay" onClick={() => setActiveModal(null)} role="dialog">
          <div className="eq-legal-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="eq-legal-modal-header">
              <h3>
                {activeModal === 'privacy' && 'سياسة الخصوصية والامتثال للـ GDPR'}
                {activeModal === 'terms' && 'شروط وأحكام استخدام النظام'}
                {activeModal === 'accessibility' && 'بيان إمكانية الوصول وسهولة الاستخدام (A11Y)'}
                {activeModal === 'help' && 'مركز المساعدة والدعم الفني'}
                {activeModal === 'forgot' && 'استعادة كلمة المرور'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem' }}
                aria-label="إغلاق"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#64748b' }}>close</span>
              </button>
            </div>

            <div className="eq-legal-modal-body">
              {activeModal === 'privacy' && (
                <div>
                  <p>
                    نحن في نظام إدارة الموارد المؤسسية نلتزم بأعلى معايير حماية البيانات والخصوصية بما يتوافق مع الأنظمة المحلية ولائحة حماية البيانات العامة (GDPR).
                  </p>
                  <h4>1. جمع واستخدام البيانات</h4>
                  <p>
                    يتم جمع البيانات الأساسية الخاصة بالمنشأة والمستخدمين بهدف تقديم الخدمات المحاسبية والإدارية وتوثيق القيود وسجلات النظام فقط، ولا يتم مشاركة أي بيانات مالية مع أطراف ثالثة دون إذن صريح.
                  </p>
                  <h4>2. حقوق صاحب البيانات (Data Subject Rights)</h4>
                  <ul>
                    <li>الحق في الوصول إلى البيانات المسجلة وطلب نسخة منها.</li>
                    <li>الحق في تصحيح أو تعديل أي بيانات غير دقيقة.</li>
                    <li>الحق في مسح أو أرشفة البيانات وفق الضوابط النظامية.</li>
                  </ul>
                  <h4>3. مسؤول حماية البيانات (DPA Contact)</h4>
                  <p>
                    لأي استفسارات قانونية أو ممارسة لحقوق الخصوصية، يمكنك التواصل مع مسؤول حماية البيانات مباشرة عبر: <a href="mailto:dpa@system-erp.com">dpa@system-erp.com</a>.
                  </p>
                </div>
              )}

              {activeModal === 'terms' && (
                <div>
                  <p>
                    باستخدامك لنظام إدارة الموارد المؤسسية، فإنك توافق على الالتزام ببنود وشروط الخدمة الموضحة أدناه:
                  </p>
                  <h4>1. أمان الحسابات وكلمات المرور</h4>
                  <p>
                    يتحمل المستخدم والمنشأة المسؤولية الكاملة عن الحفاظ على سرية بيانات تسجيل الدخول وتحديد الصلاحيات الممنوحة للموظفين.
                  </p>
                  <h4>2. الاستخدام المصرح به</h4>
                  <p>
                    يُحظر استخدام النظام لأي أغراض تخالف الأنظمة المالية والضريبية السارية، أو محاولة إجراء أي هجمات إلكترونية أو وصول غير مصرح به.
                  </p>
                  <h4>3. التوفر والنسخ الاحتياطي</h4>
                  <p>
                    نضمن توفير الخدمة بنسبة استقرار تفوق 99.9% مع تطبيق إجراءات دورية للنسخ الاحتياطي لقواعد البيانات.
                  </p>
                </div>
              )}

              {activeModal === 'accessibility' && (
                <div>
                  <p>
                    نلتزم بجعل نظام إدارة الموارد المؤسسية متاحاً وميسراً لكافة المستخدمين بما يتوافق مع معايير إمكانية الوصول إلى محتوى الويب (WCAG 2.1 Level AA).
                  </p>
                  <h4>المعايير المطبقة:</h4>
                  <ul>
                    <li>دعم التنقل الكامل عبر لوحة المفاتيح لكافة الحقول والأزرار.</li>
                    <li>أهداف لمس مريحة لا تقل عن 48×48 بكسل على كافة الهواتف والأجهزة الذكية.</li>
                    <li>تباين ألوان مرتفع وواضح للنصوص والخلفيات لتسهيل القراءة.</li>
                    <li>أوصاف ونصوص بديلة لكافة الأيقونات والعناصر الرسومية التفاعلية.</li>
                  </ul>
                  <p>
                    إذا واجهت أي صعوبة في الوصول، يرجى التواصل مع فريق إمكانية الوصول عبر: <a href="mailto:a11y@system-erp.com">a11y@system-erp.com</a>.
                  </p>
                </div>
              )}

              {activeModal === 'help' && (
                <div>
                  <p>
                    مركز المساعدة متوفر على مدار الساعة لمساعدة فريقك على استثمار كافة إمكانيات النظام المحاسبي والإداري.
                  </p>
                  <h4>قنوات الدعم المتاحة:</h4>
                  <ul>
                    <li><strong>الدعم المباشر عبر الهاتف:</strong> <a href="tel:+966112345678" dir="ltr">+966 11 234 5678</a></li>
                    <li><strong>البريد الإلكتروني للدعم الفني:</strong> <a href="mailto:support@system-erp.com">support@system-erp.com</a></li>
                    <li><strong>ساعات العمل:</strong> الأحد - الخميس من 8:00 ص إلى 5:00 م (خدمة الطوارئ متوفرة 24/7).</li>
                  </ul>
                </div>
              )}

              {activeModal === 'forgot' && (
                <div>
                  <p>
                    لاستعادة كلمة المرور الخاصة بحسابك، يرجى التواصل مع مدير النظام في منشأتك أو مراسلة الدعم الفني المعتمد.
                  </p>
                  <div className="eq-demo-credentials" style={{ marginTop: '1rem', textAlign: 'right' }}>
                    <strong>بيانات الدخول الافتراضية للتجربة السريعة:</strong>
                    <div style={{ marginTop: '0.5rem' }}>
                      اسم المستخدم: <code>admin</code><br />
                      كلمة المرور: <code>Admin@1234</code>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="eq-legal-modal-footer">
              <button
                type="button"
                className="cookie-btn-accept"
                onClick={() => setActiveModal(null)}
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
