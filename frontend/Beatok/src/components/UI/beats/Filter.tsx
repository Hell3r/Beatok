import React from 'react';

export interface Filters {
  name: string;
  author: string;
  genre: string;
  bpm: string;
  key: string;
  minPrice: string;
  maxPrice: string;
  freeOnly: boolean;
}

interface FilterProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

const musicalKeys = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
];

const Filter: React.FC<FilterProps> = ({ filters, onFiltersChange }) => {
  const handleFilterChange = (key: keyof Filters, value: string | boolean) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      name: '',
      author: '',
      genre: '',
      bpm: '',
      key: '',
      minPrice: '',
      maxPrice: '',
      freeOnly: false
    });
  };

  const handleFreeOnlyChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      freeOnly: checked,
      ...(checked && { minPrice: '', maxPrice: '' })
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== false
  );

  return (
    <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-700 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold text-lg">Фильтры</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-red-500 hover:text-red-400 text-sm transition-colors cursor-pointer"
          >
            Сбросить
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-neutral-400 text-sm mb-2">Название</label>
          <input
            type="text"
            value={filters.name}
            onChange={(e) => handleFilterChange('name', e.target.value)}
            placeholder="Поиск по названию..."
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-neutral-400 text-sm mb-2">Автор</label>
          <input
            type="text"
            value={filters.author}
            onChange={(e) => handleFilterChange('author', e.target.value)}
            placeholder="Поиск по автору..."
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-neutral-400 text-sm mb-2">Темп (BPM)</label>
          <input
            type="text"
            value={filters.bpm}
            onChange={(e) => handleFilterChange('bpm', e.target.value)}
            placeholder="BPM"
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-neutral-400 text-sm mb-2">Тональность</label>
          <select
            value={filters.key}
            onChange={(e) => handleFilterChange('key', e.target.value)}
            className="w-full bg-neutral-800 border cursor-pointer border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
          >
            <option className='cursor-pointer' value="">Все тональности</option>
            {musicalKeys.map((key) => (
              <option className='cursor-pointer' key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-neutral-400 text-sm mb-2">Жанр</label>
          <input
            type="text"
            value={filters.genre}
            onChange={(e) => handleFilterChange('genre', e.target.value)}
            placeholder="Поиск по жанру..."
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>

        <div className="space-y-3 space-x-4">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              id="freeOnly"
              checked={filters.freeOnly}
              onChange={(e) => handleFreeOnlyChange(e.target.checked)}
              className="w-5 h-5 text-red-600 bg-neutral-800 border-neutral-700 rounded cursor-pointer"
            />
            <label htmlFor="freeOnly" className="text-neutral-300 cursor-pointer">
              Только бесплатные
            </label>
          </div>

          {!filters.freeOnly && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-400 text-sm mb-2">Мин. цена</label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-sm mb-2">Макс. цена</label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  placeholder="1000"
                  min="0"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Filter;