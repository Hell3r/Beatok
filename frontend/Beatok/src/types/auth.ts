export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  birthday: string;
  avatar_path?: string;
  balance?: number;
  role: string;
  date_of_reg?: string;
  last_login?: string;
  description?: string;
  prom_status?: string;
  agreed_to_offer?: boolean;
  agreed_to_privacy_policy?: boolean;
  agreed_to_terms?: boolean;
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
  agreed_to_offer: boolean;
  agreed_to_privacy_policy: boolean;
  agreed_to_terms: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_info?: {
    email: string;
    user_id: number;
    username?: string;
    role?: string;
    birthday?: string;
    avatar_path?: string;
    balance?: number;
    prom_status?: string;
  };
  user?: User;
}
