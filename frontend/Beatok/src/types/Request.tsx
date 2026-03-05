export interface Request {
  id: number;
  title: string;
  description: string;
  problem_type: string;
  status: string;
  response?: string | null;
  response_at?: string | null;
  created_at: string;
  user_id: number;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}
