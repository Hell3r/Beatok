export const authService = {
  async login(email: string, password: string) {
    const response = await fetch('http://localhost:8000/v1/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: email,
        password: password
      })
    });

    if (!response.ok) {
      throw new Error('Ошибка авторизации');
    }

    return response.json();
  },


  async register(userData: unknown) {
    const response = await fetch('http://localhost:8000/v1/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error('Ошибка регистрации');
    }

    return response.json();
  },

  async logout(token: string) {
    const response = await fetch('http://localhost:8000/v1/users/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Ошибка выхода');
    }

    return response.json();
  }
};