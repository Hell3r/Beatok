export interface User {
  id: number;
  username: string;
  email: string;
  birthday?: string;
  avatar_path?: string;
  balance?: number;
  is_active?: boolean;
  description?: string;
}
