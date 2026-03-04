import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useSpring, animated } from '@react-spring/web';
import { userService } from '../services/userService';
import { beatService } from '../services/beatService';
import { requestService } from '../services/requestService';
import { getAvatarUrl } from '../utils/getAvatarURL';
import { getCurrentUser } from '../utils/getCurrentUser';
import AuthModal from '../components/AuthModal';
import BeatTable from '../components/UI/beats/BeatTable';
import BeatList from '../components/UI/beats/BeatList';
import RejectionReasonModal from '../components/RejectionReasonModal';
import DepositModal from '../components/DepositModal';
import WithdrawalModal from '../components/WithdrawalModal';
import { useNotificationContext } from '../components/NotificationProvider';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import type { Beat } from '../types/Beat';
import RoleBadge from '../components/UI/RoleBadge';

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
  prom_status?: string;
  role?: string;
}

const ProfilePage: React.FC = () => {
  const { showSuccess, showError } = useNotificationContext();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isOwnProfile = !id;
  const profileUserId = id ? parseInt(id) : null;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'balance' | 'mybeats' | 'stats' | 'favorites' | 'history' | 'requests'>('info');
  const [viewMode, setViewMode] = useState<'tabs' | 'content'>('tabs');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    birthday: '',
    description: '',
  });

  const [myBeats, setMyBeats] = useState<Beat[]>([]);
  const [beatsLoading, setBeatsLoading] = useState(false);
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
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [selectedBeat, setSelectedBeat] = useState<Beat | null>(null);
  const [userStats, setUserStats] = useState<{
    beats_count: number;
    sold_count: number;
    download_count: number;
    liked_beats_count: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [favoriteBeats, setFavoriteBeats] = useState<Beat[]>([]);
  const [favoriteBeatsLoading, setFavoriteBeatsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const [userRequests, setUserRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1280);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const leftPanelSpring = useSpring({
    opacity: (activeTab === 'mybeats' || activeTab === 'favorites') ? 0 : 1,
    width: (activeTab === 'mybeats' || activeTab === 'favorites') ? '0%' : '33%',
    scale: (activeTab === 'mybeats' || activeTab === 'favorites') ? 0.9 : 1,
    config: { tension: 300, friction: 30 }
  });

  const rightPanelSpring = useSpring({
    width: (activeTab === 'mybeats' || activeTab === 'favorites') ? '100%' : isMobile ? '100%' : '67%',
    config: { tension: 300, friction: 30 }
  });

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

  const { playBeat, currentBeat, isPlaying } = useAudioPlayer();

  const handlePlayBeat = (beat: Beat) => {
    playBeat(beat);
  };

  const isFreeBeat = (beat: Beat): boolean => {
    if (!beat.pricings || beat.pricings.length === 0) return true;
    const availablePrices = beat.pricings.filter(p => p.price !== null && p.is_available);
    if (availablePrices.length === 0) return true;
    return Math.min(...availablePrices.map(p => p.price!)) === 0;
  };

  const handleDownloadBeat = async (beat: Beat) => {
    const token = localStorage.getItem("access_token");

    if (isFreeBeat(beat) && !token) {
      const event = new CustomEvent('openAuthModal');
      window.dispatchEvent(event);
      return;
    }
    
    try {
        await fetch(`http://localhost:8000/beats/${beat.id}/increment-download`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.log('Не удалось увеличить счетчик скачиваний, но продолжаем скачивание:', error);
    }
    const baseUrl = 'http://localhost:8000'
    const beatFolder = `beats/${beat.id}`;

    const wavUrl = `${baseUrl}/audio_storage/${beatFolder}/audio.wav`;
    const mp3Url = `${baseUrl}/audio_storage/${beatFolder}/audio.mp3`;

    const checkAudioFile = async (url: string): Promise<boolean> => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
      } catch {
        console.log('File not available:', url);
        return false;
      }
    };

    const wavAvailable = await checkAudioFile(wavUrl);
    const mp3Available = await checkAudioFile(mp3Url);

    let downloadSource: string | null = null;
    let fileExtension: string = '';

    if (wavAvailable) {
      downloadSource = wavUrl;
      fileExtension = 'wav';
    } else if (mp3Available) {
      downloadSource = mp3Url;
      fileExtension = 'mp3';
    }

    if (downloadSource) {
      try {
        const response = await fetch(downloadSource);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${beat.name}.${fileExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download failed:', error);
        alert('Ошибка при скачивании файла');
      }
    } else {
      alert('Файл для скачивания не доступен');
    }
  };

  const handleDeleteBeat = async (beat: Beat) => {
    try {
      await beatService.deleteBeat(beat.id);
      showSuccess('Бит успешно удален');
      loadMyBeats();
    } catch (error: any) {
      console.error('Failed to delete beat:', error);
      showError(error.message || 'Ошибка при удалении бита');
    }
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['info', 'balance', 'mybeats', 'stats', 'favorites', 'history', 'requests'].includes(tab)) {
      setActiveTab(tab as 'info' | 'balance' | 'mybeats' | 'stats' | 'favorites' | 'history' | 'requests');
      setViewMode('content');
    } else {
      setActiveTab(isOwnProfile ? 'info' : 'mybeats');
      setViewMode('tabs');
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

  useEffect(() => {
    if (user && activeTab === 'favorites' && favoriteBeats.length === 0) {
      loadFavoriteBeats();
    }
  }, [user, activeTab, favoriteBeats.length]);

  useEffect(() => {
    if (user && activeTab === 'history' && historyItems.length === 0) {
      loadUserHistory();
    }
  }, [user, activeTab, historyItems.length]);

  useEffect(() => {
    if (user && activeTab === 'requests' && userRequests.length === 0) {
      loadUserRequests();
    }
  }, [user, activeTab, userRequests.length]);

  useEffect(() => {
    if (user && activeTab === 'mybeats' && !isOwnProfile && favoriteBeats.length === 0) {
      loadFavoriteBeats();
    }
  }, [user, activeTab, isOwnProfile, favoriteBeats.length]);

  // Listen for beats updates (e.g., after promotion)
  useEffect(() => {
    const handleBeatsUpdated = () => {
      loadMyBeats();
      loadUserProfile();
    };

    window.addEventListener('beatsUpdated', handleBeatsUpdated);
    return () => window.removeEventListener('beatsUpdated', handleBeatsUpdated);
  }, [user]);

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

  const loadFavoriteBeats = async () => {
    if (!user) return;

    try {
      setFavoriteBeatsLoading(true);
      const beats = await beatService.getFavoriteBeats();
      setFavoriteBeats(beats);
    } catch (error) {
      console.error('Failed to load favorite beats:', error);
    } finally {
      setFavoriteBeatsLoading(false);
    }
  };

  const loadUserHistory = async () => {
    if (!user) return;

    try {
      setHistoryLoading(true);
      const history = await userService.getUserHistory(user.id);
      setHistoryItems(history);
    } catch (error) {
      console.error('Failed to load user history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadUserRequests = async () => {
    if (!user) return;

    try {
      setRequestsLoading(true);
      const requests = await requestService.getUserRequests();
      setUserRequests(requests);
    } catch (error) {
      console.error('Failed to load user requests:', error);
    } finally {
      setRequestsLoading(false);
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

      const updateData: any = {};

      if (formData.username !== user.username) {
        updateData.username = formData.username;
      }
      if (formData.email !== user.email) {
        updateData.email = formData.email;
      }
      if (formData.description !== (user.description || '')) {
        updateData.description = formData.description;
      }

      if (formData.birthday) {
        updateData.birthday = formData.birthday;
      } else if (user.birthday && !formData.birthday) {
        updateData.birthday = null;
      }

      console.log('🔄 Saving data:', updateData);

      if (Object.keys(updateData).length === 0) {
        setEditing(false);
        return;
      }

      const updatedUser = await userService.updateUserProfile(updateData);
      
      console.log('✅ Backend response:', updatedUser);
      console.log('✅ Birthday from backend:', updatedUser.birthday);

      let newBirthday = null;
      if (updatedUser.birthday) {
        newBirthday = new Date(updatedUser.birthday);
      } else if (updateData.birthday === null) {
        newBirthday = null;
      } else {
        newBirthday = user.birthday;
      }

      console.log('🎯 Final birthday value:', newBirthday);

      const updatedUserData = {
        ...user,
        username: updatedUser.username || user.username,
        email: updatedUser.email || user.email,
        birthday: newBirthday,
        description: updatedUser.description || user.description
      };

      console.log('🔄 Setting user state:', updatedUserData);

      setUser(updatedUserData);
      updateUserInStorage(updatedUserData);

      setFormData({
        username: updatedUserData.username,
        email: updatedUserData.email,
        birthday: updatedUserData.birthday ? updatedUserData.birthday.toISOString().split('T')[0] : '',
        description: updatedUserData.description || '',
      });

      setEditing(false);
      showSuccess('Данные успешно обновлены!');
      
    } catch (error: any) {
      console.error('Failed to update user:', error);
      showError(error.message || 'Ошибка при сохранении данных');
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
        showError('Разрешены только файлы JPG, PNG и GIF');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showError('Размер файла не должен превышать 5MB');
        return;
      }

      const avatarFormData = new FormData();
      avatarFormData.append('file', file);

      const response = await userService.uploadAvatar(user.id, avatarFormData);
      updateUserInStorage({ avatar_path: response.avatar_path });

    } catch (error) {
      console.error('Failed to upload avatar:', error);
      showError('Ошибка при загрузке аватарки');
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

  const handleToggleFavorite = async (beat: Beat) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      const event = new CustomEvent('openAuthModal');
      window.dispatchEvent(event);
      return;
    }
    try {
      const isFavorite = favoriteBeats.some(fav => fav.id === beat.id);
      if (isFavorite) {
        await beatService.removeFromFavorites(beat.id);
        setFavoriteBeats(prev => prev.filter(fav => fav.id !== beat.id));
        showSuccess('Бит удален из избранного');
      } else {
        await beatService.toggleFavorite(beat.id);
        setFavoriteBeats(prev => [...prev, beat]);
        showSuccess('Бит добавлен в избранное');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showError('Ошибка при изменении избранного');
    }
  };

  const formatDate = (date: any) => {
    console.log('🔍 formatDate received:', date, 'type:', typeof date);
    
    if (!date) {
      console.log('❌ No date provided');
      return 'Не указана';
    }
    
    try {
      const dateObj = new Date(date);
      console.log('🔍 Created Date object:', dateObj);
      
      if (isNaN(dateObj.getTime())) {
        console.log('❌ Invalid date');
        return 'Не указана';
      }
      
      const formatted = dateObj.toLocaleDateString('ru-RU');
      console.log('✅ Formatted date:', formatted);
      return formatted;
    } catch (error) {
      console.log('❌ Error formatting date:', error);
      return 'Не указана';
    }
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
        <div>
          {/* desktop header */}
          <div className="mb-8 text-center select-none">
          <h1 className="text-3xl font-bold text-white mx-auto flex items-center justify-center gap-3">
            {isOwnProfile ? (
              `Привет, ${user.username}!`
            ) : (
              <div className="flex items-center gap-4">
                <img
                  src={getAvatarUrl(user.id, user.avatar_path)}
                  alt="Аватар"
                  className="w-16 h-16 rounded-full object-cover border-2 border-neutral-600"
                  onError={(e) => {
                    e.currentTarget.src = 'http://localhost:8000/static/default_avatar.png';
                  }}
                />
                <span className="flex items-center gap-2">
                  {user.username}
                  <RoleBadge role={user.role} showLabel={true} />
                </span>
              </div>
            )}
          </h1>
        </div>

        <div className="flex flex-row gap-6 max-w-7xl md:max-w-7xl mx-auto mb-20">
          {/* desktop left panel */}
          <animated.div
            style={leftPanelSpring}
            className="hidden md:block bg-neutral-900 rounded-lg p-6 border border-neutral-700 overflow-hidden flex-shrink-0"
          >
            <div className="flex flex-col items-center mb-6">
              <div className="relative group select-none">
                <div className={`relative ${user.prom_status === 'subscription' ? 'p-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-full' : ''}`}>
                  <img
                    src={getAvatarUrl(user.id, user.avatar_path)}
                    alt="Аватар"
                    className={`w-32 h-32 rounded-full object-cover border-4 select-none ${user.prom_status === 'subscription' ? 'border-none' : 'border-neutral-700'}`}
                    onError={(e) => {
                      e.currentTarget.src = 'http://localhost:8000/static/default_avatar.png';
                    }}
                  />
                </div>
              </div>

              <div className="text-center mt-4">
                <h2 className="text-xl font-semibold text-white flex items-center justify-center gap-2">
                  {user.username}
                  <RoleBadge role={user.role} showLabel={true} />
                </h2>
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
          </animated.div>

          {/* main content panel */}
          <animated.div
            style={rightPanelSpring}
            className="bg-neutral-900 rounded-lg border border-neutral-700 flex-shrink-0 w-full"
          >
                  {/* mobile interface */}
                  <div className="md:hidden">
                    {viewMode === 'tabs' ? (
                      <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700 mb-6">
                        <div className="flex flex-col gap-2">
                          {isOwnProfile && (
                            <button
                              onClick={() => {
                                setActiveTab('info');
                                setSearchParams({ tab: 'info' });
                              }}
                              className={`w-full px-4 py-3 text-sm rounded-lg transition-colors cursor-pointer select-none ${
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
                              className={`w-full px-4 py-3 text-sm rounded-lg transition-colors cursor-pointer select-none ${
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
                            className={`w-full px-4 py-3 text-sm rounded-lg transition-colors cursor-pointer select-none ${
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
                            className={`w-full px-4 py-3 text-sm rounded-lg transition-colors cursor-pointer select-none ${
                              activeTab === 'stats'
                                ? 'bg-red-600 text-white'
                                : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                            }`}
                          >
                            Статистика
                          </button>
                          {isOwnProfile && (
                            <button
                              onClick={() => {
                                setActiveTab('favorites');
                                setSearchParams({ tab: 'favorites' });
                              }}
                              className={`w-full px-4 py-3 text-sm rounded-lg transition-colors cursor-pointer select-none ${
                                activeTab === 'favorites'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                              }`}
                            >
                              Избранное
                            </button>
                          )}
                          {isOwnProfile && (
                            <button
                              onClick={() => {
                                setActiveTab('history');
                                setSearchParams({ tab: 'history' });
                              }}
                              className={`w-full px-4 py-3 text-sm rounded-lg transition-colors cursor-pointer select-none ${
                                activeTab === 'history'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                              }`}
                            >
                              История
                            </button>
                          )}
                          {isOwnProfile && (
                            <button
                              onClick={() => {
                                setActiveTab('requests');
                                setSearchParams({ tab: 'requests' });
                              }}
                              className={`w-full px-4 py-3 text-sm rounded-lg transition-colors cursor-pointer select-none ${
                                activeTab === 'requests'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                              }`}
                            >
                              Заявки
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700 mb-6">
                        <button
                          onClick={() => {
                            setViewMode('tabs');
                            setSearchParams({});
                          }}
                          className="text-red-500 hover:text-red-400 cursor-pointer select-none text-sm"
                        >
                          ← Назад
                        </button>
                      </div>
                    )}
                  </div>

                  {/* desktop tabs */}
                  <div className="hidden md:block bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                    <div className="flex flex-wrap justify-center gap-2">
                      {isOwnProfile && (
                        <button
                          onClick={() => {
                            setActiveTab('info');
                            setSearchParams({ tab: 'info' });
                          }}
                          className={`px-4 py-2 text-base rounded-lg transition-colors cursor-pointer select-none ${
                            activeTab === 'info'
                              ? 'bg-red-600 text-white'
                              : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                          }`}
                        >
                          Информация
                        </button>
                      )}
                      {isOwnProfile && (
                        <button
                          onClick={() => {
                            setActiveTab('balance');
                            setSearchParams({ tab: 'balance' });
                          }}
                          className={`px-4 py-2 text-base rounded-lg transition-colors cursor-pointer select-none ${
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
                        className={`px-4 py-2 text-base rounded-lg transition-colors cursor-pointer select-none ${
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
                        className={`px-4 py-2 text-base rounded-lg transition-colors cursor-pointer select-none ${
                          activeTab === 'stats'
                            ? 'bg-red-600 text-white'
                              : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                        }`}
                      >
                        Статистика
                      </button>
                      {isOwnProfile && (
                        <button
                          onClick={() => {
                            setActiveTab('favorites');
                            setSearchParams({ tab: 'favorites' });
                          }}
                          className={`px-4 py-2 text-base rounded-lg transition-colors cursor-pointer select-none ${
                            activeTab === 'favorites'
                              ? 'bg-red-600 text-white'
                              : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                          }`}
                        >
                          Избранное
                        </button>
                      )}
                      {isOwnProfile && (
                        <button
                          onClick={() => {
                            setActiveTab('history');
                            setSearchParams({ tab: 'history' });
                          }}
                          className={`px-4 py-2 text-base rounded-lg transition-colors cursor-pointer select-none ${
                            activeTab === 'history'
                              ? 'bg-red-600 text-white'
                              : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                          }`}
                        >
                          История
                        </button>
                      )}
                      {isOwnProfile && (
                        <button
                          onClick={() => {
                            setActiveTab('requests');
                            setSearchParams({ tab: 'requests' });
                          }}
                          className={`px-4 py-2 text-base rounded-lg transition-colors cursor-pointer select-none ${
                            activeTab === 'requests'
                              ? 'bg-red-600 text-white'
                              : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                          }`}
                        >
                          Заявки
                        </button>
                      )}
                    </div>
                  </div>

                  {activeTab === 'info' && isOwnProfile && (
                    <div className='p-4'>
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
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-neutral-400 text-sm font-medium">
                              Email
                            </label>
                            {isOwnProfile && !editing && (
                              <button
                                onClick={() => navigate('/email-change')}
                                className="text-red-500 cursor-pointer select-none hover:text-red-400 text-sm transition-colors"
                              >
                                Изменить
                              </button>
                            )}
                          </div>
                          <div className="text-white text-lg">{user.email}</div>
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
                    <div className='p-4'>
                      <h2 className="text-xl font-semibold text-white mb-2">Баланс</h2>
                      <div className="space-y-6">
                        <div className="bg-neutral-750 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-neutral-400">Текущий баланс:</span>
                            <span className="text-white text-2xl font-bold">{user.balance.toFixed(2)} ₽</span>
                          </div>
                          <div className="flex space-x-4">
                            <button
                              onClick={() => setDepositModalOpen(true)}
                              className="flex-1 bg-white hover:bg-gray-300 text-red-600 px-4 py-2 select-none cursor-pointer rounded-lg transition-colors"
                            >
                              Пополнить
                            </button>
                            <button
                              onClick={() => setWithdrawalModalOpen(true)}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 select-none cursor-pointer rounded-lg transition-colors"
                            >
                              Вывести
                            </button>
                          </div>
                          <div className='justify-between items-center mt-20'>
                            <p className='text-neutral-400 text-sm text-center'>
                              ОБРАТИТЕ ВНИМАНИЕ <br />
                              При пополнении баланса сервис взимает комиссию в размере 5%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'mybeats' && (
                    <div className='p-4'>
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
                      ) : isMobile ? (
                        <>
                          <div className="mb-6">
                            <input
                              type="text"
                              value={filters.name}
                              onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Поиск по названию..."
                              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-colors"
                            />
                          </div>
                          <BeatList
                            beats={myBeats}
                            loading={beatsLoading}
                            currentPlayingBeat={currentBeat}
                            isPlaying={isPlaying}
                            onPlay={handlePlayBeat}
                            onDownload={!isOwnProfile ? handleDownloadBeat : undefined}
                            isProfileView={isOwnProfile}
                            filters={filters}
                            onToggleFavorite={!isOwnProfile ? handleToggleFavorite : undefined}
                            favoriteBeats={!isOwnProfile ? favoriteBeats : undefined}
                            onDeleteBeat={isOwnProfile ? handleDeleteBeat : undefined}
                            onShowRejectionReason={isOwnProfile ? handleShowRejectionReason : undefined}
                          />
                        </>
                      ) : (
                        <BeatTable
                          beats={myBeats}
                          filters={filters}
                          isProfileView={isOwnProfile}
                          hideAuthorColumn={true}
                          currentPlayingBeat={currentBeat}
                          isPlaying={isPlaying}
                          onShowRejectionReason={isOwnProfile ? handleShowRejectionReason : undefined}
                          onPlay={handlePlayBeat}
                          onDownload={!isOwnProfile ? handleDownloadBeat : undefined}
                          onDeleteBeat={isOwnProfile ? handleDeleteBeat : undefined}
                          onToggleFavorite={!isOwnProfile ? handleToggleFavorite : undefined}
                          favoriteBeats={!isOwnProfile ? favoriteBeats : undefined}
                        />
                      )}
                    </div>
                  )}

                  {activeTab === 'stats' && (
                    <div className='p-4'>
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
                              <hr className='text-neutral-600' />
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-400">Лайкнуто битов:</span>
                                <span className="text-white font-semibold">{userStats?.liked_beats_count || 0}</span>
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

                  {activeTab === 'favorites' && isOwnProfile && (
                    <div className='p-4'>
                      <h2 className="text-xl font-semibold text-white mb-6">Избранное</h2>

                      {favoriteBeatsLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                        </div>
                      ) : favoriteBeats.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-neutral-400">
                            У вас пока нет избранных битов
                          </p>
                        </div>
                      ) : isMobile ? (
                        <BeatList
                          beats={favoriteBeats}
                          loading={favoriteBeatsLoading}
                          currentPlayingBeat={currentBeat}
                          isPlaying={isPlaying}
                          onPlay={handlePlayBeat}
                          onDownload={handleDownloadBeat}
                          isProfileView={false}
                          filters={filters}
                          onToggleFavorite={handleToggleFavorite}
                          favoriteBeats={favoriteBeats}
                        />
                      ) : (
                        <BeatTable
                          beats={favoriteBeats}
                          filters={filters}
                          isProfileView={false}
                          hideAuthorColumn={false}
                          currentPlayingBeat={currentBeat}
                          isPlaying={isPlaying}
                          onPlay={handlePlayBeat}
                          onDownload={handleDownloadBeat}
                          onToggleFavorite={handleToggleFavorite}
                          favoriteBeats={favoriteBeats}
                        />
                      )}
                    </div>
                  )}

                  {activeTab === 'history' && isOwnProfile && (
                    <div className='p-4'>
                      <h2 className="text-xl font-semibold text-white mb-6">История</h2>

                      {historyLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                        </div>
                      ) : historyItems.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-neutral-400">
                            У вас пока нет истории покупок и продаж
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {historyItems.map((item) => (
                            <div key={item.id} className="bg-neutral-750 rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      item.type === 'purchase'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-blue-600 text-white'
                                    }`}>
                                      {item.type === 'purchase' ? 'Покупка' : 'Продажа'}
                                    </span>
                                    <span className="text-neutral-400 text-sm">
                                      {formatDate(item.created_at)}
                                    </span>
                                  </div>
                                  <h3 className="text-white font-medium mb-1">{item.beat_name}</h3>
                                  <p className="text-neutral-400 text-sm">
                                    {item.type === 'purchase' ? 'От' : 'Кому'}: {item.counterparty_username}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className={`text-lg font-bold ${
                                    item.type === 'purchase' ? 'text-red-500' : 'text-green-500'
                                  }`}>
                                    {item.type === 'purchase' ? '-' : '+'}{item.amount} ₽
                                  </div>
                                  <div className="text-neutral-400 text-sm">
                                    {item.tariff_name === 'leasing' ? 'Аренда' : 'Эксклюзив'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'requests' && isOwnProfile && (
                    <div className='p-4'>
                      <h2 className="text-xl font-semibold text-white mb-6">Заявки</h2>

                      {requestsLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                        </div>
                      ) : userRequests.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-neutral-400">
                            У вас пока нет заявок
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {userRequests.map((request) => (
                            <div key={request.id} className="bg-neutral-750 rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      request.status === 'pending' || request.status === 'in_progress'
                                        ? 'bg-yellow-600 text-white'
                                        : 'bg-gray-600 text-white'
                                    }`}>
                                      {request.status === 'pending' ? 'В работе' : request.status === 'in_progress' ? 'В работе' : 'Закрыта'}
                                    </span>
                                    <span className="text-neutral-400 text-sm">
                                      {formatDate(request.created_at)}
                                    </span>
                                  </div>
                                  <h3 className="text-white font-medium mb-1">{request.title}</h3>
                                  <p className="text-neutral-400 text-sm">
                                    {request.description}
                                  </p>
                                  <p className="text-neutral-500 text-xs mt-2">
                                    Тип проблемы: {request.problem_type}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className={`text-sm font-medium ${
                                    request.status === 'pending' || request.status === 'in_progress'
                                      ? 'text-yellow-500'
                                      : 'text-gray-400'
                                  }`}>
                                    {request.status === 'pending' ? 'В работе' : request.status === 'in_progress' ? 'В работе' : 'Закрыта'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </animated.div>
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

      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
      />

      <WithdrawalModal
        isOpen={withdrawalModalOpen}
        onClose={() => setWithdrawalModalOpen(false)}
        currentBalance={user?.balance || 0}
      />
    </>
  );
};

export default ProfilePage;
