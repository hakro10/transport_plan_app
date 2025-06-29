import React, { useState } from 'react';
import { Package2, Gauge, Ruler, Check, X, Plus, Edit2, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Trailer } from '../types';

const TrailersPage: React.FC = () => {
  const { trailers, addTrailer, updateTrailer, deleteTrailer } = useData();
  const [selectedTrailer, setSelectedTrailer] = useState<string | null>(null);

  const getTrailerIcon = (type: string) => {
    switch (type) {
      case 'refrigerated':
        return '❄️';
      case 'tanker':
        return '🛢️';
      case 'flatbed':
        return '📦';
      default:
        return '🚛';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>Trailers</h1>
          <p style={{ color: '#6b7280' }}>Manage your trailer fleet</p>
        </div>
        <button
          onClick={() => alert('Add trailer functionality (quick implementation)')}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Plus size={16} />
          Add Trailer
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {trailers.map((trailer: Trailer) => (
          <div
            key={trailer.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              padding: '1.5rem',
              border: selectedTrailer === trailer.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
              cursor: 'pointer'
            }}
            onClick={() => setSelectedTrailer(selectedTrailer === trailer.id ? null : trailer.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ backgroundColor: '#f3f4f6', padding: '0.75rem', borderRadius: '50%' }}>
                  <Package2 style={{ height: '1.5rem', width: '1.5rem', color: '#6b7280' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>{trailer.plateNumber}</h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                    {getTrailerIcon(trailer.type)} {trailer.type.charAt(0).toUpperCase() + trailer.type.slice(1)}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {trailer.isAvailable ? (
                  <div style={{ backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.75rem', fontWeight: '500', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Check style={{ height: '0.75rem', width: '0.75rem' }} />
                    Available
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', fontWeight: '500', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <X style={{ height: '0.75rem', width: '0.75rem' }} />
                    In Use
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Gauge style={{ height: '1rem', width: '1rem', color: '#9ca3af' }} />
                <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>Capacity: {trailer.capacity} tons</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Ruler style={{ height: '1rem', width: '1rem', color: '#9ca3af' }} />
                <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                  {trailer.dimensions.length}m × {trailer.dimensions.width}m × {trailer.dimensions.height}m
                </span>
              </div>
            </div>

            {selectedTrailer === trailer.id && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>Specifications</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                    <div>Length: {trailer.dimensions.length}m</div>
                    <div>Width: {trailer.dimensions.width}m</div>
                    <div>Height: {trailer.dimensions.height}m</div>
                    <div>Type: {trailer.type}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button style={{ backgroundColor: '#2563eb', color: 'white', padding: '0.5rem 1rem', fontSize: '0.875rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}>
                    Edit
                  </button>
                  <button style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '0.5rem 1rem', fontSize: '0.875rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}>
                    Maintenance
                  </button>
                  <button style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '0.5rem 1rem', fontSize: '0.875rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}>
                    Schedule
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrailersPage; 