<<<<<<< HEAD
=======
export interface Tag {
  id: number;
  name: string;
}

>>>>>>> b93147bfd45a5b514323ad6f3ceb1df508dc4ced
export interface Beat {
  id: number;
  name: string;
  author_id: number;
  mp3_path?: string;
  wav_path?: string;
<<<<<<< HEAD
=======
  cover_path?: string;
>>>>>>> b93147bfd45a5b514323ad6f3ceb1df508dc4ced
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
<<<<<<< HEAD
=======
  terms_of_use?: {
    recording_tracks: boolean;
    commercial_perfomance: boolean;
    rotation_on_the_radio: boolean;
    music_video_recording: boolean;
    release_of_copies: boolean;
  };
  tags?: Tag[];
>>>>>>> b93147bfd45a5b514323ad6f3ceb1df508dc4ced
}

export interface BeatPricing {
  id: number;
  beat_id: number;
  tariff_name: string;
  tariff_display_name?: string;
  price: number | null;
  is_available: boolean;
}
