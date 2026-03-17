import { useState, useEffect } from 'react';

export type ConsentStatus = 'accepted' | 'rejected' | 'pending';

export const useCookieConsent = () => {
  const [status, setStatus] = useState<ConsentStatus>('pending');
  const [showSettings, setShowSettings] = useState(false);
  const [consents, setConsents] = useState({ analytics: true });
  
  const [isLoaded, setIsLoaded] = useState(false);

useEffect(() => {
    try {
      const saved = localStorage.getItem('cookies_consent');
      if (saved) {
        setStatus(saved as ConsentStatus);
        // Backward compat: map old status to consents
        if (saved === 'accepted') {
          setConsents({ analytics: true });
        } else if (saved === 'rejected') {
          setConsents({ analytics: false });
        }
      }
      // Try load granular consents
      const granular = localStorage.getItem('cookies_consents');
      if (granular) {
        setConsents(JSON.parse(granular));
      }
      setIsLoaded(true);
    } catch {
      // localStorage blocked
      setStatus('rejected');
      setConsents({ analytics: false });
      setIsLoaded(true);
    }
  }, []);

  const updateConsent = (key: string, value: boolean) => {
    setConsents(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    const analyticsEnabled = consents.analytics;
    localStorage.setItem('cookies_consent', analyticsEnabled ? 'accepted' : 'rejected');
    localStorage.setItem('cookies_consents', JSON.stringify(consents));
    setStatus(analyticsEnabled ? 'accepted' : 'rejected');
    setShowSettings(false);
    document.cookie = `analytics=${analyticsEnabled ? 1 : 0}; path=/; ${analyticsEnabled ? 'max-age=31536000' : 'expires=Thu, 01 Jan 1970 00:00:00 GMT'}`;
  };

  const accept = () => {
    setConsents({ analytics: true });
    saveSettings();
  };

  const reject = () => {
    setConsents({ analytics: false });
    saveSettings();
  };

  const openSettings = () => setShowSettings(true);
  const closeSettings = () => setShowSettings(false);

  return {
    status,
    showSettings,
    consents,
    isLoaded,
    accept,
    reject,
    updateConsent,
    saveSettings,
    openSettings,
    closeSettings,
    hasConsented: status !== 'pending'
  };
};

