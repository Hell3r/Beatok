import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/UI/Footer';
import { NotificationProvider } from './components/NotificationProvider';
import { AudioPlayerProvider } from './contexts/AudioPlayerContext';
import { ModalProvider } from './contexts/ModalProvider';
import AudioPlayer from './components/AudioPlayer';
import AuthModal from './components/AuthModal';
import './index.css';
import BeatsPage from './pages/BeatsPage';
import ProfilePage from './pages/ProfilePage';
import HomePage from './pages/HomePage';
import Error404 from './pages/errors/404';
import BeatmakersPage from './pages/BeatmakersPage';
import Admin from './pages/Admin';
import SupportPage from './pages/SupportPage';
import EmailChange from './pages/success/EmailChange';
import PasswordResetPage from './pages/PasswordResetPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import CookieConsentBanner from './components/UI/CookieConsentBanner';

const PageLayout: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`page-shell ${className}`.trim()}>
    {children}
  </div>
);

const PageLayoutWithFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <>
    <div className={`page-shell ${className}`.trim()}>
      {children}
    </div>
    <Footer />
  </>
);

const App: React.FC = () => {
  const [authModalOpen, setAuthModalOpen] = React.useState(false);

  useEffect(() => {
    const handleOpenAuthModal = () => {
      setAuthModalOpen(true);
    };

    window.addEventListener('openAuthModal', handleOpenAuthModal);

    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuthModal);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    let frameId = 0;
    let nextX = window.innerWidth / 2;
    let nextY = window.innerHeight / 3;

    const paintPointer = () => {
      root.style.setProperty('--pointer-x', `${nextX}px`);
      root.style.setProperty('--pointer-y', `${nextY}px`);
      frameId = 0;
    };

    const queuePaint = () => {
      if (frameId !== 0) return;
      frameId = window.requestAnimationFrame(paintPointer);
    };

    const handlePointerMove = (event: PointerEvent) => {
      nextX = event.clientX;
      nextY = event.clientY;
      queuePaint();
    };

    const handleWindowBlur = () => {
      nextX = window.innerWidth / 2;
      nextY = window.innerHeight / 3;
      queuePaint();
    };

    paintPointer();
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('blur', handleWindowBlur);
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  const isUserAuthenticated = !!localStorage.getItem('access_token');

  return (
    <ModalProvider>
      <AudioPlayerProvider>
        <NotificationProvider>
          <div className="app-shell text-[#e5e5e5]">
            <div className="app-grid" />
            <div className="app-neon" />
            <div className="app-noise" />
            <Router>
              <div className="page-content-wrap">
                <Header isAuthenticated={isUserAuthenticated} />

                <main>
                  <Routes>
                    <Route path="/" element={<HomePage />} />

                    <Route path="/admin" element={<Admin />} />
                    <Route path="/profile" element={isUserAuthenticated ? <PageLayoutWithFooter><ProfilePage /></PageLayoutWithFooter> : <PageLayout><ProfilePage /></PageLayout>} />
                    <Route path="/profile/:id" element={isUserAuthenticated ? <PageLayoutWithFooter><ProfilePage /></PageLayoutWithFooter> : <PageLayout><ProfilePage /></PageLayout>} />
                    <Route path="/beats" element={<PageLayoutWithFooter className="page-shell--beats"><BeatsPage /></PageLayoutWithFooter>} />
                    {
                    //<Route path="/about" element={<PageLayoutWithFooter><AboutPage /></PageLayoutWithFooter>} />
                    }
                    <Route path="/beatmakers" element={<PageLayoutWithFooter><BeatmakersPage /></PageLayoutWithFooter>} />
                    {
                    //<Route path="/forum" element={<PageLayout><ForumPage /></PageLayout>} />
                    }
                    <Route path="/support" element={<PageLayoutWithFooter><SupportPage /></PageLayoutWithFooter>} />
                    <Route path="/terms" element={<PageLayoutWithFooter><TermsPage /></PageLayoutWithFooter>} />
                    <Route path="/privacy" element={<PageLayoutWithFooter><PrivacyPage /></PageLayoutWithFooter>} />
                    <Route path="/email-change" element={<EmailChange />} />
                    <Route path="/reset-password" element={<PasswordResetPage />} />

                    <Route path="*" element={<PageLayoutWithFooter><Error404 /></PageLayoutWithFooter>} />
                  </Routes>
                </main>
              </div>
            </Router>

            <AudioPlayer />
            <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
            <CookieConsentBanner />
          </div>
        </NotificationProvider>
      </AudioPlayerProvider>
    </ModalProvider>
  );
};

export default App;

