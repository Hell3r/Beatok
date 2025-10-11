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
import FreeBeatsPage from './pages/FreeBeatsPage';
import ForumPage from './pages/ForumPage';
import AdminDashboard from './pages/AdminDashboard';

const App: React.FC = () => {
  const isUserAuthenticated = !!localStorage.getItem('access_token');

  return (
    <Router>
      <div className="min-h-screen bg-[#0f0f0f] text-[#e5e5e5]">
        <Header isAuthenticated={isUserAuthenticated} />
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/beats" element={<BeatsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/beatmakers" element={<BeatmakersPage />} />
            <Route path="/chart" element={<ChartPage />} />
            <Route path="/freebeats" element={<FreeBeatsPage />} />
            <Route path="/forum" element={<ForumPage />} />

            <Route path="/admin" element={<AdminDashboard />} />

            <Route path="*" element={<Error404 />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;