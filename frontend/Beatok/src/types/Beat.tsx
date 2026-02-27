export interface Tag {
  id: number;
  name: string;
}

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
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  owner?: {
    id: number;
    username: string;
    avatar_path?: string;
  };
  author?: {
    id: number;
    username: string;
    avatar_path?: string;
  };
  user?: {
    id: number;
    username: string;
    avatar_path?: string;
  };
  pricings?: BeatPricing[];
  terms_of_use?: {
    recording_tracks: boolean;
    commercial_perfomance: boolean;
    rotation_on_the_radio: boolean;
    music_video_recording: boolean;
    release_of_copies: boolean;
  };
  tags?: Tag[];
}

export interface BeatPricing {
  id: number;
  beat_id: number;
  tariff_name: string;
  tariff_display_name?: string;
  price: number | null;
  is_available: boolean;
}