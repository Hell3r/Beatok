interface UserProfile {
  id: number;
  username: string;
  email: string;
  birthday: Date | null;
  balance: number;
  avatar_path?: string;
  is_active?: boolean;
  date_of_reg: Date | null;
  last_login: Date | null;
  download_count?: number;
  description?: string;
  prom_status?: string;
}

export const getCurrentUser = (): UserProfile | null => {
  try {
    const userData = localStorage.getItem('user_info');
    const token = localStorage.getItem('access_token');

    if (!userData || !token) {
      return null;
    }

    const parsed = JSON.parse(userData);
    if (parsed.birthday) {
      parsed.birthday = new Date(parsed.birthday);
    }
    if (parsed.date_of_reg) {
      parsed.date_of_reg = new Date(parsed.date_of_reg);
    } else {
      parsed.date_of_reg = null;
    }
    if (parsed.last_login) {
      parsed.last_login = new Date(parsed.last_login);
    } else {
      parsed.last_login = null;
    }
    return parsed;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};
