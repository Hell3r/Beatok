import React, { useState, useEffect } from 'react';
import type { User } from '../types/auth';

const Admin: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
      try {
        setCurrentUser(JSON.parse(userInfo));
      } catch (error) {
        console.error('Error parsing user info:', error);
      }
    }
  }, []);




  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center select-none">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Доступ запрещен</h1>
          <p className="text-gray-300">У вас нет прав для просмотра этой страницы.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-neutral-800 rounded-lg p-4">
        админка
      </div>
    </div>
  );
};

export default Admin;