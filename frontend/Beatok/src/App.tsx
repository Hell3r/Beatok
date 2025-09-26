import React from 'react';
import Header from './components/Header';
import './index.css';

const App: React.FC = () => {
  const isUserAuthenticated = false;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e5e5e5]">
      <Header isAuthenticated={isUserAuthenticated} />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">Добро пожаловать в BEATOK</h1>
        <p className="text-gray-400">Здесь начинается ваша музыка.</p>
      </main>
    </div>
  );
};

export default App;