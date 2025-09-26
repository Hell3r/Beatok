import React, { useState, useEffect } from 'react';
import BeatTable from '../components/BeatTable';
import BeatList from '../components/BeatList';
import ViewToggle from '../components/ViewToggle';
import { beatService } from '../services/beatService';
import type { Beat } from '../types/Beat';

type ViewMode = 'table' | 'grid';

const BeatsPage: React.FC = () => {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  useEffect(() => {
    loadBeats();
  }, []);

  const loadBeats = async () => {
    try {
      setLoading(true);
      const data = await beatService.getBeats();
      setBeats(data);
    } catch (error) {
      console.error('Error loading beats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (beat: Beat) => {
    console.log('Play:', beat);
  };

  const handleDownload = (beat: Beat) => {
    console.log('Download:', beat);
  };

  const handleEdit = (beat: Beat) => {
    console.log('Edit:', beat);
  };

  const handleDelete = (beat: Beat) => {
    console.log('Delete:', beat);
  };

  return (
    <div className="min-h-screen bg-neutral-900 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Библиотека битов</h1>
            <p className="text-neutral-400">
              Всего битов: <span className="text-white font-semibold">{beats.length}</span>
            </p>
          </div>
          
          <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-neutral-400 mt-4">Загрузка битов...</p>
          </div>
        ) : viewMode === 'table' ? (
          <BeatTable 
            beats={beats}
            loading={loading}
            onPlay={handlePlay}
            onDownload={handleDownload}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <BeatList 
            beats={beats}
            loading={loading}
            onPlay={handlePlay}
            onDownload={handleDownload}
          />
        )}
      </div>
    </div>
  );
};

export default BeatsPage;