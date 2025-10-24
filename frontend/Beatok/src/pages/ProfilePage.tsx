import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { userService } from '../services/userService';
import { beatService } from '../services/beatService';
import { getAvatarUrl } from '../utils/getAvatarURL';
import AuthModal from '../components/AuthModal';
import BeatTable from '../components/UI/beats/BeatTable';
import BeatList from '../components/UI/beats/BeatList';
import RejectionReasonModal from '../components/RejectionReasonModal';
import type { User } from '../types/auth';
import type { Beat } from '../types/Beat';
import Filter from '../components/UI/beats/Filter';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  birthday: Date | null;
  balance: number;
  avatar_path?: string;
  is_active?: boolean;
  date_of_reg: Date | null;
  last_login: Date | null;
  download_count?: number;
  description?: string;
}

const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const isOwnProfile = !id;
  const profileUserId = id ? parseInt(id) : null;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [avatarUpdateKey, setAvatarUpdateKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'info' | 'balance' | 'mybeats' | 'stats'>(
    isOwnProfile ? 'info' : 'mybeats'
  );

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    birthday: '',
    description: '',
  });

  const [myBeats, setMyBeats] = useState<Beat[]>([]);
  const [beatsLoading, setBeatsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [filters, setFilters] = useState({
    name: '',
    author: '',
    genre: '',
    bpm: '',
    key: '',
    freeOnly: false,
    minPrice: '',
    maxPrice: '',
  });
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedBeat, setSelectedBeat] = useState<Beat | null>(null);
  const [userStats, setUserStats] = useState<{
    beats_count: number;
    sold_count: number;
    download_count: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const getCurrentUser = (): UserProfile | null => {
    try {
      const userData = localStorage.getItem('user_info');
      const token = localStorage.getItem('access_token');

      if (!userData || !token) {
        return null;
      }

      const parsed = JSON.parse(userData);
      if (parsed.birthday) {
        parsed.birthday = new Date(parsed.birthday);
      }
      if (parsed.date_of_reg) {
        parsed.date_of_reg = new Date(parsed.date_of_reg);
      } else {
        parsed.date_of_reg = null;
      }
      if (parsed.last_login) {
        parsed.last_login = new Date(parsed.last_login);
      } else {
        parsed.last_login = null;
      }
      return parsed;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  };

  const updateUserInStorage = (userData: Partial<UserProfile>) => {
    try {
      const currentUser = getCurrentUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...userData };
        localStorage.setItem('user_info', JSON.stringify(updatedUser));
        setUser(updatedUser);
        window.dispatchEvent(new Event('userUpdated'));
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handlePlayBeat = (beat: Beat) => {
    console.log('Play beat:', beat);
  };

  const handleDownloadBeat = (beat: Beat) => {
    console.log('Download beat:', beat);
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['info', 'balance', 'mybeats', 'stats'].includes(tab)) {
      setActiveTab(tab as 'info' | 'balance' | 'mybeats' | 'stats');
    } else {
      setActiveTab(isOwnProfile ? 'info' : 'mybeats');
    }
  }, [searchParams, isOwnProfile]);

  useEffect(() => {
    loadUserProfile();
  }, [id]);

  useEffect(() => {
    if (user && myBeats.length === 0) {
      loadMyBeats();
    }
  }, [user]);

  useEffect(() => {
    if (user && activeTab === 'stats' && !userStats) {
      loadUserStats();
    }
  }, [user, activeTab, userStats]);

  const loadMyBeats = async () => {
    if (!user) return;

    try {
      setBeatsLoading(true);
      const beats = await beatService.getUserBeats(user.id);
      const filteredBeats = isOwnProfile ? beats : beats.filter(beat => beat.status === 'available');
      setMyBeats(filteredBeats);
    } catch (error) {
      console.error('Failed to load user beats:', error);
    } finally {
      setBeatsLoading(false);
    }
  };

  const loadUserStats = async () => {
    if (!user) return;

    try {
      setStatsLoading(true);
      const stats = await userService.getUserStats(user.id);
      setUserStats(stats);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      if (isOwnProfile) {
        const currentUser = getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setFormData({
            username: currentUser.username,
            email: currentUser.email,
            birthday: currentUser.birthday ? currentUser.birthday.toISOString().split('T')[0] : '',
            description: currentUser.description || '',
          });

          try {
            const userProfile = await userService.getUserProfile(currentUser.id);
            if (userProfile.birthday && typeof userProfile.birthday === 'string') {
              userProfile.birthday = new Date(userProfile.birthday);
            }
            if (userProfile.date_of_reg && typeof userProfile.date_of_reg === 'string') {
              userProfile.date_of_reg = new Date(userProfile.date_of_reg);
            }
            userProfile.date_of_reg = userProfile.date_of_reg ?? null;
            if (userProfile.last_login && typeof userProfile.last_login === 'string') {
              userProfile.last_login = new Date(userProfile.last_login);
            }
            userProfile.last_login = userProfile.last_login ?? null;
            setUser(userProfile);
            updateUserInStorage(userProfile);
          } catch (error) {
            console.error('Failed to update user profile:', error);
          }
        }
      } else {
        if (profileUserId) {
          try {
            const userProfile = await userService.getUserProfile(profileUserId);
            if (userProfile.birthday && typeof userProfile.birthday === 'string') {
              userProfile.birthday = new Date(userProfile.birthday);
            }
            if (userProfile.date_of_reg && typeof userProfile.date_of_reg === 'string') {
              userProfile.date_of_reg = new Date(userProfile.date_of_reg);
            }
            userProfile.date_of_reg = userProfile.date_of_reg ?? null;
            if (userProfile.last_login && typeof userProfile.last_login === 'string') {
              userProfile.last_login = new Date(userProfile.last_login);
            }
            userProfile.last_login = userProfile.last_login ?? null;
            setUser(userProfile);
          } catch (error) {
            console.error('Failed to load user profile:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        birthday: user.birthday ? user.birthday.toISOString().split('T')[0] : '',
        description: user.description || '',
      });
    }
  };

  const handleSave = async () => {
  try {
    setSaving(true);

    if (!user) return;

    const updateData: any = {
      username: formData.username,
      email: formData.email,
      description: formData.description,
    };

    if (formData.birthday) {
      updateData.birthday = formData.birthday;
    } else {
      updateData.birthday = null;
    }

    console.log('Saving data:', updateData);

    await userService.updateUserProfile(user.id, updateData);

    updateUserInStorage({
      username: formData.username,
      email: formData.email,
      birthday: formData.birthday ? new Date(formData.birthday) : null,
      description: formData.description,
    });

    setEditing(false);
  } catch (error) {
    console.error('Failed to update user:', error);
    alert('Ошибка при сохранении данных');
  } finally {
    setSaving(false);
  }
};

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Разрешены только файлы JPG, PNG и GIF');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Размер файла не должен превышать 5MB');
        return;
      }

      const avatarFormData = new FormData();
      avatarFormData.append('file', file);

      const response = await userService.uploadAvatar(user.id, avatarFormData);
      updateUserInStorage({ avatar_path: response.avatar_path });
      setAvatarUpdateKey(prev => prev + 1);

    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Ошибка при загрузке аватарки');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleShowRejectionReason = (beat: Beat) => {
    setSelectedBeat(beat);
    setRejectionModalOpen(true);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Не указана';
    if (!(date instanceof Date)) return 'Не указана';
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <>
      {(() => {
        if (!user && !loading) {
          return (
            <div className="min-h-screen bg-neutral-925 flex items-center justify-center fixed inset-0 overflow-hidden">
              <div className="text-center">
                <div className="text-white text-xl mb-6 select-none">Вы не авторизованы</div>
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="bg-red-600 select-none cursor-pointer hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Войти
                </button>
              </div>
            </div>
          );
        }

        if (loading) {
          return (
            <div className="min-h-screen bg-neutral-900 flex items-center justify-center fixed inset-0 overflow-hidden">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          );
        }

        if (!user) {
          return (
            <div className="min-h-screen bg-neutral-900 flex items-center justify-center fixed inset-0 overflow-hidden">
              <div className="text-white text-xl">Пользователь не найден</div>
            </div>
          );
        }

        return (
          <div className="min-h-screen overflow-y-auto">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="mb-8 text-center select-none">
                <h1 className="text-3xl font-bold text-white mx-auto flex items-center justify-center gap-3">
                  {isOwnProfile ? (
                    `Привет, ${user.username}!`
                  ) : (
                    <>
                      <img
                        src={getAvatarUrl(user.id, user.avatar_path)}
                        alt="Аватар"
                        className="w-8 h-8 rounded-full object-cover border border-neutral-600 mt-1"
                        onError={(e) => {
                          e.currentTarget.src = 'http://localhost:8000/static/default_avatar.png';
                        }}
                      />
                      {user.username}
                    </>
                  )}
                </h1>
              </div>

              <div className={`grid gap-8 min-h-125 ${activeTab === 'mybeats' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
                <div className={`bg-neutral-900 rounded-lg p-6 border border-neutral-700 min-h-125 ${activeTab === 'mybeats' ? 'hidden' : ''} transition-all duration-700 ease-in-out`}>
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative group select-none">
                      <img
                        src={getAvatarUrl(user.id, user.avatar_path)}
                        alt="Аватар"
                        className="w-32 h-32 rounded-full object-cover border-4 border-neutral-700 select-none"
                        onError={(e) => {
                          e.currentTarget.src = 'http://localhost:8000/static/default_avatar.png';
                        }}
                      />
                    </div>

                    <div className="text-center mt-4">
                      <h2 className="text-xl font-semibold text-white">{user.username}</h2>
                      {isOwnProfile && (
                        <p className="text-neutral-400 text-sm mt-1">ID: #{user.id}</p>
                      )}
                    </div>

                    {isOwnProfile && (
                      <>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleAvatarUpload}
                          accept="image/jpeg,image/png,image/gif"
                          className="hidden"
                        />

                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="mt-4 select-none bg-red-600 hover:bg-red-700 text-white px-4 py-2 cursor-pointer rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploading ? 'Загрузка...' : 'Сменить аватар'}
                        </button>

                        <p className="text-xs text-neutral-400 mt-2 text-center select-none">
                          JPG, PNG или GIF, не более 5MB
                        </p>
                      </>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-neutral-400 text-sm font-medium">
                        Описание
                      </label>
                      {isOwnProfile && !editing && (
                        <button
                          onClick={handleEdit}
                          className="text-red-500 cursor-pointer select-none hover:text-red-400 text-sm transition-colors"
                        >
                          Редактировать
                        </button>
                      )}
                    </div>
                    
                    {isOwnProfile && editing ? (
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500 resize-none text-sm"
                        placeholder="Расскажите о себе..."
                      />
                    ) : (
                      <div className="text-white text-sm bg-neutral-800 p-3 rounded-lg min-h-[100px] whitespace-pre-wrap">
                        {user.description || 'Не указано'}
                      </div>
                    )}
                  </div>
                </div>

                <div className={`${activeTab === 'mybeats' ? '' : 'lg:col-span-2'} transition-all duration-700 ease-in-out`}>
                  <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-700 min-h-125">

                    <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700 mb-6">
                      <div className="flex space-x-4 justify-center">
                        {isOwnProfile && (
                          <button
                            onClick={() => {
                              setActiveTab('info');
                              setSearchParams({ tab: 'info' });
                            }}
                            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer select-none ${
                              activeTab === 'info'
                                ? 'bg-red-600 text-white'
                                : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                            }`}
                          >
                            Основная информация
                          </button>
                        )}
                        {isOwnProfile && (
                          <button
                            onClick={() => {
                              setActiveTab('balance');
                              setSearchParams({ tab: 'balance' });
                            }}
                            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer select-none ${
                              activeTab === 'balance'
                                ? 'bg-red-600 text-white'
                                : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                            }`}
                          >
                            Баланс
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setActiveTab('mybeats');
                            setSearchParams({ tab: 'mybeats' });
                          }}
                          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer select-none ${
                            activeTab === 'mybeats'
                              ? 'bg-red-600 text-white'
                              : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                          }`}
                        >
                          {isOwnProfile ? 'Мои биты' : 'Биты'}
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('stats');
                            setSearchParams({ tab: 'stats' });
                          }}
                          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer select-none ${
                            activeTab === 'stats'
                              ? 'bg-red-600 text-white'
                              : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                          }`}
                        >
                          Статистика
                        </button>
                      </div>
                    </div>

                    {activeTab === 'info' && isOwnProfile && (
                      <div>
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-xl font-semibold text-white">Основная информация</h2>
                          {!editing ? (
                            <button
                              onClick={handleEdit}
                              className="bg-red-600 select-none cursor-pointer hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                              Редактировать
                            </button>
                          ) : (
                            <div className="flex space-x-2">
                              <button
                                onClick={handleCancel}
                                className="bg-neutral-700 hover:bg-neutral-600 select-none cursor-pointer text-white px-4 py-2 rounded-lg transition-colors"
                              >
                                Отмена
                              </button>
                              <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-green-600 select-none cursor-pointer hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {saving ? 'Сохранение...' : 'Сохранить'}
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div>
                            <label className="block text-neutral-400 text-sm font-medium mb-2">
                              Имя пользователя
                            </label>
                            {editing ? (
                              <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                              />
                            ) : (
                              <div className="text-white text-lg">{user.username}</div>
                            )}
                          </div>
                          <hr className='text-neutral-600' />
                          <div>
                            <label className="block text-neutral-400 text-sm font-medium mb-2">
                              Email
                            </label>
                            {editing ? (
                              <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                              />
                            ) : (
                              <div className="text-white text-lg">{user.email}</div>
                            )}
                          </div>
                          <hr className='text-neutral-600' />
                          <div>
                            <label className="block text-neutral-400 text-sm font-medium mb-2">
                              Дата рождения
                            </label>
                            {editing ? (
                              <input
                                type="date"
                                name="birthday"
                                value={formData.birthday}
                                onChange={handleInputChange}
                                className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                              />
                            ) : (
                              <div className="text-white text-lg">{formatDate(user.birthday)}</div>
                            )}
                          </div>
                          <hr className='text-neutral-600' />
                          <div>
                            <label className="block text-neutral-400 text-sm font-medium mb-2">
                              Статус
                            </label>
                            <div className="text-green-500 text-lg">Активен</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'balance' && isOwnProfile && (
                      <div>
                        <h2 className="text-xl font-semibold text-white mb-2">Баланс</h2>
                        <div className="space-y-6">
                          <div className="bg-neutral-750 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-neutral-400">Текущий баланс:</span>
                              <span className="text-white text-2xl font-bold">{user.balance.toFixed(2)} ₽</span>
                            </div>
                            <div className="flex space-x-4">
                              <button
                                onClick={() => alert('Функция пополнения баланса будет реализована позже')}
                                className="flex-1 bg-white hover:bg-gray-300 text-red-600 px-4 py-2 select-none cursor-pointer rounded-lg transition-colors"
                              >
                                Пополнить
                              </button>
                              <button
                                onClick={() => alert('Функция вывода средств будет реализована позже')}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 select-none cursor-pointer rounded-lg transition-colors"
                              >
                                Вывести
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'mybeats' && (
                      <div>
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-xl font-semibold text-white">
                            {isOwnProfile ? 'Мои биты' : `Биты ${user.username}`}
                          </h2>
                          {!isOwnProfile && (
                            <div className="text-sm text-neutral-400">
                              {myBeats.length} бит{myBeats.length !== 1 ? 'ов' : ''}
                            </div>
                          )}
                        </div>

                        {beatsLoading ? (
                          <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                          </div>
                        ) : myBeats.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-neutral-400">
                              {isOwnProfile ? 'У вас пока нет загруженных битов' : 'У пользователя нет битов'}
                            </p>
                          </div>
                        ) : viewMode === 'table' ? (
                          <BeatTable 
                            beats={myBeats} 
                            filters={filters} 
                            isProfileView={isOwnProfile}
                            hideAuthorColumn={true}
                            onShowRejectionReason={isOwnProfile ? handleShowRejectionReason : undefined}
                            onPlay={!isOwnProfile ? handlePlayBeat : undefined}
                            onDownload={!isOwnProfile ? handleDownloadBeat : undefined}
                          />
                        ) : (
                          <BeatList 
                            beats={myBeats} 
                            filters={filters} 
                            isProfileView={isOwnProfile}
                            onPlay={!isOwnProfile ? handlePlayBeat : undefined}
                            onDownload={!isOwnProfile ? handleDownloadBeat : undefined}
                          />
                        )}
                      </div>
                    )}

                    {activeTab === 'stats' && (
                      <div>
                        <h2 className="text-xl font-semibold text-white">Статистика</h2>

                        {statsLoading ? (
                          <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="bg-neutral-750 rounded-lg p-4">
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-400">Загружено битов:</span>
                                  <span className="text-white font-semibold">{userStats?.beats_count || myBeats.length}</span>
                                </div>
                                <hr className='text-neutral-600' />
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-400">Скачано битов:</span>
                                  <span className="text-white font-semibold">{userStats?.download_count || user.download_count || 0}</span>
                                </div>
                                <hr className='text-neutral-600' />
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-400">Продано битов:</span>
                                  <span className="text-white font-semibold">{userStats?.sold_count || 0}</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-neutral-750 rounded-lg p-4">
                              <h3 className="text-neutral-400 text-sm font-medium mb-3">Активность</h3>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-400">Последний вход:</span>
                                  <span className="text-white font-semibold">{formatDate(user.last_login)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-400">Регистрация:</span>
                                  <span className="text-white font-semibold">{formatDate(user.date_of_reg)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <RejectionReasonModal
        isOpen={rejectionModalOpen}
        onClose={() => setRejectionModalOpen(false)}
        beat={selectedBeat}
      />
    </>
  );
};

export default ProfilePage;