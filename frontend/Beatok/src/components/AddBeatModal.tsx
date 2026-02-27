import React, { useState, useEffect } from 'react';
import { useTransition, animated } from '@react-spring/web';
import { beatService, type Tariff } from '../services/beatService';
import { useNotificationContext } from './NotificationProvider';
import { useModal } from '../hooks/useModal';

interface AddBeatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const musicalKeys = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
];

const genres = [
  'Hip-Hop', 'Trap', 'Trap-Metal', 'Lo-fi', 'R&B', 'Pop', 'Rock', 'Metal', 'Electronic', 'Dubstep', 'Other'
];

const AddBeatModal: React.FC<AddBeatModalProps> = ({ isOpen, onClose }) => {
  const { showSuccess } = useNotificationContext();
  const { openModal, closeModal } = useModal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [showRules, setShowRules] = useState(false);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [beatData, setBeatData] = useState({
    name: '',
    genre: '',
    tempo: '',
    key: '',
    mp3_file: null as File | null,
    wav_file: null as File | null,
    pricings: {} as Record<string, string>,
    is_free: false,
    terms_of_use: {
      recording_tracks: false,
      commercial_perfomance: false,
      rotation_on_the_radio: false,
      music_video_recording: false,
      release_of_copies: false
    }
  });

  useEffect(() => {
    if (isOpen) {
      openModal();
      loadTariffs();
      setTags([]);
      setTagInput('');
    } else {
      closeModal();
    }
  }, [isOpen, openModal, closeModal]);

  const loadTariffs = async () => {
    try {
      const tariffsData = await beatService.getTariffs();
      setTariffs(tariffsData);
    } catch (err) {
      console.error('Ошибка загрузки тарифов:', err);
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    
    if (!trimmedTag) return;
    
    if (tags.length >= 10) {
      setError('Максимум 10 тегов');
      return;
    }
    
    if (trimmedTag.length > 50) {
      setError('Тег не может быть длиннее 50 символов');
      return;
    }
    
    if (tags.includes(trimmedTag.toLowerCase())) {
      setError('Такой тег уже добавлен');
      return;
    }

    setTags([...tags, trimmedTag.toLowerCase()]);
    setTagInput('');
    setError('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const modalTransition = useTransition(isOpen, {
    from: { opacity: 0, transform: 'scale(0.8) translateY(-20px)' },
    enter: { opacity: 1, transform: 'scale(1) translateY(0px)' },
    leave: { opacity: 0, transform: 'scale(0.8) translateY(-20px)' },
    config: { tension: 300, friction: 30 }
  });

  const overlayTransition = useTransition(isOpen, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: { duration: 200 }
  });

  const rulesOverlayTransition = useTransition(showRules, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: { duration: 200 }
  });

  const rulesModalTransition = useTransition(showRules, {
    from: { opacity: 0, transform: 'scale(0.8) translateY(-20px)' },
    enter: { opacity: 1, transform: 'scale(1) translateY(0px)' },
    leave: { opacity: 0, transform: 'scale(0.8) translateY(-20px)' },
    config: { tension: 300, friction: 30 }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!beatData.name.trim()) {
      setError('Название бита обязательно');
      setLoading(false);
      return;
    }

    if (!beatData.genre.trim()) {
      setError('Жанр обязателен');
      setLoading(false);
      return;
    }

    if (!beatData.tempo || isNaN(Number(beatData.tempo))) {
      setError('Темп должен быть числом');
      setLoading(false);
      return;
    }

    if (!beatData.key.trim()) {
      setError('Ключ обязателен');
      setLoading(false);
      return;
    }

    if (!beatData.mp3_file && !beatData.wav_file) {
      setError('Необходимо загрузить хотя бы один аудиофайл (MP3 или WAV)');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Необходима авторизация');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('name', beatData.name);
      formData.append('genre', beatData.genre);
      formData.append('tempo', beatData.tempo);
      formData.append('key', beatData.key);
      formData.append('is_free', beatData.is_free.toString());
      formData.append('terms_of_use', JSON.stringify(beatData.terms_of_use));
      
      if (tags.length > 0) {
        formData.append('tags', tags.join(','));
      }

      if (beatData.mp3_file) {
        formData.append('mp3_file', beatData.mp3_file);
      }

      if (beatData.wav_file) {
        formData.append('wav_file', beatData.wav_file);
      }

      const response = await fetch('http://localhost:8000/beats/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.status === 409) {
        const errorData = await response.json();
        const errorMessage = errorData.detail?.message || 'Слыш блять чо биты пиздишь сука';
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        console.log(response.status)
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка при добавлении бита');
      }

      const beatResponse = await response.json();
      const beatId = beatResponse.id;

      if (!beatData.is_free) {
        for (const tariff of tariffs) {
          const priceStr = beatData.pricings[tariff.name];
          if (priceStr && priceStr.trim()) {
            const price = parseFloat(priceStr);
            if (!isNaN(price) && price >= 0) {
              try {
                await beatService.createBeatPricing({
                  beat_id: beatId,
                  tariff_name: tariff.name,
                  price: price,
                  is_available: true
                });
              } catch (pricingErr) {
                console.error(`Ошибка создания цены для тарифа ${tariff.name}:`, pricingErr);
              }
            }
          }
        }
      }

      setBeatData({
        name: '',
        genre: '',
        tempo: '',
        key: '',
        mp3_file: null,
        wav_file: null,
        pricings: {},
        is_free: false,
        terms_of_use: {
          recording_tracks: false,
          commercial_perfomance: false,
          rotation_on_the_radio: false,
          music_video_recording: false,
          release_of_copies: false
        }
      });
      setTags([]);
      setTagInput('');
      
      onClose();
      showSuccess('Бит успешно отправлен на модерацию!');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при добавлении бита');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'mp3' | 'wav') => {
    const file = e.target.files?.[0];
    if (file) {
      if (fileType === 'mp3' && !file.name.toLowerCase().endsWith('.mp3')) {
        setError('MP3 файл должен иметь расширение .mp3');
        return;
      }
      if (fileType === 'wav' && !file.name.toLowerCase().endsWith('.wav')) {
        setError('WAV файл должен иметь расширение .wav');
        return;
      }
      setBeatData({ ...beatData, [`${fileType}_file`]: file });
      setError('');
    }
  };

  const handlePricingChange = (tariffName: string, price: string) => {
    setBeatData({
      ...beatData,
      pricings: {
        ...beatData.pricings,
        [tariffName]: price
      }
    });
  };

  const handleTermsOfUseChange = (field: string, value: boolean) => {
    setBeatData({
      ...beatData,
      terms_of_use: {
        ...beatData.terms_of_use,
        [field]: value
      }
    });
  };

  return (
    <>
      {overlayTransition((style, item) =>
        item && (
          <animated.div
            style={style}
            className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"
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
            <div className="bg-neutral-900 rounded-lg w-full max-w-5xl max-h-[95vh] border border-neutral-800 shadow-2xl overflow-y-auto">
              <div className="p-6 border-b border-neutral-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-white select-none">
                      Добавить бит
                    </h2>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setShowRules(true)}
                      className="text-sm text-neutral-400 select-none hover:text-white transition-colors underline cursor-pointer"
                    >
                      Правила добавления бита
                    </button>
                    <button
                      onClick={onClose}
                      className="text-neutral-400 cursor-pointer hover:text-white transition-colors"
                      aria-label="Закрыть"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {error && (
                  <div className="mb-4 p-3 bg-red-900/80 border border-red-700 rounded text-red-200 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-3 gap-6 select-none">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium select-none text-neutral-300 mb-2">
                          Название бита
                        </label>
                        <input
                          type="text"
                          placeholder="Введите название бита"
                          value={beatData.name}
                          onChange={(e) => setBeatData({...beatData, name: e.target.value})}
                          className="w-full h-10 p-2 bg-neutral-800 border border-neutral-600 rounded text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm select-none font-medium text-neutral-300 mb-2">
                          MP3 файл
                        </label>
                        <input
                          type="file"
                          accept=".mp3"
                          onChange={(e) => handleFileChange(e, 'mp3')}
                          className="w-full h-10 p-1 bg-neutral-800 border border-neutral-600 rounded text-white focus:outline-none focus:border-red-500 transition-colors file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer select-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm select-none font-medium text-neutral-300 mb-2">
                          WAV файл
                        </label>
                        <input
                          type="file"
                          accept=".wav"
                          onChange={(e) => handleFileChange(e, 'wav')}
                          className="w-full h-10 p-1 bg-neutral-800 border border-neutral-600 rounded text-white focus:outline-none focus:border-red-500 transition-colors file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer select-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block select-none text-sm font-medium text-neutral-300 mb-2">
                          Жанр
                        </label>
                        <select
                          value={beatData.genre}
                          onChange={(e) => setBeatData({...beatData, genre: e.target.value})}
                          className="w-full select-none h-10 p-2 bg-neutral-800 border border-neutral-600 rounded text-white text-sm focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
                          required
                        >
                          <option value="">Выберите жанр</option>
                          {genres.map((genre) => (
                            <option key={genre} value={genre}>
                              {genre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block select-none text-sm font-medium text-neutral-300 mb-2">
                          Темп (BPM)
                        </label>
                        <input
                          type="number"
                          placeholder="140"
                          value={beatData.tempo}
                          onChange={(e) => setBeatData({...beatData, tempo: e.target.value})}
                          className="w-full h-10 p-2 bg-neutral-800 border border-neutral-600 rounded text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                          required
                          min="1"
                          max="552"
                        />
                      </div>

                      <div>
                        <label className="block select-none text-sm font-medium text-neutral-300 mb-2">
                          Тональность
                        </label>
                        <select
                          value={beatData.key}
                          onChange={(e) => setBeatData({...beatData, key: e.target.value})}
                          className="w-full select-none h-10 p-2 bg-neutral-800 border border-neutral-600 rounded text-white text-sm focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
                          required
                        >
                          <option value="">Выберите тональность</option>
                          {musicalKeys.map((key) => (
                            <option key={key} value={key}>
                              {key}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="select-none">
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                          Условия использования
                        </label>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="recording_tracks"
                              checked={beatData.terms_of_use.recording_tracks}
                              onChange={(e) => handleTermsOfUseChange('recording_tracks', e.target.checked)}
                              className="mr-2 w-4 h-4 rounded accent-red-600"
                            />
                            <label htmlFor="recording_tracks" className="text-sm text-neutral-300">
                              Запись треков
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="commercial_perfomance"
                              checked={beatData.terms_of_use.commercial_perfomance}
                              onChange={(e) => handleTermsOfUseChange('commercial_perfomance', e.target.checked)}
                              className="mr-2 w-4 h-4 rounded accent-red-600"
                            />
                            <label htmlFor="commercial_perfomance" className="text-sm text-neutral-300">
                              Коммерческое исполнение
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="rotation_on_the_radio"
                              checked={beatData.terms_of_use.rotation_on_the_radio}
                              onChange={(e) => handleTermsOfUseChange('rotation_on_the_radio', e.target.checked)}
                              className="mr-2 w-4 h-4 rounded accent-red-600"
                            />
                            <label htmlFor="rotation_on_the_radio" className="text-sm text-neutral-300">
                              Ротация на радио
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="music_video_recording"
                              checked={beatData.terms_of_use.music_video_recording}
                              onChange={(e) => handleTermsOfUseChange('music_video_recording', e.target.checked)}
                              className="mr-2 w-4 h-4 rounded accent-red-600"
                            />
                            <label htmlFor="music_video_recording" className="text-sm text-neutral-300">
                              Съемка музыкального видео
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="release_of_copies"
                              checked={beatData.terms_of_use.release_of_copies}
                              onChange={(e) => handleTermsOfUseChange('release_of_copies', e.target.checked)}
                              className="mr-2 w-4 h-4 rounded accent-red-600"
                            />
                            <label htmlFor="release_of_copies" className="text-sm text-neutral-300">
                              Выпуск копий
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-neutral-700 pt-4 select-none">
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                          Теги (макс. 10)
                        </label>

                        <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
                          {tags.map((tag, index) => (
                            <div
                              key={index}
                              className="bg-neutral-800 border border-red-600 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 group hover:bg-neutral-700 transition-colors"
                            >
                              <span>#{tag}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="text-neutral-400 hover:text-red-500 transition-colors focus:outline-none cursor-pointer"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                          
                          {tags.length === 0 && (
                            <span className="text-xs text-neutral-500 italic">
                              Теги не добавлены
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2 select-none">
                          <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            placeholder="Введите тег"
                            className="flex-1 h-8 p-2 bg-neutral-800 border border-neutral-600 rounded text-white text-xs focus:outline-none focus:border-red-500 transition-colors"
                            disabled={tags.length >= 10}
                          />
                          <button
                            type="button"
                            onClick={handleAddTag}
                            disabled={tags.length >= 10 || !tagInput.trim()}
                            className="px-3 h-8 bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white text-xs rounded transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="mt-2 text-xs text-neutral-500">
                          {tags.length}/10 тегов
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-neutral-700 pt-4">
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="is_free"
                        checked={beatData.is_free}
                        onChange={(e) => setBeatData({ ...beatData, is_free: e.target.checked })}
                        className="mr-2 accent-red-600"
                      />
                      <label htmlFor="is_free" className="text-lg select-none font-medium text-white">
                        Бесплатно
                      </label>
                    </div>
                    {!beatData.is_free && (
                      <>
                        <h3 className="text-sm text-white mb-4 select-none">При добавлении платного бита сервис прибавляет к цене комиссионные 200 р. к стоимости бита.</h3>
                        <div className="grid grid-cols-1 gap-4">
                          {tariffs.map((tariff) => (
                            <div key={tariff.name} className="flex items-center space-x-4">
                              <label className="flex-1 text-sm font-medium text-neutral-300">
                                {tariff.display_name}
                                {tariff.description && (
                                  <span className="block text-xs text-neutral-500 mt-1">
                                    {tariff.description}
                                  </span>
                                )}
                              </label>
                              <input
                                type="number"
                                placeholder="Цена"
                                value={beatData.pricings[tariff.name] || ''}
                                onChange={(e) => handlePricingChange(tariff.name, e.target.value)}
                                className="w-32 h-10 p-3 bg-neutral-800 border border-neutral-600 rounded text-white focus:outline-none focus:border-red-500 transition-colors"
                                min="0"
                                step="0.01"
                              />
                              <span className="text-neutral-400">₽</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div className='text-center'>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full select-none cursor-pointer max-w-100 mx-auto bg-red-600 hover:bg-red-700 text-white p-3 rounded font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Отправка на модерацию...' : 'Отправить на модерацию'}
                    </button>
                  </div>

                </form>

                <div className="mt-4 text-center">
                  <p className="text-neutral-400 select-none text-sm">
                    * - обязательные поля
                  </p>
                </div>
              </div>
            </div>
          </animated.div>
        )
      )}

      {rulesOverlayTransition((style, item) =>
        item && (
          <animated.div
            style={style}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60"
            onClick={() => setShowRules(false)}
          />
        )
      )}

      {rulesModalTransition((style, item) =>
        item && (
          <animated.div
            style={style}
            className="fixed inset-0 flex items-center justify-center z-70 p-4"
          >
            <div className="bg-neutral-900 rounded-lg w-full max-w-md border border-neutral-800 shadow-2xl">
              <div className="p-6 border-b border-neutral-800">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white select-none">
                    Правила добавления бита
                  </h3>
                  <button
                    onClick={() => setShowRules(false)}
                    className="text-neutral-400 cursor-pointer hover:text-white transition-colors"
                    aria-label="Закрыть"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <p className="text-neutral-300 mb-4 select-none">
                  После добавления бит отправляется на модерацию, чтобы он не был отклонен следуйте требованиям:
                </p>
                <ul className="space-y-4 text-m text-neutral-300 select-none">
                  <li>• В бите обязательно должен быть авторский войстег</li>
                  <li>• Бит должен быть оригинальным и не украденным</li>
                  <li>• Бит должен соответствовать выбранному жанру</li>
                  <li>• Название бита должно быть адекватным</li>
                  <li>• Темп и тональность должны быть указаны корректно</li>
                  <li>• Аудиофайл должен быть качественным и без посторонних шумов</li>
                  <li>• Запрещено добавлять контент, нарушающий авторские права</li>
                </ul>
              </div>
            </div>
          </animated.div>
        )
      )}
    </>
  );
};

export default AddBeatModal;