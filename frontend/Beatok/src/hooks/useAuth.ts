import { useState, useEffect } from 'react';
import type { User } from '../types/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
      try {
        setUser(JSON.parse(userInfo));
      } catch (error) {
        console.error('Error parsing user info:', error);
      }
    }
  }, []);

  const isAdmin = user?.role === 'admin';

  return { user, isAdmin };
};
