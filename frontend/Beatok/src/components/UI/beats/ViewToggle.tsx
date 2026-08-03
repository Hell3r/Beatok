import React from 'react';

type ViewMode = 'table' | 'grid';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="nav-shell flex items-center gap-1 rounded-full p-1.5">
      <button
        onClick={() => onViewChange('grid')}
        className={`beat-view-toggle-button flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${
          currentView === 'grid'
            ? 'beat-view-toggle-button--active'
            : 'beat-view-toggle-button--inactive'
        }`}
        title="Сетка"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span className="hidden lg:inline">Сетка</span>
      </button>

      <button
        onClick={() => onViewChange('table')}
        className={`beat-view-toggle-button flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${
          currentView === 'table'
            ? 'beat-view-toggle-button--active'
            : 'beat-view-toggle-button--inactive'
        }`}
        title="Таблица"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span className="hidden lg:inline">Таблица</span>
      </button>
    </div>
  );
};

export default ViewToggle;
