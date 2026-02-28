import React, { useState } from 'react';
import { useTransition, animated } from '@react-spring/web';
import { useNavigate } from 'react-router-dom';
import type { Beat } from '../types/Beat';
import { getAvatarUrl } from '../utils/getAvatarURL';
import { formatDuration } from '../utils/formatDuration';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

interface BeatInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  beat: Beat | null;
}

const getCoverUrl = (beat: Beat): string | null => {
  if (!beat.cover_path) return null;
  return `http://localhost:8000/static/covers/${beat.cover_path}`;
};

const BeatInfoModal: React.FC<BeatInfoModalProps> = ({ isOpen, onClose, beat }) => {
  const navigate = useNavigate();
  const [isHoveringCover, setIsHoveringCover] = useState(false);
  const { playBeat, currentBeat, isPlaying } = useAudioPlayer();
  
  const overlayTransition = useTransition(isOpen, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: { duration: 200 }
  });

  const modalTransition = useTransition(isOpen, {
    from: { opacity: 0, transform: 'scale(0.9) translateY(-10px)' },
    enter: { opacity: 1, transform: 'scale(1) translateY(0px)' },
    leave: { opacity: 0, transform: 'scale(0.9) translateY(-10px)' },
    config: { tension: 300, friction: 30 }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const termsOfUseLabels: Record<string, string> = {
    recording_tracks: 'Запись треков',
    commercial_perfomance: 'Коммерческое исполнение',
    rotation_on_the_radio: 'Ротация на радио',
    music_video_recording: 'Съемка музыкального видео',
    release_of_copies: 'Выпуск копий'
  };

  const getAuthorId = (beat: Beat): number | null => {
    if (beat.owner?.id) return beat.owner.id;
    if (beat.author?.id) return beat.author.id;
    if (beat.user?.id) return beat.user.id;
    return beat.author_id || null;
  };

  const getAuthorAvatar = (beat: Beat): string => {
    const authorId = getAuthorId(beat);
    if (!authorId) return 'http://localhost:8000/static/default_avatar.png';

    if (beat.owner?.avatar_path) return getAvatarUrl(authorId, beat.owner.avatar_path);
    if (beat.author?.avatar_path) return getAvatarUrl(authorId, beat.author.avatar_path);
    if (beat.user?.avatar_path) return getAvatarUrl(authorId, beat.user.avatar_path);

    return 'http://localhost:8000/static/default_avatar.png';
  };

  const getAuthorName = (beat: Beat): string => {
    if (beat.owner?.username) return beat.owner.username;
    if (beat.author?.username) return beat.author.username;
    if (beat.user?.username) return beat.user.username;
    if (beat.author_id) return `Пользователь ${beat.author_id}`;
    return 'Неизвестно';
  };

  const handleAuthorClick = () => {
    const authorId = getAuthorId(beat!);
    if (authorId) {
      onClose();
      navigate(`/profile/${authorId}`);
    }
  };

  const getTagName = (tag: any): string => {
    if (typeof tag === 'string') return tag;
    if (tag && typeof tag === 'object' && 'name' in tag) return tag.name;
    return String(tag);
  };

  const handleCoverClick = () => {
    if (beat) {
      playBeat(beat);
    }
  };

  const isCurrentBeatPlaying = currentBeat?.id === beat?.id && isPlaying;

  return (
    <>
      {overlayTransition((style, item) =>
        item && (
          <animated.div
            style={style}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
        )
      )}

      {modalTransition((style, item) =>
        item && (
          <animated.div
            style={style}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-neutral-900 select-none rounded-lg w-full max-w-2xl border border-neutral-800 shadow-2xl">
              <div className="p-4 border-b border-neutral-800">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-white select-none">
                    Информация о бите
                  </h2>
                  <button
                    onClick={onClose}
                    className="text-neutral-400 cursor-pointer hover:text-white transition-colors"
                    aria-label="Закрыть"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-4 max-h-[70vh] overflow-y-auto">
                {beat && (
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Column 1 - Cover Image */}
                    <div className="flex-shrink-0">
                      <div 
                        className="relative w-full md:w-48 aspect-square rounded-lg overflow-hidden bg-neutral-800 cursor-pointer group"
                        onMouseEnter={() => setIsHoveringCover(true)}
                        onMouseLeave={() => setIsHoveringCover(false)}
                        onClick={handleCoverClick}
                      >
                        {getCoverUrl(beat) ? (
                          <img
                            src={getCoverUrl(beat)!}
                            alt="Обложка"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-16 h-16 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          </div>
                        )}
                        {/* Hover overlay with play/pause button */}
                        <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200 ${isCurrentBeatPlaying || isHoveringCover ? 'opacity-100' : 'opacity-0'}`}>
                          {isCurrentBeatPlaying ? (
                            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
                            </svg>
                          ) : (
                            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Column 2 - Main Info */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">
                          {beat.name}
                        </h3>
                        <div 
                          className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={handleAuthorClick}
                        >
                          <img
                            src={getAuthorAvatar(beat)}
                            alt="Аватар автора"
                            className="w-6 h-6 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'http://localhost:8000/static/default_avatar.png';
                            }}
                          />
                          <p className="text-neutral-400 text-sm hover:text-red-400 transition-colors">
                            {getAuthorName(beat)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-neutral-800 p-2 rounded">
                          <p className="text-neutral-500 text-xs">Жанр</p>
                          <p className="text-white font-medium text-sm">{beat.genre}</p>
                        </div>
                        <div className="bg-neutral-800 p-2 rounded">
                          <p className="text-neutral-500 text-xs">Темп</p>
                          <p className="text-white font-medium text-sm">{beat.tempo} BPM</p>
                        </div>
                        <div className="bg-neutral-800 p-2 rounded">
                          <p className="text-neutral-500 text-xs">Тональность</p>
                          <p className="text-white font-medium text-sm">{beat.key}</p>
                        </div>
                        <div className="bg-neutral-800 p-2 rounded">
                          <p className="text-neutral-500 text-xs">Длительность</p>
                          <p className="text-white font-medium text-sm">{formatDuration(beat.duration)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Column 3 - Tags, Terms of Use and Date */}
                    <div className="flex-shrink-0 w-full md:w-40 space-y-3">
                      {beat.tags && beat.tags.length > 0 && (
                        <div>
                          <h4 className="text-white font-medium mb-2 text-sm">Теги:</h4>
                          <div className="flex flex-wrap gap-2">
                            {beat.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="bg-neutral-800 border border-red-600 text-white px-2 py-1 rounded-full text-xs"
                              >
                                #{getTagName(tag)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {beat.terms_of_use && (
                        <div>
                          <h4 className="text-white font-medium mb-2 text-sm">Условия:</h4>
                          <div className="space-y-1">
                            {Object.entries(beat.terms_of_use).map(([key, value]) => (
                              value && (
                                <div key={key} className="flex items-center text-neutral-300 text-xs">
                                  <svg className="w-3 h-3 mr-1 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <span className="truncate">{termsOfUseLabels[key] || key}</span>
                                </div>
                              )
                            ))}
                            {!Object.values(beat.terms_of_use).some(v => v) && (
                              <p className="text-neutral-500 text-xs">Не указаны</p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="pt-2 border-t border-neutral-700">
                        <p className="text-neutral-500 text-xs">
                          Добавлен: {formatDate(beat.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </animated.div>
        )
      )}
    </>
  );
};

export default BeatInfoModal;
