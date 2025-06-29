import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ChevronDown, MapPin, Truck, User, Package2, AlertTriangle, Clock } from 'lucide-react';
import { mockDepotAddresses } from '../data/mockData';
import { useData } from '../context/DataContext';
import { PlanType, PlanItem, Driver, WorkingHours } from '../types';

interface DriverPlan {
  driverId: string;
  truckId: string;
  trailerId: string;
  planType: PlanType;
  items: PlanItem[];
  createdAt: string;
  updatedAt: string;
}

const Dashboard: React.FC = () => {
  const { drivers, trucks, trailers, customers, savedPlans, setSavedPlans, updateResourceSchedule, removeResourceSchedule, updateDriverStatus, setPlannedShiftTime, clearPlannedShiftTime, getDriverPlans } = useData();
  const [planType, setPlanType] = useState<PlanType>('local');
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedTruck, setSelectedTruck] = useState<string>('');
  const [selectedTrailer, setSelectedTrailer] = useState<string>('');
  const [currentPlanItems, setCurrentPlanItems] = useState<PlanItem[]>([]);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [jobType, setJobType] = useState<'delivery' | 'collection'>('collection');
  const [previousTrailerInPlan, setPreviousTrailerInPlan] = useState<string>('');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');
  const [showTrailerChangeModal, setShowTrailerChangeModal] = useState<boolean>(false);
  const [pendingTrailerChange, setPendingTrailerChange] = useState<{oldTrailer: string, newTrailer: string} | null>(null);
  const [dropOffLocation, setDropOffLocation] = useState<string>('');
  const [pickUpLocation, setPickUpLocation] = useState<string>('');
  const [bookingTime, setBookingTime] = useState<string>(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  // Shift Planning States
  const [showShiftPlanningModal, setShowShiftPlanningModal] = useState<boolean>(false);
  const [shiftPlanningDriver, setShiftPlanningDriver] = useState<Driver | null>(null);
  const [plannedShiftStartTime, setPlannedShiftStartTime] = useState<string>('');
  const [plannedShiftEndTime, setPlannedShiftEndTime] = useState<string>('');

  // Use refs to avoid stale closure issues
  const driversRef = useRef(drivers);
  const updateDriverStatusRef = useRef(updateDriverStatus);
  
  // Update refs when values change
  useEffect(() => {
    driversRef.current = drivers;
  }, [drivers]);
  
  useEffect(() => {
    updateDriverStatusRef.current = updateDriverStatus;
  }, [updateDriverStatus]);

  // Update driver statuses periodically based on their schedules
  useEffect(() => {
    const updateDriverStatuses = () => {
      // Use ref to get fresh data without causing re-renders
      const currentDrivers = driversRef.current;
      const updateFn = updateDriverStatusRef.current;
      
      currentDrivers.forEach((driver: any) => {
        const now = new Date();
        const isCurrentlyWorking = driver.schedule.some((scheduled: any) => {
          const scheduledStart = new Date(scheduled.startTime);
          const scheduledEnd = new Date(scheduled.endTime);
          return now >= scheduledStart && now <= scheduledEnd && scheduled.status === 'in-progress';
        });
        const shouldBeAvailable = !isCurrentlyWorking;
        
        if (driver.isAvailable !== shouldBeAvailable) {
          updateFn(driver.id, shouldBeAvailable);
        }
      });
    };

    // Update every minute
    const interval = setInterval(updateDriverStatuses, 60000);

    return () => clearInterval(interval);
  }, []); // No dependencies - uses refs for fresh data

  // Load plan for editing
  const loadPlanForEditing = (plan: DriverPlan) => {
    setSelectedDriver(plan.driverId);
    setSelectedTruck(plan.truckId);
    setSelectedTrailer(plan.trailerId);
    setPreviousTrailerInPlan(plan.trailerId);
    setPlanType(plan.planType);
    setCurrentPlanItems(plan.items);
    setEditingPlanId(`${plan.driverId}-${plan.createdAt}`);
  };

  // Save current plan
  const savePlan = () => {
    if (!selectedDriver || !selectedTruck || !selectedTrailer || currentPlanItems.length === 0) {
      alert('Please complete the plan before saving (driver, truck, trailer, and at least one delivery)');
      return;
    }

    // Validate working hours
    const planDuration = calculatePlanDuration(currentPlanItems);
    const validation = canDriverTakePlan(selectedDriver, planDuration);
    
    if (!validation.canTake) {
      alert(`❌ Cannot save plan: ${validation.reason}`);
      return;
    }

    // Get plan time bounds for resource scheduling
    const timeBounds = getPlanTimeBounds(currentPlanItems);
    if (!timeBounds) {
      alert('❌ Cannot determine plan timing');
      return;
    }

    // Check resource availability (exclude current plan if editing)
    const excludePlanId = editingPlanId || undefined;
    
    if (!isResourceAvailable(selectedDriver, 'driver', timeBounds.startTime, timeBounds.endTime, excludePlanId)) {
      alert('❌ Selected driver is not available during the planned time period');
      return;
    }
    
    if (!isResourceAvailable(selectedTruck, 'truck', timeBounds.startTime, timeBounds.endTime, excludePlanId)) {
      alert('❌ Selected truck is not available during the planned time period');
      return;
    }
    
    if (!isResourceAvailable(selectedTrailer, 'trailer', timeBounds.startTime, timeBounds.endTime, excludePlanId)) {
      alert('❌ Selected trailer is not available during the planned time period');
      return;
    }

    const planId = editingPlanId || `${selectedDriver}-${Date.now()}`;
    const newPlan: DriverPlan = {
      driverId: selectedDriver,
      truckId: selectedTruck,
      trailerId: selectedTrailer,
      planType,
      items: currentPlanItems,
      createdAt: editingPlanId ? savedPlans.find(p => `${p.driverId}-${p.createdAt}` === editingPlanId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create schedule entries for resources
    const scheduleEntry = createScheduleEntry(planId, selectedDriver, timeBounds.startTime, timeBounds.endTime);

    if (editingPlanId) {
      // Update existing plan and schedules
      setSavedPlans(savedPlans.map(plan => 
        `${plan.driverId}-${plan.createdAt}` === editingPlanId ? newPlan : plan
      ));
      
      // Update schedules for all resources (remove old, add new)
      removeResourceSchedule('driver', selectedDriver, planId);
      removeResourceSchedule('truck', selectedTruck, planId);
      removeResourceSchedule('trailer', selectedTrailer, planId);
      
      updateResourceSchedule('driver', selectedDriver, scheduleEntry);
      updateResourceSchedule('truck', selectedTruck, scheduleEntry);
      updateResourceSchedule('trailer', selectedTrailer, scheduleEntry);
      
    } else {
              // Add new plan and schedules
        setSavedPlans([...savedPlans, newPlan]);
        
        // Add schedule entries to resources
        updateResourceSchedule('driver', selectedDriver, scheduleEntry);
        updateResourceSchedule('truck', selectedTruck, scheduleEntry);
        updateResourceSchedule('trailer', selectedTrailer, scheduleEntry);
        
        // Update driver working hours
        updateDriverWorkingHours(selectedDriver, planDuration);
    }

    // Clear current work
    clearCurrentPlan();
    alert('✅ Plan saved successfully!');
  };

  // Clear current plan
  const clearCurrentPlan = () => {
    setCurrentPlanItems([]);
    setSelectedDriver('');
    setSelectedTruck('');
    setSelectedTrailer('');
    setPreviousTrailerInPlan('');
    setEditingPlanId(null);
  };

  // Create trailer change job
  const createTrailerChangeJob = (oldTrailer: string, newTrailer: string, dropOff: string, pickUp: string): PlanItem => {
    const allLocations = [...customers, ...mockDepotAddresses];
    const dropOffAddr = allLocations.find(loc => loc.id === dropOff) || mockDepotAddresses[0];
    const pickUpAddr = allLocations.find(loc => loc.id === pickUp) || mockDepotAddresses[0];
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    
    const availableTrailers = trailers.filter(trailer => trailer.isAvailable);
    
    const estimatedDuration = 90; // 1.5 hours for trailer change
    const startTime = new Date(bookingTime).toISOString();
    const endTime = new Date(new Date(bookingTime).getTime() + estimatedDuration * 60000).toISOString();
    
    return {
      id: `trailer-change-${Date.now()}`,
      addressId: dropOffAddr.id, // Use drop-off as main address
      address: dropOffAddr,
      sequence: currentPlanItems.length + 1,
      startTime,
      endTime,
      estimatedDuration,
      jobType: 'trailer_change',
      bookingTime: now.toISOString().slice(0, 16),
      assignedTrailer: newTrailer,
      previousTrailer: oldTrailer,
      newTrailer: newTrailer,
      dropOffLocation: dropOffAddr,
      pickUpLocation: pickUpAddr,
      driverId: selectedDriver,
      truckId: selectedTruck,
      notes: `Drop ${availableTrailers.find((t: any) => t.id === oldTrailer)?.plateNumber} at ${dropOffAddr.companyName}, pick up ${availableTrailers.find((t: any) => t.id === newTrailer)?.plateNumber} from ${pickUpAddr.companyName}`
    };
  };

  // Enhanced resource availability checking
  const isResourceAvailable = (resourceId: string, resourceType: 'driver' | 'truck' | 'trailer', startTime: string, endTime: string, excludePlanId?: string): boolean => {
    let resource;
    
    if (resourceType === 'driver') {
      resource = drivers.find((r: any) => r.id === resourceId);
    } else if (resourceType === 'truck') {
      resource = trucks.find((r: any) => r.id === resourceId);
    } else {
      resource = trailers.find((r: any) => r.id === resourceId);
    }
    
    if (!resource) return false;

    const start = new Date(startTime);
    const end = new Date(endTime);

    return !resource.schedule.some((scheduled: any) => {
      // Skip if this is the same plan we're editing
      if (excludePlanId && scheduled.planId === excludePlanId) return false;
      
      const scheduledStart = new Date(scheduled.startTime);
      const scheduledEnd = new Date(scheduled.endTime);
      
      // Check for time overlap and exclude completed jobs
      return (start < scheduledEnd && end > scheduledStart) && scheduled.status !== 'completed';
    });
  };

  // Get plan time bounds
  const getPlanTimeBounds = (items: PlanItem[]): { startTime: string; endTime: string } | null => {
    if (items.length === 0) return null;
    
    const sortedItems = [...items].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return {
      startTime: sortedItems[0].startTime,
      endTime: sortedItems[sortedItems.length - 1].endTime
    };
  };

  // Check if current time is within working hours
  const isDriverCurrentlyWorking = (driverId: string): boolean => {
    const driver = drivers.find((d: any) => d.id === driverId);
    if (!driver) return false;

    const now = new Date();
    return driver.schedule.some((scheduled: any) => {
      const scheduledStart = new Date(scheduled.startTime);
      const scheduledEnd = new Date(scheduled.endTime);
      return now >= scheduledStart && now <= scheduledEnd && scheduled.status === 'in-progress';
    });
  };

  // Create schedule entry for a plan
  const createScheduleEntry = (planId: string, driverId: string, startTime: string, endTime: string) => {
    return {
      id: `schedule-${planId}-${Date.now()}`,
      startTime,
      endTime,
      planId,
      driverId,
      status: 'scheduled' as const,
      notes: `Plan execution`
    };
  };

  // Handle trailer change
  const handleTrailerChange = (newTrailerId: string) => {
    const oldTrailer = selectedTrailer;

    // If we have items in the plan and trailer is changing, show modal for location selection
    if (currentPlanItems.length > 0 && oldTrailer && oldTrailer !== newTrailerId && previousTrailerInPlan && previousTrailerInPlan !== newTrailerId) {
      setPendingTrailerChange({ oldTrailer: previousTrailerInPlan, newTrailer: newTrailerId });
      setDropOffLocation(mockDepotAddresses[0].id); // Default to main depot
      setPickUpLocation(mockDepotAddresses[0].id); // Default to main depot
      setShowTrailerChangeModal(true);
      return; // Don't update trailer selection yet
    }

    setSelectedTrailer(newTrailerId);
    setPreviousTrailerInPlan(newTrailerId);
  };

  // Confirm trailer change with locations
  const confirmTrailerChange = () => {
    if (!pendingTrailerChange || !dropOffLocation || !pickUpLocation) return;

    const trailerChangeJob = createTrailerChangeJob(
      pendingTrailerChange.oldTrailer, 
      pendingTrailerChange.newTrailer,
      dropOffLocation,
      pickUpLocation
    );
    setCurrentPlanItems(prev => [...prev, trailerChangeJob]);
    setSelectedTrailer(pendingTrailerChange.newTrailer);
    setPreviousTrailerInPlan(pendingTrailerChange.newTrailer);
    
    // Close modal and reset state
    setShowTrailerChangeModal(false);
    setPendingTrailerChange(null);
    setDropOffLocation('');
    setPickUpLocation('');
  };

  // Cancel trailer change
  const cancelTrailerChange = () => {
    setShowTrailerChangeModal(false);
    setPendingTrailerChange(null);
    setDropOffLocation('');
    setPickUpLocation('');
  };

  // Working hours validation functions
  const calculatePlanDuration = (items: PlanItem[]): number => {
    return items.reduce((total, item) => total + item.estimatedDuration, 0);
  };

  const getDriverWorkingHours = (driverId: string): WorkingHours | null => {
    const driver = drivers.find((d: any) => d.id === driverId);
    return driver?.workingHours || null;
  };

  const canDriverTakePlan = (driverId: string, planDurationMinutes: number): { 
    canTake: boolean; 
    reason?: string; 
    availableHours: number; 
  } => {
    const workingHours = getDriverWorkingHours(driverId);
    if (!workingHours) return { canTake: false, reason: 'Driver not found', availableHours: 0 };

    const availableDailyHours = workingHours.maxDailyHours - workingHours.dailyHoursWorked;
    const availableWeeklyHours = workingHours.maxWeeklyHours - workingHours.weeklyHoursWorked;

    if (planDurationMinutes > availableDailyHours) {
      return { 
        canTake: false, 
        reason: `Plan duration ${Math.floor(planDurationMinutes / 60)}h ${planDurationMinutes % 60}m exceeds daily limit. Available: ${Math.floor(availableDailyHours / 60)}h ${availableDailyHours % 60}m`, 
        availableHours: availableDailyHours 
      };
    }

    if (planDurationMinutes > availableWeeklyHours) {
      return { 
        canTake: false, 
        reason: `Plan duration exceeds weekly limit. Available: ${Math.floor(availableWeeklyHours / 60)}h ${availableWeeklyHours % 60}m`, 
        availableHours: availableWeeklyHours 
      };
    }

    return { canTake: true, availableHours: Math.min(availableDailyHours, availableWeeklyHours) };
  };

  const updateDriverWorkingHours = (driverId: string, planDurationMinutes: number) => {
    // This would normally update the driver's working hours in the backend
    // For now, we'll just track it locally for validation
    console.log(`Would update driver ${driverId} working hours by ${planDurationMinutes} minutes`);
  };

  // Notes editing functions
  const startEditingNotes = (itemId: string, currentNotes: string = '') => {
    setEditingNotes(itemId);
    setTempNotes(currentNotes);
  };

  const saveNotes = (itemId: string) => {
    setCurrentPlanItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, notes: tempNotes } : item
    ));
    
    // Also update in saved plans if editing a saved plan
    if (editingPlanId) {
      setSavedPlans(savedPlans.map(plan => {
        if (`${plan.driverId}-${plan.createdAt}` === editingPlanId) {
          return {
            ...plan,
            items: plan.items.map((item: any) => 
              item.id === itemId ? { ...item, notes: tempNotes } : item
            ),
            updatedAt: new Date().toISOString()
          };
        }
        return plan;
      }));
    }

    setEditingNotes(null);
    setTempNotes('');
  };

  const cancelEditingNotes = () => {
    setEditingNotes(null);
    setTempNotes('');
  };

  // Shift Planning Functions
  const openShiftPlanning = (driver: Driver) => {
    setShiftPlanningDriver(driver);
    
    // Set default times based on existing planned times or defaults
    const now = new Date();
    if (driver.workingHours.plannedShiftStartTime) {
      setPlannedShiftStartTime(driver.workingHours.plannedShiftStartTime.slice(0, 16));
    } else {
      const startTime = new Date(now);
      startTime.setHours(8, 0, 0, 0); // Default 8 AM start
      setPlannedShiftStartTime(startTime.toISOString().slice(0, 16));
    }
    
    if (driver.workingHours.plannedShiftEndTime) {
      setPlannedShiftEndTime(driver.workingHours.plannedShiftEndTime.slice(0, 16));
    } else {
      const endTime = new Date(now);
      endTime.setHours(17, 0, 0, 0); // Default 5 PM end
      setPlannedShiftEndTime(endTime.toISOString().slice(0, 16));
    }
    
    setShowShiftPlanningModal(true);
  };

  const savePlannedShiftTimes = () => {
    if (!shiftPlanningDriver || !plannedShiftStartTime || !plannedShiftEndTime) return;
    
    setPlannedShiftTime(shiftPlanningDriver.id, plannedShiftStartTime, plannedShiftEndTime);
    setShowShiftPlanningModal(false);
    setShiftPlanningDriver(null);
    alert(`✅ Planned shift times set for ${shiftPlanningDriver.name}`);
  };

  const clearDriverPlannedTimes = (driver: Driver) => {
    if (window.confirm(`Clear planned shift times for ${driver.name}?`)) {
      clearPlannedShiftTime(driver.id);
      alert(`✅ Planned shift times cleared for ${driver.name}`);
    }
  };

  const getDriverShiftStatus = (driver: Driver): string => {
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

  // Load existing plan when driver changes
  const handleDriverChange = (driverId: string) => {
    if (currentPlanItems.length > 0 && !editingPlanId) {
      if (!window.confirm('You have unsaved changes. Do you want to discard them?')) {
        return;
      }
    }
    setSelectedDriver(driverId);
    setCurrentPlanItems([]);
    setEditingPlanId(null);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === 'addresses' && destination.droppableId === 'plan') {
      const addressId = result.draggableId;
      const address = customers.find((addr: any) => addr.id === addressId);
      
      if (address && !currentPlanItems.find(item => item.addressId === addressId)) {
        const estimatedDuration = jobType === 'delivery' ? 60 : 45; // Delivery: 1h, Collection: 45min
        
        // Validate working hours before adding
        if (selectedDriver) {
          const newPlanDuration = calculatePlanDuration(currentPlanItems) + estimatedDuration;
          const validation = canDriverTakePlan(selectedDriver, newPlanDuration);
          
          if (!validation.canTake) {
            alert(`❌ Cannot add stop: ${validation.reason}`);
            return;
          }
        }
        
        const startTime = new Date(bookingTime || new Date().toISOString()).toISOString();
        const endTime = new Date(new Date(startTime).getTime() + estimatedDuration * 60000).toISOString();
        
        const newItem: PlanItem = {
          id: `plan-${Date.now()}`,
          addressId,
          address,
          sequence: currentPlanItems.length + 1,
          startTime,
          endTime,
          estimatedDuration,
          jobType,
          bookingTime: bookingTime || new Date().toISOString().slice(0, 16),
          assignedTrailer: selectedTrailer,
          driverId: selectedDriver,
          truckId: selectedTruck,
        };
        
        setCurrentPlanItems([...currentPlanItems, newItem]);
        
        // Set initial trailer tracking if this is the first item
        if (currentPlanItems.length === 0 && selectedTrailer && !previousTrailerInPlan) {
          setPreviousTrailerInPlan(selectedTrailer);
        }
      }
    } else if (source.droppableId === 'plan' && destination.droppableId === 'plan') {
      const items = Array.from(currentPlanItems);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      
      const updatedItems = items.map((item, index) => ({
        ...item,
        sequence: index + 1,
      }));
      
      setCurrentPlanItems(updatedItems);
    }
  };

  const removePlanItem = (itemId: string) => {
    setCurrentPlanItems(currentPlanItems.filter(item => item.id !== itemId));
  };

  // Remove the "outdated" concept - each plan item keeps its original assignments

  // Filter resources based on availability and scheduling conflicts
  const getAvailableDrivers = () => {
    const timeBounds = getPlanTimeBounds(currentPlanItems);
    return drivers.filter((driver: any) => {
      // Update driver status based on current working hours
      const isCurrentlyWorking = isDriverCurrentlyWorking(driver.id);
      if (driver.isAvailable !== !isCurrentlyWorking) {
        updateDriverStatus(driver.id, !isCurrentlyWorking);
      }
      
      // If no time bounds yet, show all available drivers
      if (!timeBounds) return driver.isAvailable;
      
      // Check if driver is available during the planned time
      return driver.isAvailable && isResourceAvailable(
        driver.id, 
        'driver', 
        timeBounds.startTime, 
        timeBounds.endTime, 
        editingPlanId || undefined
      );
    });
  };

  const getAvailableTrucks = () => {
    const timeBounds = getPlanTimeBounds(currentPlanItems);
    return trucks.filter((truck: any) => {
      // If no time bounds yet, show all available trucks
      if (!timeBounds) return truck.isAvailable;
      
      // Check if truck is available during the planned time
      return truck.isAvailable && isResourceAvailable(
        truck.id, 
        'truck', 
        timeBounds.startTime, 
        timeBounds.endTime, 
        editingPlanId || undefined
      );
    });
  };

  const getAvailableTrailers = () => {
    const timeBounds = getPlanTimeBounds(currentPlanItems);
    return trailers.filter((trailer: any) => {
      // If no time bounds yet, show all available trailers
      if (!timeBounds) return trailer.isAvailable;
      
      // Check if trailer is available during the planned time
      return trailer.isAvailable && isResourceAvailable(
        trailer.id, 
        'trailer', 
        timeBounds.startTime, 
        timeBounds.endTime, 
        editingPlanId || undefined
      );
    });
  };

  const availableDrivers = getAvailableDrivers();
  const availableTrucks = getAvailableTrucks();
  const availableTrailers = getAvailableTrailers();

  const filteredAddresses = planType === 'international' 
    ? customers.filter((addr: any) => addr.country !== 'USA')
    : customers.filter((addr: any) => addr.country === 'USA');

  // Get current plan and driver info
  const currentPlanDuration = calculatePlanDuration(currentPlanItems);
  const selectedDriverData = selectedDriver ? drivers.find((d: any) => d.id === selectedDriver) : null;
  const workingHoursValidation = selectedDriver ? canDriverTakePlan(selectedDriver, currentPlanDuration) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Shift Planning Section */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              🕒 Driver Shift Planning
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
              Set planned shift times for drivers
            </p>
          </div>
        </div>

        {/* Driver Cards for Shift Planning */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
          {drivers.map((driver: Driver) => (
            <div
              key={driver.id}
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0',
                padding: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ backgroundColor: '#e2e8f0', padding: '0.5rem', borderRadius: '50%' }}>
                    <User style={{ height: '1.25rem', width: '1.25rem', color: '#64748b' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>{driver.name}</h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{driver.licenseNumber}</p>
                  </div>
                </div>
                <div style={{ 
                  backgroundColor: driver.isAvailable ? '#dcfce7' : '#fee2e2', 
                  color: driver.isAvailable ? '#166534' : '#dc2626', 
                  fontSize: '0.75rem', 
                  fontWeight: '500', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '0.25rem' 
                }}>
                  {driver.isAvailable ? '✅ Available' : '🔴 Busy'}
                </div>
              </div>

              {/* Shift Status */}
              <div style={{ marginBottom: '0.75rem', padding: '0.5rem', backgroundColor: 'white', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Shift Status</div>
                <div style={{ fontSize: '0.875rem', color: '#1e293b' }}>
                  {getDriverShiftStatus(driver)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Plans assigned: {getDriverPlans(driver.id).length}
                </div>
                {driver.workingHours.plannedShiftStartTime && (
                  <div style={{ fontSize: '0.75rem', color: '#6366f1', marginTop: '0.25rem' }}>
                    📋 Planned: {new Date(driver.workingHours.plannedShiftStartTime).toLocaleTimeString()} - {driver.workingHours.plannedShiftEndTime ? new Date(driver.workingHours.plannedShiftEndTime).toLocaleTimeString() : 'TBD'}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => openShiftPlanning(driver)}
                  style={{ 
                    backgroundColor: '#6366f1', 
                    color: 'white', 
                    padding: '0.5rem 0.75rem', 
                    fontSize: '0.75rem', 
                    borderRadius: '0.375rem', 
                    border: 'none', 
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  📋 Set Shift Times
                </button>
                {driver.workingHours.plannedShiftStartTime && (
                  <button 
                    onClick={() => clearDriverPlannedTimes(driver)}
                    style={{ 
                      backgroundColor: '#ef4444', 
                      color: 'white', 
                      padding: '0.5rem 0.75rem', 
                      fontSize: '0.75rem', 
                      borderRadius: '0.375rem', 
                      border: 'none', 
                      cursor: 'pointer' 
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              {editingPlanId ? 'Edit Delivery Plan' : 'Create Delivery Plan'}
            </h2>
            {selectedDriver && (
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                Working on plan for: <strong>{availableDrivers.find(d => d.id === selectedDriver)?.name}</strong>
                {editingPlanId && <span style={{ color: '#f59e0b' }}> (Editing)</span>}
              </p>
            )}
          </div>
        </div>
        
        {(!selectedDriver || !selectedTruck || !selectedTrailer) && (
          <div style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '0.375rem', padding: '0.75rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#92400e', margin: 0 }}>
              ⚠️ Please select Driver, Truck, and Trailer before creating delivery plans
            </p>
          </div>
        )}
        
        {/* Resource Availability Warnings */}
        {selectedDriver && selectedTruck && selectedTrailer && currentPlanItems.length > 0 && (() => {
          const timeBounds = getPlanTimeBounds(currentPlanItems);
          if (!timeBounds) return null;
          
          const driverAvailable = isResourceAvailable(selectedDriver, 'driver', timeBounds.startTime, timeBounds.endTime, editingPlanId || undefined);
          const truckAvailable = isResourceAvailable(selectedTruck, 'truck', timeBounds.startTime, timeBounds.endTime, editingPlanId || undefined);
          const trailerAvailable = isResourceAvailable(selectedTrailer, 'trailer', timeBounds.startTime, timeBounds.endTime, editingPlanId || undefined);
          
          const unavailableResources = [];
          if (!driverAvailable) unavailableResources.push('Driver');
          if (!truckAvailable) unavailableResources.push('Truck');
          if (!trailerAvailable) unavailableResources.push('Trailer');
          
          return unavailableResources.length > 0 ? (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', padding: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <AlertTriangle style={{ height: '1rem', width: '1rem', color: '#dc2626' }} />
                <span style={{ fontSize: '0.875rem', color: '#991b1b', fontWeight: '500' }}>
                  Resource Scheduling Conflict
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#7f1d1d', margin: 0 }}>
                {unavailableResources.join(', ')} not available during planned time ({new Date(timeBounds.startTime).toLocaleString()} - {new Date(timeBounds.endTime).toLocaleString()})
              </p>
            </div>
          ) : null;
        })()}
        
        {/* Resource Selection - MOVED TO TOP */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Driver</label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedDriver}
                onChange={(e) => handleDriverChange(e.target.value)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  backgroundColor: 'white',
                  fontSize: '0.875rem',
                  appearance: 'none'
                }}
              >
                <option value="">Select a driver</option>
                {availableDrivers.map(driver => {
                  const isWorking = isDriverCurrentlyWorking(driver.id);
                  const statusText = isWorking ? 'Working' : 'Available';
                  return (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} - {driver.experienceYears}y exp ({statusText})
                    </option>
                  );
                })}
              </select>
              <ChevronDown style={{ position: 'absolute', right: '0.75rem', top: '0.625rem', height: '1rem', width: '1rem', color: '#9ca3af', pointerEvents: 'none' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Truck</label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedTruck}
                onChange={(e) => setSelectedTruck(e.target.value)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  backgroundColor: 'white',
                  fontSize: '0.875rem',
                  appearance: 'none'
                }}
              >
                <option value="">Select a truck</option>
                {availableTrucks.map(truck => {
                  // Check if truck has active schedule
                  const hasActiveSchedule = truck.schedule.some((s: any) => {
                    const now = new Date();
                    const start = new Date(s.startTime);
                    const end = new Date(s.endTime);
                    return now >= start && now <= end && s.status === 'in-progress';
                  });
                  
                  const statusText = hasActiveSchedule ? 'In Use' : 'Available';
                  
                  return (
                    <option key={truck.id} value={truck.id}>
                      {truck.plateNumber} - {truck.model} ({truck.capacity}t) ({statusText})
                    </option>
                  );
                })}
              </select>
              <ChevronDown style={{ position: 'absolute', right: '0.75rem', top: '0.625rem', height: '1rem', width: '1rem', color: '#9ca3af', pointerEvents: 'none' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Trailer</label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedTrailer}
                onChange={(e) => handleTrailerChange(e.target.value)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  backgroundColor: 'white',
                  fontSize: '0.875rem',
                  appearance: 'none'
                }}
              >
                <option value="">Select a trailer</option>
                {availableTrailers.map(trailer => {
                  const allLocations = [...customers, ...mockDepotAddresses];
                  const currentLoc = allLocations.find(loc => loc.id === trailer.currentLocation);
                  const locationName = currentLoc ? currentLoc.companyName : 'Unknown';
                  
                  // Check if trailer has active schedule
                  const hasActiveSchedule = trailer.schedule.some((s: any) => {
                    const now = new Date();
                    const start = new Date(s.startTime);
                    const end = new Date(s.endTime);
                    return now >= start && now <= end && s.status === 'in-progress';
                  });
                  
                  const statusText = hasActiveSchedule ? 'In Use' : 'Available';
                  
                  return (
                    <option key={trailer.id} value={trailer.id}>
                      {trailer.plateNumber} - {trailer.type} ({trailer.capacity}t) - At: {locationName} ({statusText})
                    </option>
                  );
                })}
              </select>
              <ChevronDown style={{ position: 'absolute', right: '0.75rem', top: '0.625rem', height: '1rem', width: '1rem', color: '#9ca3af', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>

        {/* Working Hours Status */}
        {selectedDriverData && (
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Clock style={{ height: '1.25rem', width: '1.25rem', color: '#475569' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                Working Hours Status - {selectedDriverData.name}
              </h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Today's Hours</div>
                <div style={{ fontSize: '1.125rem', fontWeight: '600', color: selectedDriverData.workingHours.dailyHoursWorked > 720 ? '#dc2626' : '#059669' }}>
                  {Math.floor(selectedDriverData.workingHours.dailyHoursWorked / 60)}h {selectedDriverData.workingHours.dailyHoursWorked % 60}m / 15h
                </div>
                <div style={{ 
                  width: '100%', 
                  height: '0.375rem', 
                  backgroundColor: '#e2e8f0', 
                  borderRadius: '0.1875rem', 
                  marginTop: '0.25rem' 
                }}>
                  <div style={{ 
                    width: `${Math.min((selectedDriverData.workingHours.dailyHoursWorked / 900) * 100, 100)}%`, 
                    height: '100%', 
                    backgroundColor: selectedDriverData.workingHours.dailyHoursWorked > 720 ? '#dc2626' : '#059669', 
                    borderRadius: '0.1875rem' 
                  }}></div>
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Current Plan Duration</div>
                <div style={{ fontSize: '1.125rem', fontWeight: '600', color: workingHoursValidation?.canTake ? '#059669' : '#dc2626' }}>
                  {Math.floor(currentPlanDuration / 60)}h {currentPlanDuration % 60}m
                </div>
                {currentPlanItems.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                    {currentPlanItems.length} stops planned
                  </div>
                )}
              </div>
              
              <div>
                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Available Hours</div>
                <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b' }}>
                  {workingHoursValidation ? Math.floor(workingHoursValidation.availableHours / 60) : 0}h {workingHoursValidation ? workingHoursValidation.availableHours % 60 : 0}m
                </div>
                {!workingHoursValidation?.canTake && workingHoursValidation?.reason && (
                  <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertTriangle style={{ height: '0.75rem', width: '0.75rem' }} />
                    Limit exceeded
                  </div>
                )}
              </div>
              
              {selectedDriverData.workingHours.shiftStartTime && (
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Shift Started</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b' }}>
                    {new Date(selectedDriverData.workingHours.shiftStartTime).toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>
            
            {!workingHoursValidation?.canTake && workingHoursValidation?.reason && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', padding: '0.75rem', marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle style={{ height: '1rem', width: '1rem', color: '#dc2626' }} />
                  <span style={{ fontSize: '0.875rem', color: '#991b1b', fontWeight: '500' }}>
                    Working Hours Limit Warning
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#7f1d1d', margin: '0.25rem 0 0 1.5rem' }}>
                  {workingHoursValidation.reason}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Job Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Job Type</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setJobType('delivery')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  border: 'none',
                  backgroundColor: jobType === 'delivery' ? '#16a34a' : '#e5e7eb',
                  color: jobType === 'delivery' ? 'white' : '#374151',
                  cursor: 'pointer'
                }}
              >
                🚚 Delivery
              </button>
              <button
                onClick={() => setJobType('collection')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  border: 'none',
                  backgroundColor: jobType === 'collection' ? '#dc2626' : '#e5e7eb',
                  color: jobType === 'collection' ? 'white' : '#374151',
                  cursor: 'pointer'
                }}
              >
                📦 Collection
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Booking Time</label>
            <input
              type="datetime-local"
              value={bookingTime}
              onChange={(e) => setBookingTime(e.target.value)}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                backgroundColor: 'white',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>

        {/* Plan Type Selection - NOW BELOW RESOURCES */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Plan Type</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setPlanType('local')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: 'none',
                backgroundColor: planType === 'local' ? '#2563eb' : '#e5e7eb',
                color: planType === 'local' ? 'white' : '#374151',
                cursor: 'pointer'
              }}
            >
              Local
            </button>
            <button
              onClick={() => setPlanType('international')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: 'none',
                backgroundColor: planType === 'international' ? '#2563eb' : '#e5e7eb',
                color: planType === 'international' ? 'white' : '#374151',
                cursor: 'pointer'
              }}
            >
              International
            </button>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {/* Customer Addresses */}
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
              Customer Addresses ({planType})
            </h3>
            <Droppable droppableId="addresses">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '400px' }}
                >
                  {filteredAddresses.map((address, index) => (
                    <Draggable key={address.id} draggableId={address.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            padding: '1rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            cursor: 'move',
                            backgroundColor: snapshot.isDragging ? '#eff6ff' : '#f9fafb',
                            borderColor: snapshot.isDragging ? '#93c5fd' : '#e5e7eb',
                            boxShadow: snapshot.isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
                            ...provided.draggableProps.style
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ fontWeight: '500', color: '#111827', margin: '0 0 0.25rem 0' }}>{address.companyName}</h4>
                              <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: '0 0 0.25rem 0' }}>{address.contactPerson}</p>
                              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <MapPin style={{ width: '1rem', height: '1rem' }} />
                                {address.address}, {address.city}, {address.country}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Current Plan */}
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>Current Plan</h3>
            <Droppable droppableId="plan">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '400px' }}
                >
                  {currentPlanItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6b7280' }}>
                      <Package2 style={{ margin: '0 auto 1rem auto', height: '3rem', width: '3rem', color: '#9ca3af' }} />
                      <p>Drag addresses here to create your plan</p>
                    </div>
                  ) : (
                    currentPlanItems.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              padding: '1rem',
                              border: '1px solid #e5e7eb',
                              borderRadius: '0.5rem',
                              backgroundColor: snapshot.isDragging ? '#f0fdf4' : 'white',
                              borderColor: snapshot.isDragging ? '#86efac' : '#e5e7eb',
                              boxShadow: snapshot.isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
                              ...provided.draggableProps.style
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                  <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', fontSize: '0.75rem', fontWeight: '500', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                                    #{item.sequence}
                                  </span>
                                  <span style={{ 
                                    backgroundColor: item.jobType === 'delivery' ? '#dcfce7' : 
                                                   item.jobType === 'collection' ? '#fef2f2' : '#fff3cd', 
                                    color: item.jobType === 'delivery' ? '#166534' : 
                                           item.jobType === 'collection' ? '#dc2626' : '#8b5a00', 
                                    fontSize: '0.75rem', 
                                    fontWeight: '500', 
                                    padding: '0.25rem 0.5rem', 
                                    borderRadius: '0.25rem' 
                                  }}>
                                    {item.jobType === 'delivery' ? '🚚 Delivery' : 
                                     item.jobType === 'collection' ? '📦 Collection' : '🔄 Trailer Change'}
                                  </span>
                                  <h4 style={{ fontWeight: '500', color: '#111827', margin: 0 }}>{item.address.companyName}</h4>
                                </div>
                                {item.jobType === 'trailer_change' ? (
                                  // Special display for trailer changes
                                  <div style={{ fontSize: '0.875rem', color: '#4b5563', margin: '0 0 0.5rem 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                                      <span>📍 Drop-off:</span>
                                      <strong>{item.dropOffLocation?.companyName || item.address.companyName}</strong>
                                      <span style={{ color: '#6b7280' }}>({item.dropOffLocation?.city || item.address.city})</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                      <span>🚛 Pick-up:</span>
                                      <strong>{item.pickUpLocation?.companyName || 'Unknown'}</strong>
                                      <span style={{ color: '#6b7280' }}>({item.pickUpLocation?.city || 'Unknown'})</span>
                                    </div>
                                  </div>
                                ) : (
                                  // Normal display for deliveries/collections
                                  <>
                                    <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: '0 0 0.25rem 0' }}>
                                      👤 {item.address.contactPerson}
                                    </p>
                                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                      <MapPin style={{ width: '1rem', height: '1rem' }} />
                                      {item.address.address}, {item.address.city}, {item.address.country}
                                    </p>
                                  </>
                                )}
                                <div style={{ 
                                  display: 'grid', 
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                                  gap: '0.5rem', 
                                  fontSize: '0.75rem', 
                                  color: '#6b7280', 
                                  marginTop: '0.5rem'
                                }}>
                                  <div>📅 {new Date(item.bookingTime).toLocaleString()}</div>
                                  {item.assignedTrailer && (
                                    <div>🚛 {availableTrailers.find(t => t.id === item.assignedTrailer)?.plateNumber || 'Unknown'}</div>
                                  )}
                                  {item.driverId && (
                                    <div>👨‍✈️ {availableDrivers.find(d => d.id === item.driverId)?.name || 'Unknown'}</div>
                                  )}
                                  {item.truckId && (
                                    <div>🚚 {availableTrucks.find(t => t.id === item.truckId)?.plateNumber || 'Unknown'}</div>
                                  )}
                                </div>
                                
                                {/* Notes Section */}
                                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6' }}>
                                  {editingNotes === item.id ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                      <textarea
                                        value={tempNotes}
                                        onChange={(e) => setTempNotes(e.target.value)}
                                        placeholder="Add notes, ref number, or special instructions..."
                                        style={{
                                          width: '100%',
                                          minHeight: '60px',
                                          padding: '0.5rem',
                                          border: '1px solid #d1d5db',
                                          borderRadius: '0.375rem',
                                          fontSize: '0.875rem',
                                          resize: 'vertical'
                                        }}
                                      />
                                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                          onClick={() => saveNotes(item.id)}
                                          style={{
                                            backgroundColor: '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '0.25rem',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={cancelEditingNotes}
                                          style={{
                                            backgroundColor: '#f3f4f6',
                                            color: '#374151',
                                            border: 'none',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '0.25rem',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>📝 Notes:</div>
                                        <div style={{ 
                                          fontSize: '0.875rem', 
                                          color: item.notes ? '#374151' : '#9ca3af',
                                          fontStyle: item.notes ? 'normal' : 'italic',
                                          lineHeight: '1.4'
                                        }}>
                                          {item.notes || 'No notes added'}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => startEditingNotes(item.id, item.notes || '')}
                                        style={{
                                          backgroundColor: '#3b82f6',
                                          color: 'white',
                                          border: 'none',
                                          padding: '0.25rem 0.75rem',
                                          borderRadius: '0.25rem',
                                          fontSize: '0.75rem',
                                          cursor: 'pointer',
                                          marginLeft: '0.5rem'
                                        }}
                                      >
                                        Edit Notes
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => removePlanItem(item.id)}
                                style={{ color: '#ef4444', fontSize: '0.875rem', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </DragDropContext>

      {/* Trailer Change Modal */}
      {showTrailerChangeModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '0.5rem', 
            padding: '1.5rem', 
            minWidth: '500px',
            maxWidth: '90vw',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
              🔄 Trailer Change Required
            </h3>
            
            {pendingTrailerChange && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.375rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>
                  Changing from <strong>{availableTrailers.find(t => t.id === pendingTrailerChange.oldTrailer)?.plateNumber}</strong> to <strong>{availableTrailers.find(t => t.id === pendingTrailerChange.newTrailer)?.plateNumber}</strong>
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  📍 Drop off old trailer at:
                </label>
                <select
                  value={dropOffLocation}
                  onChange={(e) => setDropOffLocation(e.target.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    backgroundColor: 'white',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">Select location</option>
                  <optgroup label="Depots">
                    {mockDepotAddresses.map(depot => (
                      <option key={depot.id} value={depot.id}>
                        {depot.companyName} ({depot.city})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Customer Locations">
                    {customers.map((customer: any) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.companyName} ({customer.city})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  🚛 Pick up new trailer from:
                </label>
                <select
                  value={pickUpLocation}
                  onChange={(e) => setPickUpLocation(e.target.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    backgroundColor: 'white',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">Select location</option>
                  <optgroup label="Depots">
                    {mockDepotAddresses.map(depot => (
                      <option key={depot.id} value={depot.id}>
                        {depot.companyName} ({depot.city})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Customer Locations">
                    {customers.map((customer: any) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.companyName} ({customer.city})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={cancelTrailerChange}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmTrailerChange}
                disabled={!dropOffLocation || !pickUpLocation}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  backgroundColor: (!dropOffLocation || !pickUpLocation) ? '#d1d5db' : '#2563eb',
                  color: 'white',
                  fontSize: '0.875rem',
                  cursor: (!dropOffLocation || !pickUpLocation) ? 'not-allowed' : 'pointer'
                }}
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Plans */}
      {savedPlans.length > 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>Saved Driver Plans</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {savedPlans.map((plan) => {
              const driver = availableDrivers.find(d => d.id === plan.driverId);
              const truck = availableTrucks.find(t => t.id === plan.truckId);
              const trailer = availableTrailers.find(t => t.id === plan.trailerId);
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
                        {driver?.name || 'Unknown Driver'}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                        {plan.items.length} stops • {plan.planType}
                      </p>
                    </div>
                    <button
                      onClick={() => loadPlanForEditing(plan)}
                      style={{
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                    🚚 {truck?.plateNumber} • 🚛 {trailer?.plateNumber}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    Updated: {new Date(plan.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Plan Summary */}
      {currentPlanItems.length > 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>Plan Summary</h3>
          
          {/* Resource Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User style={{ height: '1.25rem', width: '1.25rem', color: '#9ca3af' }} />
              <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                Driver: {selectedDriver ? availableDrivers.find(d => d.id === selectedDriver)?.name : 'Not selected'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck style={{ height: '1.25rem', width: '1.25rem', color: '#9ca3af' }} />
              <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                Truck: {selectedTruck ? availableTrucks.find(t => t.id === selectedTruck)?.plateNumber : 'Not selected'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package2 style={{ height: '1.25rem', width: '1.25rem', color: '#9ca3af' }} />
              <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                Trailer: {selectedTrailer ? availableTrailers.find(t => t.id === selectedTrailer)?.plateNumber : 'Not selected'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin style={{ height: '1.25rem', width: '1.25rem', color: '#9ca3af' }} />
              <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                Total Stops: {currentPlanItems.length}
              </span>
            </div>
          </div>

          {/* Job Type Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: '#dcfce7', borderRadius: '0.375rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#166534' }}>
                {currentPlanItems.filter(item => item.jobType === 'delivery').length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#166534' }}>🚚 Deliveries</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '0.375rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>
                {currentPlanItems.filter(item => item.jobType === 'collection').length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#dc2626' }}>📦 Collections</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: '#fff3cd', borderRadius: '0.375rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5a00' }}>
                {currentPlanItems.filter(item => item.jobType === 'trailer_change').length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#8b5a00' }}>🔄 Changes</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '0.375rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151' }}>
                {new Set(currentPlanItems.map(item => item.address.city)).size}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#374151' }}>🏙️ Cities</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '0.375rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1d4ed8' }}>
                {planType === 'international' ? '🌍' : '🏠'} 
              </div>
              <div style={{ fontSize: '0.875rem', color: '#1d4ed8' }}>{planType.charAt(0).toUpperCase() + planType.slice(1)}</div>
            </div>
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button 
              style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '0.5rem 1.5rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}
              onClick={clearCurrentPlan}
            >
              {editingPlanId ? 'Cancel Edit' : 'Clear Plan'}
            </button>
            <button 
              style={{ backgroundColor: '#2563eb', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}
              onClick={savePlan}
            >
              {editingPlanId ? 'Update Plan' : 'Save Plan'}
            </button>
          </div>
        </div>
      )}

      {/* Shift Planning Modal */}
      {showShiftPlanningModal && shiftPlanningDriver && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', minWidth: '500px', maxWidth: '90vw', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
              📋 Plan Shift Times - {shiftPlanningDriver.name}
            </h3>
            
            {/* Current Status */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.375rem', padding: '1rem', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', margin: '0 0 0.5rem 0' }}>Current Status</h4>
              <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
                {getDriverShiftStatus(shiftPlanningDriver)}
              </div>
              
              {/* Driver Plans Info */}
              <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: '#f0f9ff', borderRadius: '0.25rem', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: '500' }}>
                  📅 Assigned Plans: {getDriverPlans(shiftPlanningDriver.id).length}
                </div>
                {getDriverPlans(shiftPlanningDriver.id).length === 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}>
                    ⚠️ Driver cannot clock in without assigned plans
                  </div>
                )}
              </div>
            </div>

            {/* Planner Controls: Set Planned Shift Times */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>
                🕒 Set Planned Shift Times (Planner Only)
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Planned Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={plannedShiftStartTime}
                    onChange={(e) => setPlannedShiftStartTime(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Planned End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={plannedShiftEndTime}
                    onChange={(e) => setPlannedShiftEndTime(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                  />
                </div>
              </div>
              
              <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '0.375rem', padding: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#92400e', fontWeight: '500', marginBottom: '0.25rem' }}>
                  ℹ️ Planner Instructions:
                </div>
                <div style={{ fontSize: '0.75rem', color: '#92400e' }}>
                  • Set planned shift times here
                  • Driver can only clock in during or after planned start time
                  • Driver must have assigned plans to clock in
                  • Use Clock In/Out buttons in the Drivers page for actual time tracking
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                {shiftPlanningDriver.workingHours.plannedShiftStartTime && (
                  <button
                    onClick={() => {
                      clearPlannedShiftTime(shiftPlanningDriver.id);
                      setShowShiftPlanningModal(false);
                      setShiftPlanningDriver(null);
                    }}
                    style={{ padding: '0.5rem 1rem', border: '1px solid #dc2626', borderRadius: '0.375rem', backgroundColor: 'white', color: '#dc2626', fontSize: '0.875rem', cursor: 'pointer' }}
                  >
                    🗑️ Clear Times
                  </button>
                )}
                
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => {
                      setShowShiftPlanningModal(false);
                      setShiftPlanningDriver(null);
                    }}
                    style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white', color: '#374151', fontSize: '0.875rem', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={savePlannedShiftTimes}
                    style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', backgroundColor: '#6366f1', color: 'white', fontSize: '0.875rem', cursor: 'pointer' }}
                  >
                    💾 Save Planned Times
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 