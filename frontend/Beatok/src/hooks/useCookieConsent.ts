import { useState, useEffect } from 'react';

export type ConsentStatus = 'accepted' | 'rejected' | 'pending';

export const useCookieConsent = () => {
  const [status, setStatus] = useState<ConsentStatus>('pending');
  const [showSettings, setShowSettings] = useState(false);
  
  const [isLoaded, setIsLoaded] = useState(false);

useEffect(() => {
    try {
      const saved = localStorage.getItem('cookies_consent');
      if (saved === 'accepted' || saved === 'rejected') {
        setStatus(saved as ConsentStatus);
      }
      setIsLoaded(true);
    } catch {
      // localStorage blocked
      setStatus('rejected');
      setIsLoaded(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookies_consent', 'accepted');
    setStatus('accepted');
    setShowSettings(false);
    // Enable analytics cookies
    document.cookie = 'analytics=1; path=/; max-age=31536000';
  };

  const reject = () => {
    localStorage.setItem('cookies_consent', 'rejected');
    setStatus('rejected');
    setShowSettings(false);
    // Clear analytics cookies
    document.cookie = 'analytics=0; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  const openSettings = () => setShowSettings(true);
  const closeSettings = () => setShowSettings(false);

  return {
    status,
    showSettings,
    isLoaded,
    accept,
    reject,
    openSettings,
    closeSettings,
    hasConsented: status !== 'pending'
  };
};

