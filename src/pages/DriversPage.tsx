import React, { useState, useEffect, useRef } from 'react';
import { User, Phone, Mail, Award, Check, X, Plus, Edit2, Trash2, Calendar, Eye } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Driver } from '../types';

const DriversPage: React.FC = () => {
  const { drivers, addDriver, updateDriver, deleteDriver, getDriverPlans } = useData();
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [newDriver, setNewDriver] = useState<Partial<Driver>>({
    name: '',
    licenseNumber: '',
    phone: '',
    email: '',
    experienceYears: 0,
    isAvailable: true,
    schedule: []
  });

  const handleAddDriver = () => {
    if (newDriver.name && newDriver.licenseNumber && newDriver.phone && newDriver.email) {
      addDriver(newDriver as Omit<Driver, 'id'>);
      setNewDriver({
        name: '',
        licenseNumber: '',
        phone: '',
        email: '',
        experienceYears: 0,
        isAvailable: true,
        schedule: []
      });
      setShowAddModal(false);
    }
  };

  const handleEditDriver = () => {
    if (editingDriver) {
      updateDriver(editingDriver.id, editingDriver);
      setShowEditModal(false);
      setEditingDriver(null);
    }
  };

  const handleDeleteDriver = (driverId: string) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      deleteDriver(driverId);
    }
  };

  const viewDriverSchedule = (driver: Driver) => {
    setEditingDriver(driver);
    setShowScheduleModal(true);
  };

  // Clock in/out functions for drivers

  // Driver function: Clock in
  const clockIn = (driver: Driver) => {
    const now = new Date();
    
    // Check if driver has any plans
    const driverPlans = getDriverPlans(driver.id);
    if (driverPlans.length === 0) {
      alert('❌ Cannot clock in: No plans assigned to this driver');
      return;
    }
    
    // Check if driver has planned shift time
    if (!driver.workingHours.plannedShiftStartTime) {
      alert('❌ Cannot clock in: No planned shift time set by planner');
      return;
    }
    
    // Check if it's too early to clock in
    const plannedStart = new Date(driver.workingHours.plannedShiftStartTime);
    if (now < plannedStart) {
      const timeDiff = (plannedStart.getTime() - now.getTime()) / (1000 * 60); // minutes
      alert(`❌ Cannot clock in: Too early. Planned start time is ${plannedStart.toLocaleTimeString()} (${Math.floor(timeDiff)} minutes from now)`);
      return;
    }
    
    // Update driver with actual clock-in time
    const updatedDriver = {
      ...driver,
      isAvailable: false, // Mark as busy when shift starts
      workingHours: {
        ...driver.workingHours,
        shiftStartTime: now.toISOString(),
        lastWorkDate: now.toISOString().split('T')[0]
      }
    };
    
    updateDriver(driver.id, updatedDriver);
    alert(`✅ ${driver.name} clocked in at ${now.toLocaleTimeString()}`);
  };

  // Driver function: Clock out
  const clockOut = (driver: Driver) => {
    const now = new Date();
    const startTime = driver.workingHours.shiftStartTime ? new Date(driver.workingHours.shiftStartTime) : now;
    
    // Calculate total shift duration
    const shiftDuration = (now.getTime() - startTime.getTime()) / (1000 * 60); // in minutes
    const totalDailyHours = shiftDuration;
    const totalWeeklyHours = driver.workingHours.weeklyHoursWorked + shiftDuration;
    
    // Update driver with shift end and total working hours
    const updatedDriver = {
      ...driver,
      isAvailable: true, // Mark as available when shift ends
      workingHours: {
        ...driver.workingHours,
        dailyHoursWorked: Math.min(totalDailyHours, 900), // Cap at 15 hours
        weeklyHoursWorked: Math.min(totalWeeklyHours, 3600), // Cap at 60 hours
        shiftStartTime: undefined, // Clear shift start time
        lastWorkDate: now.toISOString().split('T')[0]
      }
    };
    
    updateDriver(driver.id, updatedDriver);
    alert(`✅ ${driver.name} clocked out at ${now.toLocaleTimeString()}. Total: ${Math.floor(shiftDuration / 60)}h ${Math.floor(shiftDuration % 60)}m`);
  };

  const isDriverOnShift = (driver: Driver): boolean => {
    return !!driver.workingHours.shiftStartTime && !driver.isAvailable;
  };

  const getShiftStatus = (driver: Driver): string => {
    const now = new Date();
    
    if (driver.workingHours.shiftStartTime) {
      const startTime = new Date(driver.workingHours.shiftStartTime);
      const hoursWorked = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      return `🟢 On Shift since ${startTime.toLocaleTimeString()} (${Math.floor(hoursWorked)}h ${Math.floor((hoursWorked % 1) * 60)}m)`;
    }
    
    if (driver.workingHours.plannedShiftStartTime) {
      const plannedStart = new Date(driver.workingHours.plannedShiftStartTime);
      if (now < plannedStart) {
        const minutesUntil = (plannedStart.getTime() - now.getTime()) / (1000 * 60);
        return `⏳ Planned shift at ${plannedStart.toLocaleTimeString()} (${Math.floor(minutesUntil)}m remaining)`;
      } else {
        return `🔴 Shift scheduled (not clocked in) - ${plannedStart.toLocaleTimeString()}`;
      }
    }
    
    return '❌ No planned shift';
  };

  const canDriverClockIn = (driver: Driver): { canClock: boolean; reason?: string } => {
    const driverPlans = getDriverPlans(driver.id);
    if (driverPlans.length === 0) {
      return { canClock: false, reason: 'No plans assigned' };
    }
    
    if (!driver.workingHours.plannedShiftStartTime) {
      return { canClock: false, reason: 'No planned shift time' };
    }
    
    const now = new Date();
    const plannedStart = new Date(driver.workingHours.plannedShiftStartTime);
    if (now < plannedStart) {
      return { canClock: false, reason: 'Too early to clock in' };
    }
    
    return { canClock: true };
  };

  // Use refs to avoid stale closure issues
  const driversRef = useRef(drivers);
  const updateDriverRef = useRef(updateDriver);
  
  // Update refs when values change
  useEffect(() => {
    driversRef.current = drivers;
  }, [drivers]);
  
  useEffect(() => {
    updateDriverRef.current = updateDriver;
  }, [updateDriver]);

  // Auto-update working hours for drivers on shift
  useEffect(() => {
    const updateWorkingHours = () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Use ref to get fresh data without causing re-renders
      const currentDrivers = driversRef.current;
      const updateFn = updateDriverRef.current;
      
      currentDrivers.forEach((driver: Driver) => {
        if (driver.workingHours.shiftStartTime && !driver.isAvailable) {
          const shiftStart = new Date(driver.workingHours.shiftStartTime);
          const hoursWorked = (now.getTime() - shiftStart.getTime()) / (1000 * 60); // in minutes
          
          // Only update if it's a different day or significant time change
          if (driver.workingHours.lastWorkDate !== today || Math.abs(hoursWorked - driver.workingHours.dailyHoursWorked) > 5) {
            const updatedDriver = {
              ...driver,
              workingHours: {
                ...driver.workingHours,
                dailyHoursWorked: Math.min(hoursWorked, 900), // Cap at 15 hours
                lastWorkDate: today
              }
            };
            updateFn(driver.id, updatedDriver);
          }
        }
      });
    };

    // Update every 5 minutes
    const interval = setInterval(updateWorkingHours, 5 * 60 * 1000);
    
    // Initial update
    updateWorkingHours();

    return () => clearInterval(interval);
  }, []); // No dependencies - uses refs for fresh data

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>Drivers</h1>
          <p style={{ color: '#6b7280' }}>Manage your driver fleet</p>
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
          Add Driver
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {drivers.map((driver: Driver) => (
          <div
            key={driver.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              padding: '1.5rem',
              border: selectedDriver === driver.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
              cursor: 'pointer'
            }}
            onClick={() => setSelectedDriver(selectedDriver === driver.id ? null : driver.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ backgroundColor: '#f3f4f6', padding: '0.75rem', borderRadius: '50%' }}>
                  <User style={{ height: '1.5rem', width: '1.5rem', color: '#6b7280' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>{driver.name}</h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>{driver.licenseNumber}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {(() => {
                  // Check if driver is currently working based on schedule
                  const now = new Date();
                  const isCurrentlyWorking = driver.schedule.some((scheduled: any) => {
                    const scheduledStart = new Date(scheduled.startTime);
                    const scheduledEnd = new Date(scheduled.endTime);
                    return now >= scheduledStart && now <= scheduledEnd && scheduled.status === 'in-progress';
                  });
                  
                  if (isCurrentlyWorking) {
                    return (
                      <div style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.75rem', fontWeight: '500', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        🚛 Working
                      </div>
                    );
                  } else if (driver.isAvailable) {
                    return (
                      <div style={{ backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.75rem', fontWeight: '500', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Check style={{ height: '0.75rem', width: '0.75rem' }} />
                        Available
                      </div>
                    );
                  } else {
                    return (
                      <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', fontWeight: '500', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <X style={{ height: '0.75rem', width: '0.75rem' }} />
                        Busy
                      </div>
                    );
                  }
                })()}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone style={{ height: '1rem', width: '1rem', color: '#9ca3af' }} />
                <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>{driver.phone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail style={{ height: '1rem', width: '1rem', color: '#9ca3af' }} />
                <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>{driver.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award style={{ height: '1rem', width: '1rem', color: '#9ca3af' }} />
                <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>{driver.experienceYears} years experience</span>
              </div>
            </div>

            {selectedDriver === driver.id && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                {/* Shift Status Display */}
                <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.25rem', fontWeight: '500' }}>Shift Status</div>
                  <div style={{ fontSize: '0.875rem', color: '#1e293b' }}>
                    {getShiftStatus(driver)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Daily hours: {Math.floor(driver.workingHours.dailyHoursWorked / 60)}h {driver.workingHours.dailyHoursWorked % 60}m / 15h
                  </div>
                  {driver.workingHours.plannedShiftStartTime && (
                    <div style={{ fontSize: '0.75rem', color: '#6366f1', marginTop: '0.25rem' }}>
                      📋 Planned: {new Date(driver.workingHours.plannedShiftStartTime).toLocaleTimeString()} - {driver.workingHours.plannedShiftEndTime ? new Date(driver.workingHours.plannedShiftEndTime).toLocaleTimeString() : 'TBD'}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingDriver(driver);
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
                      viewDriverSchedule(driver);
                    }}
                    style={{ backgroundColor: '#059669', color: 'white', padding: '0.5rem 1rem', fontSize: '0.875rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Calendar size={14} />
                    Schedule
                  </button>
                  {/* Driver Buttons: Clock In/Out */}
                  {isDriverOnShift(driver) ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        clockOut(driver);
                      }}
                      style={{ 
                        backgroundColor: '#f59e0b', 
                        color: 'white', 
                        padding: '0.5rem 1rem', 
                        fontSize: '0.875rem', 
                        borderRadius: '0.375rem', 
                        border: 'none', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.25rem' 
                      }}
                    >
                      ⏰ Clock Out
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const clockInCheck = canDriverClockIn(driver);
                        if (clockInCheck.canClock) {
                          clockIn(driver);
                        } else {
                          alert(`❌ Cannot clock in: ${clockInCheck.reason}`);
                        }
                      }}
                      style={{ 
                        backgroundColor: canDriverClockIn(driver).canClock ? '#059669' : '#9ca3af', 
                        color: 'white', 
                        padding: '0.5rem 1rem', 
                        fontSize: '0.875rem', 
                        borderRadius: '0.375rem', 
                        border: 'none', 
                        cursor: canDriverClockIn(driver).canClock ? 'pointer' : 'not-allowed', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.25rem' 
                      }}
                    >
                      ⏰ Clock In
                    </button>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDriver(driver.id);
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

      {/* Add Driver Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', minWidth: '500px', maxWidth: '90vw', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>Add New Driver</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Name</label>
                <input
                  type="text"
                  value={newDriver.name || ''}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, name: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>License Number</label>
                <input
                  type="text"
                  value={newDriver.licenseNumber || ''}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, licenseNumber: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Phone</label>
                <input
                  type="text"
                  value={newDriver.phone || ''}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, phone: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Email</label>
                <input
                  type="email"
                  value={newDriver.email || ''}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, email: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Experience (Years)</label>
                <input
                  type="number"
                  value={newDriver.experienceYears || 0}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, experienceYears: parseInt(e.target.value) || 0 }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Available</label>
                <select
                  value={newDriver.isAvailable ? 'true' : 'false'}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, isAvailable: e.target.value === 'true' }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                >
                  <option value="true">Available</option>
                  <option value="false">Busy</option>
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
                onClick={handleAddDriver}
                style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', backgroundColor: '#2563eb', color: 'white', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                Add Driver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Driver Modal */}
      {showEditModal && editingDriver && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', minWidth: '500px', maxWidth: '90vw', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>Edit Driver</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Name</label>
                <input
                  type="text"
                  value={editingDriver.name}
                  onChange={(e) => setEditingDriver({ ...editingDriver, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>License Number</label>
                <input
                  type="text"
                  value={editingDriver.licenseNumber}
                  onChange={(e) => setEditingDriver({ ...editingDriver, licenseNumber: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Phone</label>
                <input
                  type="text"
                  value={editingDriver.phone}
                  onChange={(e) => setEditingDriver({ ...editingDriver, phone: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Email</label>
                <input
                  type="email"
                  value={editingDriver.email}
                  onChange={(e) => setEditingDriver({ ...editingDriver, email: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Experience (Years)</label>
                <input
                  type="number"
                  value={editingDriver.experienceYears}
                  onChange={(e) => setEditingDriver({ ...editingDriver, experienceYears: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Available</label>
                <select
                  value={editingDriver.isAvailable ? 'true' : 'false'}
                  onChange={(e) => setEditingDriver({ ...editingDriver, isAvailable: e.target.value === 'true' })}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                >
                  <option value="true">Available</option>
                  <option value="false">Busy</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDriver(null);
                }}
                style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white', color: '#374151', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditDriver}
                style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', backgroundColor: '#2563eb', color: 'white', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Schedule Modal */}
      {showScheduleModal && editingDriver && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', minWidth: '800px', maxWidth: '95vw', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
              📅 Schedule for {editingDriver.name}
            </h3>
            
            {/* Working Hours Summary */}
            <div style={{ backgroundColor: '#f3f4f6', borderRadius: '0.375rem', padding: '1rem', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', margin: '0 0 0.5rem 0' }}>Working Hours Status</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Today</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '600', color: editingDriver.workingHours.dailyHoursWorked > 720 ? '#dc2626' : '#059669' }}>
                    {Math.floor(editingDriver.workingHours.dailyHoursWorked / 60)}h {editingDriver.workingHours.dailyHoursWorked % 60}m / 15h
                  </div>
                  <div style={{ 
                    width: '100%', 
                    height: '0.5rem', 
                    backgroundColor: '#e5e7eb', 
                    borderRadius: '0.25rem', 
                    marginTop: '0.25rem' 
                  }}>
                    <div style={{ 
                      width: `${Math.min((editingDriver.workingHours.dailyHoursWorked / 900) * 100, 100)}%`, 
                      height: '100%', 
                      backgroundColor: editingDriver.workingHours.dailyHoursWorked > 720 ? '#dc2626' : '#059669', 
                      borderRadius: '0.25rem' 
                    }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>This Week</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '600', color: editingDriver.workingHours.weeklyHoursWorked > 3000 ? '#dc2626' : '#059669' }}>
                    {Math.floor(editingDriver.workingHours.weeklyHoursWorked / 60)}h {editingDriver.workingHours.weeklyHoursWorked % 60}m / 60h
                  </div>
                  <div style={{ 
                    width: '100%', 
                    height: '0.5rem', 
                    backgroundColor: '#e5e7eb', 
                    borderRadius: '0.25rem', 
                    marginTop: '0.25rem' 
                  }}>
                    <div style={{ 
                      width: `${Math.min((editingDriver.workingHours.weeklyHoursWorked / 3600) * 100, 100)}%`, 
                      height: '100%', 
                      backgroundColor: editingDriver.workingHours.weeklyHoursWorked > 3000 ? '#dc2626' : '#059669', 
                      borderRadius: '0.25rem' 
                    }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Available Hours Today</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                    {Math.floor((900 - editingDriver.workingHours.dailyHoursWorked) / 60)}h {(900 - editingDriver.workingHours.dailyHoursWorked) % 60}m
                  </div>
                </div>
                {editingDriver.workingHours.shiftStartTime && (
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Shift Started</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                      {new Date(editingDriver.workingHours.shiftStartTime).toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {(() => {
              const driverPlans = getDriverPlans(editingDriver.id);
              return (
                <div>
                  {driverPlans.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      <Calendar style={{ margin: '0 auto 1rem auto', height: '3rem', width: '3rem', color: '#9ca3af' }} />
                      <p>No saved plans for this driver</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
                      {driverPlans.map((plan, index) => {
                        const totalPlanDuration = plan.items.reduce((total: number, item: any) => total + (item.estimatedDuration || 60), 0);
                        const planStartTime = plan.items.length > 0 && plan.items[0].startTime ? new Date(plan.items[0].startTime) : null;
                        const planEndTime = plan.items.length > 0 && plan.items[plan.items.length - 1].endTime ? new Date(plan.items[plan.items.length - 1].endTime) : null;
                        
                        return (
                          <div key={`${plan.driverId}-${plan.createdAt}`} style={{ 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '0.5rem', 
                            padding: '1rem',
                            backgroundColor: '#f9fafb'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                              <div>
                                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', margin: '0 0 0.25rem 0' }}>
                                  Plan #{index + 1} - {plan.planType.charAt(0).toUpperCase() + plan.planType.slice(1)}
                                </h4>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                                  {plan.items.length} stops • Duration: {Math.floor(totalPlanDuration / 60)}h {totalPlanDuration % 60}m
                                </p>
                                {planStartTime && planEndTime && (
                                  <p style={{ fontSize: '0.75rem', color: '#374151', margin: '0.25rem 0 0 0' }}>
                                    ⏰ {planStartTime.toLocaleTimeString()} - {planEndTime.toLocaleTimeString()}
                                  </p>
                                )}
                              </div>
                              <span style={{ 
                                backgroundColor: plan.planType === 'international' ? '#fef3c7' : '#dbeafe',
                                color: plan.planType === 'international' ? '#92400e' : '#1e40af',
                                fontSize: '0.75rem', 
                                fontWeight: '500', 
                                padding: '0.25rem 0.5rem', 
                                borderRadius: '0.25rem' 
                              }}>
                                {plan.planType === 'international' ? '🌍' : '🏠'} {plan.planType}
                              </span>
                            </div>
                            
                            {/* Detailed Stop List */}
                            <div style={{ marginBottom: '0.75rem' }}>
                              <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', margin: '0 0 0.5rem 0' }}>Stops:</h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {plan.items.map((item: any, stopIndex: number) => (
                                  <div key={item.id} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.75rem', 
                                    padding: '0.5rem', 
                                    backgroundColor: 'white', 
                                    borderRadius: '0.25rem',
                                    fontSize: '0.875rem'
                                  }}>
                                    <div style={{ 
                                      minWidth: '1.5rem', 
                                      height: '1.5rem', 
                                      backgroundColor: item.jobType === 'delivery' ? '#dcfce7' : item.jobType === 'collection' ? '#fef2f2' : '#fff3cd',
                                      color: item.jobType === 'delivery' ? '#166534' : item.jobType === 'collection' ? '#dc2626' : '#8b5a00',
                                      borderRadius: '50%', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center',
                                      fontSize: '0.75rem',
                                      fontWeight: '600'
                                    }}>
                                      {stopIndex + 1}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontWeight: '500', color: '#111827' }}>
                                        {item.jobType === 'trailer_change' ? 
                                          `🔄 ${item.dropOffLocation?.companyName} → ${item.pickUpLocation?.companyName}` :
                                          `${item.jobType === 'delivery' ? '🚚' : '📦'} ${item.address.companyName}`
                                        }
                                      </div>
                                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                        {item.address.city}, {item.address.country}
                                        {item.startTime && item.endTime && (
                                          <span style={{ marginLeft: '0.5rem' }}>
                                            • {new Date(item.startTime).toLocaleTimeString()} - {new Date(item.endTime).toLocaleTimeString()}
                                          </span>
                                        )}
                                      </div>
                                      {item.notes && (
                                        <div style={{ fontSize: '0.75rem', color: '#4b5563', fontStyle: 'italic', marginTop: '0.25rem' }}>
                                          {item.notes}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div style={{ fontSize: '0.875rem', color: '#4b5563', borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <div>🚚 Deliveries: {plan.items.filter((item: any) => item.jobType === 'delivery').length}</div>
                                <div>📦 Collections: {plan.items.filter((item: any) => item.jobType === 'collection').length}</div>
                                <div>🔄 Trailer Changes: {plan.items.filter((item: any) => item.jobType === 'trailer_change').length}</div>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                Created: {new Date(plan.createdAt).toLocaleString()} • Last updated: {new Date(plan.updatedAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                      <strong>Current Status:</strong> {editingDriver.isAvailable ? '✅ Available' : '🔴 Busy'}
                    </p>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setEditingDriver(null);
                }}
                style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white', color: '#374151', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default DriversPage; 