export interface User {
  id: number;
  username: string;
  email: string;
  birthday?: string;
  avatar_path?: string;
  is_active?: boolean;
}