import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import './index.css';
import BeatsPage from './pages/BeatsPage';
import Profile from './pages/Profile';

const App: React.FC = () => {
  const isUserAuthenticated = !!localStorage.getItem('access_token');

  return (
    <Router>
      <div className="min-h-screen bg-[#0f0f0f] text-[#e5e5e5]">
        <Header isAuthenticated={isUserAuthenticated} />
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<BeatsPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/library" element={<BeatsPage />} />
            <Route path="/about" element={<BeatsPage />} />

            <Route path="*" element={<div className="text-center py-12"><h1 className="text-2xl">Страница не найдена</h1></div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;