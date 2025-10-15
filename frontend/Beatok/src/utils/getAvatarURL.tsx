export const getAvatarUrl = (userId: number, avatarPath?: string) => {
        if (!avatarPath || avatarPath === 'default_avatar.png' || avatarPath === 'static/default_avatar.png') {
          return 'http://localhost:8000/static/default_avatar.png';
        }
        if (avatarPath.startsWith('http')) {
          return avatarPath;
        }
        return `http://localhost:8000/v1/users/${userId}/avatar`;
    };
