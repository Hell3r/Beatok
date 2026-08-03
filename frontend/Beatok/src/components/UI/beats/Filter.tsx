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
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
  'Cm',
  'C#m',
  'Dm',
  'D#m',
  'Em',
  'Fm',
  'F#m',
  'Gm',
  'G#m',
  'Am',
  'A#m',
  'Bm',
];

const genres = [
  'Hip-Hop',
  'Trap',
  'Trap-Metal',
  'Lo-fi',
  'R&B',
  'Pop',
  'Rock',
  'Metal',
  'Electronic',
  'Dubstep',
  'Other',
];

const fieldClassName =
  'field-shell w-full px-4 py-2 text-sm text-white placeholder-neutral-500 transition-colors focus:outline-none';

const SelectArrow = () => (
  <svg
    className="hidden pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const Filter: React.FC<FilterProps> = ({ filters, onFiltersChange }) => {
  const handleFilterChange = (key: keyof Filters, value: string | boolean) => {
    onFiltersChange({
      ...filters,
      [key]: value,
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
      freeOnly: false,
    });
  };

  const handleFreeOnlyChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      freeOnly: checked,
      ...(checked && { minPrice: '', maxPrice: '' }),
    });
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== '' && value !== false);

  return (
    <div className="glass-panel-strong relative z-20 overflow-visible p-4 md:p-5 select-none">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="section-kicker">Фильтры</p>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-sm text-neutral-200 transition hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white"
          >
            Сбросить
          </button>
        )}
      </div>

      <div className="space-y-4 overflow-visible">
        <div>
          <label className="mb-1 block text-sm text-neutral-400">Поиск по названию или тегу</label>
          <input
            type="text"
            value={filters.name}
            onChange={(event) => handleFilterChange('name', event.target.value)}
            placeholder="Название, настроение, тег..."
            className={fieldClassName}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-400">Автор</label>
          <input
            type="text"
            value={filters.author}
            onChange={(event) => handleFilterChange('author', event.target.value)}
            placeholder="Найти автора..."
            className={fieldClassName}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-400">Темп (BPM)</label>
          <input
            type="text"
            value={filters.bpm}
            onChange={(event) => handleFilterChange('bpm', event.target.value)}
            placeholder="BPM"
            className={fieldClassName}
          />
        </div>

        <div className="relative z-30 overflow-visible">
          <label className="mb-1 block text-sm text-neutral-400">Тональность</label>
          <div className="relative">
            <select
              value={filters.key}
              onChange={(event) => handleFilterChange('key', event.target.value)}
              className={`${fieldClassName} relative z-30 cursor-pointer appearance-none pr-10`}
            >
                <option value="">Все тональности</option>
              {musicalKeys.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
            <SelectArrow />
          </div>
        </div>

        <div className="relative z-30 overflow-visible">
          <label className="mb-1 block text-sm text-neutral-400">Жанр</label>
          <div className="relative">
            <select
              value={filters.genre}
              onChange={(event) => handleFilterChange('genre', event.target.value)}
              className={`${fieldClassName} relative z-30 cursor-pointer appearance-none pr-10`}
            >
                <option value="">Все жанры</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
            <SelectArrow />
          </div>
        </div>

        <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <label htmlFor="freeOnly" className="flex cursor-pointer items-center gap-3 text-neutral-300 text-sm">
            <input
              type="checkbox"
              id="freeOnly"
              checked={filters.freeOnly}
              onChange={(event) => handleFreeOnlyChange(event.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-white/[0.15] bg-black/30 text-red-600"
            />
            Только бесплатные биты
          </label>

          {!filters.freeOnly && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                  <label className="mb-1 block text-sm text-neutral-400">Цена от</label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(event) => handleFilterChange('minPrice', event.target.value)}
                  placeholder="0"
                  min="0"
                  className={fieldClassName}
                />
              </div>

              <div>
                  <label className="mb-1 block text-sm text-neutral-400">Цена до</label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(event) => handleFilterChange('maxPrice', event.target.value)}
                  placeholder="1000"
                  min="0"
                  className={fieldClassName}
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
