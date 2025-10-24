import React, { useState, useEffect } from 'react';
import { beatService, type Tariff, type BeatPricingCreate } from '../services/beatService';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tariffs, setTariffs] = useState<Tariff[]>([]);

  const [beatData, setBeatData] = useState({
    name: '',
    genre: '',
    tempo: '',
    key: '',
    mp3_file: null as File | null,
    wav_file: null as File | null,
    pricings: {} as Record<string, string>,
    is_free: false
  });

  useEffect(() => {
    if (isOpen) {
      loadTariffs();
    }
  }, [isOpen]);

  const loadTariffs = async () => {
    try {
      const tariffsData = await beatService.getTariffs();
      setTariffs(tariffsData);
    } catch (err) {
      console.error('Ошибка загрузки тарифов:', err);
    }
  };

  if (!isOpen) return null;

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

      if (!response.ok) {
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
        is_free: false
      });

      onClose();
      alert('Бит успешно отправлен на модерацию!');

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

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"
          onClick={onClose}
        />
      )}

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="relative bg-neutral-900 rounded-lg w-full max-w-4xl max-h-[95vh] border border-neutral-800 shadow-2xl">
            <button
              onClick={onClose}
              className="absolute select-none -top-3 -right-2 cursor-pointer bg-neutral-800 hover:bg-neutral-700 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 z-10 shadow-lg"
              aria-label="Закрыть"
            >
              ×
            </button>

            <div className="p-6 border-b border-neutral-800 text-center" >
              <h2 className="text-xl select-none font-bold text-white">
                Добавить бит
              </h2>
            </div>

            <div className="p-4">
              {error && (
                <div className="mb-4 p-3 bg-red-900/80 border border-red-700 rounded text-red-200 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium select-none text-neutral-300 mb-2">
                        Название бита *
                      </label>
                      <input
                        type="text"
                        placeholder="Введите название бита"
                        value={beatData.name}
                        onChange={(e) => setBeatData({...beatData, name: e.target.value})}
                        className="w-full h-12 p-3 bg-neutral-800 border border-neutral-600 rounded text-white focus:outline-none focus:border-red-500 transition-colors"
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
                        className="w-full h-12 p-1 bg-neutral-800 border border-neutral-600 rounded text-white focus:outline-none focus:border-red-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer select-none"
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
                        className="w-full h-12 p-1 bg-neutral-800 border border-neutral-600 rounded text-white focus:outline-none focus:border-red-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer select-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block select-none text-sm font-medium text-neutral-300 mb-2">
                        Жанр *
                      </label>
                      <select
                        value={beatData.genre}
                        onChange={(e) => setBeatData({...beatData, genre: e.target.value})}
                        className="w-full h-12 p-3 bg-neutral-800 border border-neutral-600 rounded text-white focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
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
                        Темп (BPM) *
                      </label>
                      <input
                        type="number"
                        placeholder="Например: 140"
                        value={beatData.tempo}
                        onChange={(e) => setBeatData({...beatData, tempo: e.target.value})}
                        className="w-full h-12 p-3 bg-neutral-800 border border-neutral-600 rounded text-white focus:outline-none focus:border-red-500 transition-colors"
                        required
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block select-none text-sm font-medium text-neutral-300 mb-2">
                        Тональность *
                      </label>
                      <select
                        value={beatData.key}
                        onChange={(e) => setBeatData({...beatData, key: e.target.value})}
                        className="w-full h-12 p-3 bg-neutral-800 border border-neutral-600 rounded text-white focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
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
                </div>

                <div className="border-t border-neutral-700 pt-4">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="is_free"
                      checked={beatData.is_free}
                      onChange={(e) => setBeatData({ ...beatData, is_free: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="is_free" className="text-lg font-medium text-white">
                      Бесплатно
                    </label>
                  </div>
                  {!beatData.is_free && (
                    <>
                      <h3 className="text-lg font-medium text-white mb-4">Цены по тарифам</h3>
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
                              className="w-32 h-12 p-3 bg-neutral-800 border border-neutral-600 rounded text-white focus:outline-none focus:border-red-500 transition-colors"
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
        </div>
      )}
    </>
  );
};

export default AddBeatModal;
