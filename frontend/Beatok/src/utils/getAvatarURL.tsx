import { apiUrl } from '../services/api';
export const getAvatarUrl = (userId: number, avatarPath?: string | null) => {
  if (!avatarPath || avatarPath === 'default_avatar.png' || avatarPath === 'static/default_avatar.png' || avatarPath === 'static/default_avatar.jpg') {
    return apiUrl(`/static/default_avatar.png`);
  }
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  if (avatarPath.startsWith('static/avatars/')) {
    return apiUrl(`/${avatarPath}`);
  }
  return apiUrl(`/static/avatars/${avatarPath}`);
};
