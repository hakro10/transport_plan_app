import React, { useState } from 'react';
import { Truck, Calendar, Gauge, Fuel, Check, X, Plus, Edit2, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Truck as TruckType } from '../types';

const TrucksPage: React.FC = () => {
  const { trucks, addTruck, updateTruck, deleteTruck } = useData();
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTruck, setEditingTruck] = useState<TruckType | null>(null);
  const [newTruck, setNewTruck] = useState<Partial<TruckType>>({
    plateNumber: '',
    model: '',
    year: new Date().getFullYear(),
    capacity: 0,
    fuelType: 'diesel',
    isAvailable: true,
    schedule: []
  });

  const getFuelIcon = (fuelType: string) => {
    switch (fuelType) {
      case 'electric':
        return '⚡';
      case 'hybrid':
        return '🔋';
      default:
        return '⛽';
    }
  };

  const handleAddTruck = () => {
    if (newTruck.plateNumber && newTruck.model && newTruck.capacity) {
      addTruck(newTruck as Omit<TruckType, 'id'>);
      setNewTruck({
        plateNumber: '',
        model: '',
        year: new Date().getFullYear(),
        capacity: 0,
        fuelType: 'diesel',
        isAvailable: true,
        schedule: []
      });
      setShowAddModal(false);
    }
  };

  const handleEditTruck = () => {
    if (editingTruck) {
      updateTruck(editingTruck.id, editingTruck);
      setShowEditModal(false);
      setEditingTruck(null);
    }
  };

  const handleDeleteTruck = (truckId: string) => {
    if (window.confirm('Are you sure you want to delete this truck?')) {
      deleteTruck(truckId);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>Trucks</h1>
          <p style={{ color: '#6b7280' }}>Manage your truck fleet</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
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
          Add Truck
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {trucks.map((truck: TruckType) => (
          <div
            key={truck.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              padding: '1.5rem',
              border: selectedTruck === truck.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
              cursor: 'pointer'
            }}
            onClick={() => setSelectedTruck(selectedTruck === truck.id ? null : truck.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ backgroundColor: '#f3f4f6', padding: '0.75rem', borderRadius: '50%' }}>
                  <Truck style={{ height: '1.5rem', width: '1.5rem', color: '#6b7280' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>{truck.plateNumber}</h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>{truck.model}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {truck.isAvailable ? (
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
                <Calendar style={{ height: '1rem', width: '1rem', color: '#9ca3af' }} />
                <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>Year: {truck.year}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Gauge style={{ height: '1rem', width: '1rem', color: '#9ca3af' }} />
                <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>Capacity: {truck.capacity} tons</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Fuel style={{ height: '1rem', width: '1rem', color: '#9ca3af' }} />
                <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                  {getFuelIcon(truck.fuelType)} {truck.fuelType.charAt(0).toUpperCase() + truck.fuelType.slice(1)}
                </span>
              </div>
            </div>

            {selectedTruck === truck.id && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTruck(truck);
                      setShowEditModal(true);
                    }}
                    style={{ backgroundColor: '#2563eb', color: 'white', padding: '0.5rem 1rem', fontSize: '0.875rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTruck(truck.id);
                    }}
                    style={{ backgroundColor: '#dc2626', color: 'white', padding: '0.5rem 1rem', fontSize: '0.875rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Truck Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', minWidth: '500px', maxWidth: '90vw', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>Add New Truck</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Plate Number</label>
                <input
                  type="text"
                  value={newTruck.plateNumber || ''}
                  onChange={(e) => setNewTruck(prev => ({ ...prev, plateNumber: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Model</label>
                <input
                  type="text"
                  value={newTruck.model || ''}
                  onChange={(e) => setNewTruck(prev => ({ ...prev, model: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Year</label>
                <input
                  type="number"
                  value={newTruck.year || new Date().getFullYear()}
                  onChange={(e) => setNewTruck(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Capacity (tons)</label>
                <input
                  type="number"
                  value={newTruck.capacity || 0}
                  onChange={(e) => setNewTruck(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Fuel Type</label>
                <select
                  value={newTruck.fuelType || 'diesel'}
                  onChange={(e) => setNewTruck(prev => ({ ...prev, fuelType: e.target.value as 'diesel' | 'electric' | 'hybrid' }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                >
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Available</label>
                <select
                  value={newTruck.isAvailable ? 'true' : 'false'}
                  onChange={(e) => setNewTruck(prev => ({ ...prev, isAvailable: e.target.value === 'true' }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                >
                  <option value="true">Available</option>
                  <option value="false">In Use</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white', color: '#374151', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddTruck}
                style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', backgroundColor: '#2563eb', color: 'white', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                Add Truck
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Truck Modal */}
      {showEditModal && editingTruck && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', minWidth: '500px', maxWidth: '90vw', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>Edit Truck</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Plate Number</label>
                <input
                  type="text"
                  value={editingTruck.plateNumber}
                  onChange={(e) => setEditingTruck({ ...editingTruck, plateNumber: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Model</label>
                <input
                  type="text"
                  value={editingTruck.model}
                  onChange={(e) => setEditingTruck({ ...editingTruck, model: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Year</label>
                <input
                  type="number"
                  value={editingTruck.year}
                  onChange={(e) => setEditingTruck({ ...editingTruck, year: parseInt(e.target.value) || new Date().getFullYear() })}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Capacity (tons)</label>
                <input
                  type="number"
                  value={editingTruck.capacity}
                  onChange={(e) => setEditingTruck({ ...editingTruck, capacity: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Fuel Type</label>
                <select
                  value={editingTruck.fuelType}
                  onChange={(e) => setEditingTruck({ ...editingTruck, fuelType: e.target.value as 'diesel' | 'electric' | 'hybrid' })}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                >
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Available</label>
                <select
                  value={editingTruck.isAvailable ? 'true' : 'false'}
                  onChange={(e) => setEditingTruck({ ...editingTruck, isAvailable: e.target.value === 'true' })}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                >
                  <option value="true">Available</option>
                  <option value="false">In Use</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTruck(null);
                }}
                style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white', color: '#374151', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditTruck}
                style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', backgroundColor: '#2563eb', color: 'white', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrucksPage; 