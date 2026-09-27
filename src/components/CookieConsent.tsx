import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('system_erp_cookie_consent');
    if (!consent) {
      // Small delay for smooth entry
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('system_erp_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('system_erp_cookie_consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside className="cookie-banner-wrap" aria-label="شريط الموافقة على ملفات تعريف الارتباط" role="dialog">
      <div className="cookie-banner-card">
        <div className="cookie-banner-content">
          <div className="cookie-banner-icon">
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>cookie</span>
          </div>
          <div className="cookie-banner-text">
            <h4>إشعار الخصوصية وملفات تعريف الارتباط</h4>
            <p>
              نستخدم ملفات تعريف الارتباط لتحسين أداء النظام وتخصيص تجربة المستخدم بما يتوافق مع معايير الأمان وقوانين الخصوصية العالمية (GDPR).
            </p>
          </div>
        </div>
        <div className="cookie-banner-actions">
          <button
            type="button"
            className="cookie-btn-accept"
            onClick={handleAccept}
            id="cookie-consent-accept-btn"
          >
            موافق على الكل
          </button>
          <button
            type="button"
            className="cookie-btn-decline"
            onClick={handleDecline}
            id="cookie-consent-decline-btn"
          >
            المطلوب فقط
          </button>
        </div>
      </div>
    </aside>
  );
}
