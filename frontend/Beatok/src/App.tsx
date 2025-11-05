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
import AboutPage from './pages/AboutPage';
import Error404 from './pages/errors/404';
import BeatmakersPage from './pages/BeatmakersPage';
import ForumPage from './pages/ForumPage';
import AdminSwaggerPage from './pages/AdminSwaggerPage';
import SupportPage from './pages/SupportPage';

const PageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="container mx-auto px-4 py-8">
    {children}
  </div>
);

const PageLayoutWithFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="container mx-auto px-4 pt-8">
    {children}
    <Footer />
  </div>
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

  const isUserAuthenticated = !!localStorage.getItem('access_token');

  return (
    <ModalProvider>
      <AudioPlayerProvider>
        <NotificationProvider>
          <div className="min-h-screen bg-[#0f0f0f] text-[#e5e5e5]">
            <Router>
              <Header isAuthenticated={isUserAuthenticated} />

              <main>
                <Routes>
                  <Route path="/" element={<HomePage />} />

                  <Route path="/admin" element={<AdminSwaggerPage />} />
                  <Route path="/profile" element={isUserAuthenticated ? <PageLayoutWithFooter><ProfilePage /></PageLayoutWithFooter> : <PageLayout><ProfilePage /></PageLayout>} />
                  <Route path="/profile/:id" element={isUserAuthenticated ? <PageLayoutWithFooter><ProfilePage /></PageLayoutWithFooter> : <PageLayout><ProfilePage /></PageLayout>} />
                  <Route path="/beats" element={<PageLayoutWithFooter><BeatsPage /></PageLayoutWithFooter>} />
                  <Route path="/about" element={<PageLayoutWithFooter><AboutPage /></PageLayoutWithFooter>} />
                  <Route path="/beatmakers" element={<PageLayoutWithFooter><BeatmakersPage /></PageLayoutWithFooter>} />
                  <Route path="/forum" element={<PageLayout><ForumPage /></PageLayout>} />
                  <Route path="/support" element={<PageLayoutWithFooter><SupportPage /></PageLayoutWithFooter>} />

                  <Route path="*" element={<PageLayoutWithFooter><Error404 /></PageLayoutWithFooter>} />
                </Routes>
              </main>
            </Router>

            <AudioPlayer />
            <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
          </div>
        </NotificationProvider>
      </AudioPlayerProvider>
    </ModalProvider>
  );
};

export default App;
