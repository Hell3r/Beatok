import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import './index.css';
import BeatsPage from './pages/BeatsPage';
import ProfilePage from './pages/ProfilePage';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import Error404 from './pages/errors/404';
import BeatmakersPage from './pages/BeatmakersPage';
import ChartPage from './pages/ChartPage';
import ForumPage from './pages/ForumPage';
import AdminSwaggerPage from './pages/AdminSwaggerPage';
import SupportPage from './pages/SupportPage';

const PageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="container mx-auto px-4 py-8">
    {children}
  </div>
);

const App: React.FC = () => {
  const isUserAuthenticated = !!localStorage.getItem('access_token');

  return (
    <Router>
      <div className="min-h-screen bg-[#0f0f0f] text-[#e5e5e5]">
        <Header isAuthenticated={isUserAuthenticated} />
        
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />

            <Route path="/admin" element={<AdminSwaggerPage />} />
            <Route path="/profile" element={<PageLayout><ProfilePage /></PageLayout>} />
            <Route path="/beats" element={<PageLayout><BeatsPage /></PageLayout>} />
            <Route path="/about" element={<PageLayout><AboutPage /></PageLayout>} />
            <Route path="/beatmakers" element={<PageLayout><BeatmakersPage /></PageLayout>} />
            <Route path="/chart" element={<PageLayout><ChartPage /></PageLayout>} />
            <Route path="/forum" element={<PageLayout><ForumPage /></PageLayout>} />
            <Route path="/support" element={<PageLayout><SupportPage /></PageLayout>} />

            <Route path="*" element={<PageLayout><Error404 /></PageLayout>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;