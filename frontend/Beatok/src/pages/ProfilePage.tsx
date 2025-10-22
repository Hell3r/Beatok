import React, { useState, useEffect, useRef } from 'react';
import { userService } from '../services/userService';
import { beatService } from '../services/beatService';
import { getAvatarUrl } from '../utils/getAvatarURL';
import AuthModal from '../components/AuthModal';
import BeatTable from '../components/UI/beats/BeatTable';
import BeatList from '../components/UI/beats/BeatList';
import ViewToggle from '../components/UI/beats/ViewToggle';
import RejectionReasonModal from '../components/RejectionReasonModal';
import type { User } from '../types/auth';
import type { Beat } from '../types/Beat';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  birthday: Date | null;
  balance: number;
  avatar_path?: string;
  is_active?: boolean;
}

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [avatarUpdateKey, setAvatarUpdateKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'info' | 'balance' | 'mybeats' | 'stats'>('info');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    birthday: '',
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
      return parsed;
    } catch (error) {
        console.error('Failed to update user:', error);
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

  const handleAuthClick = () => {
    console.log('handleAuthClick called, currentUser:', currentUser);
    console.log('authModalOpen before:', authModalOpen);
    if (currentUser) {
      handleLogout();
    } else {
      console.log('Opening auth modal');
      setAuthModalOpen(true);
      console.log('authModalOpen after:', authModalOpen);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        await fetch('http://localhost:8000/api/v1/users/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_info');
      setCurrentUser(null);
      window.location.reload();
    }

  };

  useEffect(() => {
    loadUserProfile();
  }, []);



  useEffect(() => {
    if (activeTab === 'mybeats' && user && myBeats.length === 0) {
      loadMyBeats();
    }
  }, [activeTab, user]);

  const loadMyBeats = async () => {
    if (!user) return;

    try {
      setBeatsLoading(true);
      const beats = await beatService.getUserBeats(user.id);
      setMyBeats(beats);
    } catch (error) {
      console.error('Failed to load user beats:', error);
    } finally {
      setBeatsLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const currentUser = getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        setFormData({
          username: currentUser.username,
          email: currentUser.email,
          birthday: currentUser.birthday ? currentUser.birthday.toISOString().split('T')[0] : '',
        });

        try {
          const userProfile = await userService.getUserProfile(currentUser.id);
          if (userProfile.birthday && typeof userProfile.birthday === 'string') {
            userProfile.birthday = new Date(userProfile.birthday);
          }
          setUser(userProfile);
          updateUserInStorage(userProfile);
        } catch (error) {
            console.error('Failed to update user:', error);
        }
      }
    } catch (error) {
        console.error('Failed to update user:', error);
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
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!user) return;

      await userService.updateUserProfile(user.id, {
        username: formData.username,
        email: formData.email,
        birthday: formData.birthday ? new Date(formData.birthday) : null,
      });

      updateUserInStorage({
        username: formData.username,
        email: formData.email,
        birthday: formData.birthday ? new Date(formData.birthday) : null,
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

      const formData = new FormData();
      formData.append('file', file);

      const response = await userService.uploadAvatar(user.id, formData);
      updateUserInStorage({ avatar_path: response.avatar_path });
      setAvatarUpdateKey(prev => prev + 1);

    } catch (error) {
        console.error('Failed to update user:', error);
      alert('Ошибка при загрузке аватарки');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
                  onClick={handleAuthClick}
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
                <h1 className="text-3xl font-bold text-white mx-auto">Привет, {user.username}!</h1>
              </div>

              <div className={`grid gap-8 min-h-125 ${activeTab === 'mybeats' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
                <div className={`bg-neutral-900 rounded-lg p-6 border border-neutral-700 min-h-125 ${activeTab === 'mybeats' ? 'hidden' : ''} transition-all duration-700 ease-in-out`}>
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative group select-none">
                      <img
                        src={`${getAvatarUrl(user.id, user.avatar_path)}?key=${avatarUpdateKey}`}
                        alt="Аватар"
                        className="w-32 h-32 rounded-full object-cover border-4 border-neutral-700 select-none"
                        onError={(e) => {
                          e.currentTarget.src = 'http://localhost:8000/static/default_avatar.png';
                        }}
                      />
                    </div>

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
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400">ID:</span>
                      <span className="text-white font-bold">#{user.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400">Баланс:</span>
                      <span className="text-white font-bold">{user.balance.toFixed(2)} ₽</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400">Статус:</span>
                      <span className="text-green-500">Активен</span>
                    </div>
                  </div>
                </div>

                <div className={`${activeTab === 'mybeats' ? '' : 'lg:col-span-2'} transition-all duration-700 ease-in-out`}>
                  <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-700 min-h-125">
                    <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700 mb-6">
                      <div className="flex space-x-4 justify-center">
                        <button
                          onClick={() => setActiveTab('info')}
                          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer select-none ${
                            activeTab === 'info'
                              ? 'bg-red-600 text-white'
                              : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                          }`}
                        >
                          Основная информация
                        </button>
                        <button
                          onClick={() => setActiveTab('balance')}
                          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer select-none ${
                            activeTab === 'balance'
                              ? 'bg-red-600 text-white'
                              : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                          }`}
                        >
                          Баланс
                        </button>
                        <button
                          onClick={() => setActiveTab('mybeats')}
                          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer select-none ${
                            activeTab === 'mybeats'
                              ? 'bg-red-600 text-white'
                              : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                          }`}
                        >
                          Мои биты
                        </button>
                        <button
                          onClick={() => setActiveTab('stats')}
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

                    {activeTab === 'info' && (
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

                        <div className="space-y-6">
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
                        </div>
                      </div>
                    )}

                    {activeTab === 'balance' && (
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
                          <h2 className="text-xl font-semibold text-white">Мои биты</h2>
                        </div>

                        {beatsLoading ? (
                          <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                          </div>
                        ) : myBeats.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-neutral-400">У вас пока нет загруженных битов</p>
                          </div>
                        ) : viewMode === 'table' ? (
                          <BeatTable beats={myBeats} filters={filters} isProfileView={true} onShowRejectionReason={handleShowRejectionReason} />
                        ) : (
                          <BeatList beats={myBeats} filters={filters} />
                        )}
                      </div>
                    )}

                    {activeTab === 'stats' && (
                      <div>
                        <h2 className="text-xl font-semibold text-white">Статистика</h2>

                        <div className="space-y-6">
                          <div className="bg-neutral-750 rounded-lg p-4">
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-400">Загружено битов:</span>
                                <span className="text-white font-semibold">{myBeats.length}</span>
                              </div>
                              <hr className='text-neutral-600' />
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-400">Скачано битов:</span>
                                <span className="text-white font-semibold">0</span>
                              </div>
                              <hr className='text-neutral-600' />
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-400">Продано битов:</span>
                                <span className="text-white font-semibold">0</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-neutral-750 rounded-lg p-4">
                            <h3 className="text-neutral-400 text-sm font-medium mb-3">Активность</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-400">Последний вход:</span>
                                <span className="text-white font-semibold">Сегодня</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-400">Регистрация:</span>
                                <span className="text-white font-semibold">{formatDate(user.birthday)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
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
        onClose={() => {
          console.log('Closing auth modal');
          setAuthModalOpen(false);
        }}
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