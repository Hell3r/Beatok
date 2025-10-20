export interface Beat {
  id: number;
  name: string;
  author_id: number;
  mp3_path?: string;
  wav_path?: string;
  genre: string;
  tempo: number;
  key: string;
  size: number;
  duration: number;
  promotion_status: string;
  status: string;
  created_at: string;
  updated_at: string;
  owner?: {
    id: number;
    username: string;
  };
  author?: {
    id: number;
    username: string;
  };
  user?: {
    id: number;
    username: string;
  };
  pricings?: BeatPricing[];
}

export interface BeatPricing {
  id: number;
  beat_id: number;
  tariff_name: string;
  tariff_display_name?: string;
  price: number | null;
  is_available: boolean;
}
