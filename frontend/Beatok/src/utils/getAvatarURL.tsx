export const getAvatarUrl = (userId: number, avatarPath?: string | null) => {
  if (!avatarPath || avatarPath === 'default_avatar.png' || avatarPath === 'static/default_avatar.png' || avatarPath === 'static/default_avatar.jpg') {
    return `https://beatokservice.ru/api/static/default_avatar.png`;
  }
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  if (avatarPath.startsWith('static/avatars/')) {
    return `https://beatokservice.ru/${avatarPath}`;
  }
  return `https://beatokservice.ru/api/static/avatars/${avatarPath}`;
};
