import React from 'react';
import Header from './components/Header';
import './index.css';
import BeatsPage from './pages/BeatsPage';


const App: React.FC = () => {
  const isUserAuthenticated = false;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e5e5e5]">
      <Header isAuthenticated={isUserAuthenticated} />
      
      <main className="container mx-auto px-4 py-8">
        <BeatsPage>
          
        </BeatsPage>
      </main>
    </div>
  );
};

export default App;