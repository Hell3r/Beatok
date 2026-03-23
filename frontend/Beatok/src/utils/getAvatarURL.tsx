export const getAvatarUrl = (userId: number, avatarPath?: string | null) => {
  if (!avatarPath || avatarPath === 'default_avatar.png' || avatarPath === 'static/default_avatar.png' || avatarPath === 'static/default_avatar.jpg') {
    return `http://185.55.59.6:8000/static/default_avatar.png`;
  }
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  if (avatarPath.startsWith('static/avatars/')) {
    return `http://185.55.59.6:8000/${avatarPath}`;
  }
  return `http://185.55.59.6:8000/static/avatars/${avatarPath}`;
};
