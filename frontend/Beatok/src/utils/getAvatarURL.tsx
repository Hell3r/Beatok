export const getAvatarUrl = (userId: number, avatarPath?: string | null) => {
  if (!avatarPath || avatarPath === 'default_avatar.png' || avatarPath === 'static/default_avatar.png' || avatarPath === 'static/default_avatar.jpg') {
    return `https://ui-avatars.com/api/?name=User&size=20&background=374151&color=white`;
  }
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  if (avatarPath.startsWith('static/avatars/')) {
    return `http://localhost:8000/${avatarPath}`;
  }
  return `http://localhost:8000/static/avatars/${avatarPath}`;
};
