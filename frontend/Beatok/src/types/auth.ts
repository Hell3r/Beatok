export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  birthday: string;
  avatar_path?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthday: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_info?: {
    email: string;
    user_id: number;
    username?: string
  };
  user?: User;
}