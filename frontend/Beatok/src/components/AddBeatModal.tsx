import React, { useState } from 'react';

interface AddBeatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const musicalKeys = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
];

const genres = [
  'hip-hop', 'trap', 'lo-fi', 'r&b', 'pop', 'rock', 'electronic', 'other'
];

const AddBeatModal: React.FC<AddBeatModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [beatData, setBeatData] = useState({
    name: '',
    genre: '',
    tempo: '',
    key: '',
    mp3_file: null as File | null,
    wav_file: null as File | null
  });

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

      // Сброс формы
      setBeatData({
        name: '',
        genre: '',
        tempo: '',
        key: '',
        mp3_file: null,
        wav_file: null
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
          <div className="relative bg-neutral-900 rounded-lg w-full max-w-2xl max-h-xl border border-neutral-800 shadow-2xl">
            <button
              onClick={onClose}
              className="absolute select-none -top-3 -right-3 cursor-pointer bg-neutral-800 hover:bg-neutral-700 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 z-10 shadow-lg"
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
