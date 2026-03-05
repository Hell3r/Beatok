import React, { useState, useEffect } from 'react';
import type { Beat } from '../types/Beat';
import type { Request } from '../types/Request';
import { getCurrentUser } from '../utils/getCurrentUser';
import { getAvatarUrl } from '../utils/getAvatarURL';
import { formatDuration } from '../utils/formatDuration';
import { truncateText } from '../utils/truncateText';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useNavigate } from 'react-router-dom';
import BeatInfoModal from '../components/BeatInfoModal';

const API_URL = 'http://localhost:8000';

const Admin: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'moderation' | 'support' | 'users'>('moderation');
  const [moderationBeats, setModerationBeats] = useState<Beat[]>([]);
  const [supportRequests, setSupportRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedBeat, setSelectedBeat] = useState<Beat | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [beatToShowInfo, setBeatToShowInfo] = useState<Beat | null>(null);
  
  const navigate = useNavigate();
  const { playBeat, currentBeat, isPlaying, togglePlayPause } = useAudioPlayer();

  useEffect(() => {
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
      try {
        setCurrentUser(JSON.parse(userInfo));
      } catch (error) {
        console.error('Error parsing user info:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      fetchModerationBeats();
      fetchSupportRequests();
      
      const interval = setInterval(() => {
        fetchModerationBeats();
        fetchSupportRequests();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const fetchModerationBeats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/beats/moderation`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setModerationBeats(data);
      }
    } catch (error) {
      console.error('Error fetching moderation beats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportRequests = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/v1/requests/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Filter out closed requests on client side as additional safeguard
        const filteredData = data.filter((request: Request) => request.status !== 'closed');
        setSupportRequests(filteredData);
      }
    } catch (error) {
      console.error('Error fetching support requests:', error);
    }
  };

  const handleApprove = async (beat: Beat) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/beats/${beat.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setModerationBeats(prev => prev.filter(b => b.id !== beat.id));
      }
    } catch (error) {
      console.error('Error approving beat:', error);
    }
  };

  const handleCloseRequest = async (requestId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('status', 'closed');
      
      const response = await fetch(`${API_URL}/v1/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (response.ok) {
        setSupportRequests(prev => prev.filter(r => r.id !== requestId));
      }
    } catch (error) {
      console.error('Error closing request:', error);
    }
  };

  const handleRejectClick = (beat: Beat) => {
    setSelectedBeat(beat);
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedBeat || !rejectReason.trim()) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('reason', rejectReason);
      
      const response = await fetch(`${API_URL}/beats/${selectedBeat.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (response.ok) {
        setModerationBeats(prev => prev.filter(b => b.id !== selectedBeat.id));
        setRejectModalOpen(false);
        setSelectedBeat(null);
        setRejectReason('');
      }
    } catch (error) {
      console.error('Error rejecting beat:', error);
    }
  };

  const getCoverUrl = (beat: Beat): string | null => {
    if (!beat.cover_path) return null;
    return `http://localhost:8000/static/covers/${beat.cover_path}`;
  };

  const getAuthorAvatar = (beat: Beat): string => {
    const authorId = beat.owner?.id || beat.author?.id || beat.user?.id || beat.author_id;
    const avatarPath = beat.owner?.avatar_path || beat.author?.avatar_path || beat.user?.avatar_path;
    if (!authorId) return 'http://localhost:8000/static/default_avatar.png';
    if (avatarPath) return getAvatarUrl(authorId, avatarPath);
    return 'http://localhost:8000/static/default_avatar.png';
  };

  const getAuthorName = (beat: Beat): string => {
    if (beat.owner?.username) return beat.owner.username;
    if (beat.author?.username) return beat.author.username;
    if (beat.user?.username) return beat.user.username;
    return `Пользователь ${beat.author_id}`;
  };

  const getAuthorId = (beat: Beat): number | null => {
    if (beat.owner?.id) return beat.owner.id;
    if (beat.author?.id) return beat.author.id;
    if (beat.user?.id) return beat.user.id;
    return beat.author_id || null;
  };

  const getAuthorPromStatus = (beat: Beat): string | null => {
    if (beat.owner?.prom_status) return beat.owner.prom_status;
    if (beat.author?.prom_status) return beat.author.prom_status;
    if (beat.user?.prom_status) return beat.user.prom_status;
    return null;
  };

  const handleAuthorClick = (beat: Beat) => {
    const authorId = getAuthorId(beat);
    if (authorId) {
      navigate(`/profile/${authorId}`);
    }
  };

  const getBeatPrices = (beat: Beat): string => {
    if (!beat.pricings || beat.pricings.length === 0) return 'Бесплатно';
    
    const prices = beat.pricings
      .filter(p => p.price !== null && p.is_available)
      .map(p => `${p.tariff_display_name || p.tariff_name}: ${p.price} ₽`);
    
    return prices.length > 0 ? prices.join(', ') : 'Бесплатно';
  };

  const handleCoverClick = (beat: Beat) => {
    if (currentBeat?.id === beat.id) {
      togglePlayPause();
    } else {
      playBeat(beat);
    }
  };

  const handleInfoClick = (beat: Beat) => {
    setBeatToShowInfo(beat);
    setInfoModalOpen(true);
  };

  const termsOfUseLabels: Record<string, string> = {
    recording_tracks: 'Запись треков',
    commercial_perfomance: 'Коммерческое исполнение',
    rotation_on_the_radio: 'Ротация на радио',
    music_video_recording: 'Съемка муз. видео',
    release_of_copies: 'Выпуск копий'
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center select-none">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Доступ запрещен</h1>
          <p className="text-gray-300">У вас нет прав для просмотра этой страницы.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex space-x-4 mb-6 border-b border-neutral-700">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`px-4 py-2 font-semibold transition-colors cursor-pointer select-none ${
            activeTab === 'moderation'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Биты на модерации ({moderationBeats.length})
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`px-4 py-2 font-semibold transition-colors cursor-pointer select-none ${
            activeTab === 'support'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Заявки поддержки ({supportRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-semibold transition-colors cursor-pointer select-none ${
            activeTab === 'users'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Реестр пользователей ({supportRequests.length})
        </button>
      </div>

      {activeTab === 'moderation' && (
        <div>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-neutral-800 rounded-lg p-4 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-32 h-32 bg-neutral-700 rounded-lg"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-6 bg-neutral-700 rounded w-1/3"></div>
                      <div className="h-4 bg-neutral-700 rounded w-1/4"></div>
                      <div className="h-4 bg-neutral-700 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : moderationBeats.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-400 text-lg">Нет битов на модерации</p>
            </div>
          ) : (
            <div className="space-y-4">
              {moderationBeats.map((beat) => {
                const coverUrl = getCoverUrl(beat);
                const isCurrentBeatPlaying = currentBeat?.id === beat.id && isPlaying;
                return (
                  <div key={beat.id} className="bg-neutral-900 rounded-lg p-4 border border-neutral-700 hover:border-neutral-600 transition-colors">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        {coverUrl ? (
                          <div 
                            className="relative w-32 h-32 rounded-lg overflow-hidden cursor-pointer group"
                            onClick={() => handleCoverClick(beat)}
                          >
                            <img 
                              src={coverUrl} 
                              alt="Обложка" 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              {isCurrentBeatPlaying ? (
                                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
                                </svg>
                              ) : (
                                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="w-32 h-32 bg-neutral-800 rounded-lg flex items-center justify-center cursor-pointer group"
                            onClick={() => handleCoverClick(beat)}
                          >
                            {isCurrentBeatPlaying ? (
                              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
                              </svg>
                            ) : (
                              <svg className="w-12 h-12 text-neutral-600 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                              </svg>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 
                              className="text-white font-semibold text-lg mb-1 cursor-pointer hover:text-red-400 transition-colors"
                              onClick={() => handleInfoClick(beat)}
                            >
                              {truncateText(beat.name, 50)}
                            </h3>
                            <div 
                              className="flex items-center space-x-2 mb-1 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => handleAuthorClick(beat)}
                            >
                              <img
                                src={getAuthorAvatar(beat)}
                                alt="Аватар"
                                className="w-5 h-5 rounded-full"
                                onError={(e) => {
                                  e.currentTarget.src = 'http://localhost:8000/static/default_avatar.png';
                                }}
                              />
                              <span className="text-neutral-400 text-sm hover:text-red-400 transition-colors">by {getAuthorName(beat)}</span>
                              {getAuthorPromStatus(beat) === 'subscription' && (
                                <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black text-xs font-semibold px-2 py-0.5 rounded-full">
                                  Высокий приоритет
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-neutral-500">
                              ID бита: {beat.id} | ID автора: {getAuthorId(beat)}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-2">
                          <div className="text-neutral-300">
                            <span className="text-neutral-500">Жанр:</span> {beat.genre}
                          </div>
                          <div className="text-neutral-300">
                            <span className="text-neutral-500">Темп:</span> {beat.tempo} BPM
                          </div>
                          <div className="text-neutral-300">
                            <span className="text-neutral-500">Тональность:</span> {beat.key}
                          </div>
                          <div className="text-neutral-300">
                            <span className="text-neutral-500">Длина:</span> {formatDuration(beat.duration)}
                          </div>
                        </div>

                        {beat.tags && beat.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {beat.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="bg-neutral-800 border border-red-600 text-white px-2 py-0.5 rounded-full text-xs"
                              >
                                #{typeof tag === 'object' ? tag.name : tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {beat.terms_of_use && Object.values(beat.terms_of_use).some(v => v) && (
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
                            {Object.entries(beat.terms_of_use).map(([key, value]) => 
                              value && (
                                <span key={key} className="text-green-400 text-xs flex items-center">
                                  <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  {termsOfUseLabels[key] || key}
                                </span>
                              )
                            )}
                          </div>
                        )}

                        <div className="text-sm mb-1">
                          <span className="text-neutral-500">Цены: </span>
                          <span className="text-green-400 font-medium">{getBeatPrices(beat)}</span>
                        </div>

                        <div className="text-xs text-neutral-500">
                          {new Date(beat.created_at).toLocaleDateString('ru-RU')} {new Date(beat.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div className="flex flex-col justify-center gap-2 flex-shrink-0 select-none">
                        <button
                          onClick={() => handleApprove(beat)}
                          className="bg-green-600 cursor-pointer hover:bg-green-700 text-white font-semibold py-2 px-6 rounded transition-colors whitespace-nowrap"
                        >
                          Принять
                        </button>
                        <button
                          onClick={() => handleRejectClick(beat)}
                          className="bg-red-600 cursor-pointer hover:bg-red-700 text-white font-semibold py-2 px-6 rounded transition-colors whitespace-nowrap"
                        >
                          Отклонить
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'support' && (
        <div>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-neutral-800 rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-neutral-700 rounded mb-2"></div>
                  <div className="h-3 bg-neutral-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : supportRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-400 text-lg">Нет заявок в поддержку</p>
            </div>
          ) : (
            <div className="space-y-4">
              {supportRequests.map((request) => (
                <div key={request.id} className="bg-neutral-900 rounded-lg p-4 border border-neutral-700 select-none">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-white font-semibold text-lg">{request.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        request.status === 'pending' ? 'bg-yellow-600 text-white' :
                        request.status === 'in_progress' ? 'bg-blue-600 text-white' :
                        request.status === 'resolved' ? 'bg-green-600 text-white' :
                        'bg-neutral-600 text-white'
                      }`}>
                        {request.status === 'pending' ? 'Ожидает' : 
                         request.status === 'in_progress' ? 'В работе' : 
                         request.status === 'resolved' ? 'Решено' : 
                         request.status === 'closed' ? 'Закрыто' : request.status}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500">
                      {new Date(request.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="text-neutral-500">Тип проблемы: </span>
                    <span className="text-neutral-300">{request.problem_type}</span>
                  </div>

                  {request.description && (
                    <div className="mb-3 p-3 bg-neutral-800 rounded">
                      <p className="text-neutral-300 text-sm">{request.description}</p>
                    </div>
                  )}

                  {request.user && (
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-700">
                      <div className="flex items-center space-x-2">
                        <span className="text-neutral-500 text-sm">От:</span>
                        <span className="text-neutral-300 text-sm">{request.user.username}</span>
                        <span className="text-neutral-500 text-sm">({request.user.email})</span>
                      </div>
                      <button
                        onClick={() => handleCloseRequest(request.id)}
                        className="bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-semibold py-2 px-4 rounded transition-colors cursor-pointer"
                      >
                        Закрыть
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 select-none">
          <div className="bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Отклонить бит</h3>
            <p className="text-neutral-400 mb-4">Укажите причину отклонения:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full h-32 bg-neutral-700 text-white rounded-lg p-3 mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Причина отклонения..."
            />
            <div className="flex space-x-2">
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim()}
                className="flex-1 cursor-pointer bg-red-600 hover:bg-red-700 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                Отклонить
              </button>
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setSelectedBeat(null);
                  setRejectReason('');
                }}
                className="flex-1  cursor-pointer bg-neutral-600 hover:bg-neutral-500 text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      <BeatInfoModal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        beat={beatToShowInfo}
      />
    </div>
  );
};

export default Admin;
