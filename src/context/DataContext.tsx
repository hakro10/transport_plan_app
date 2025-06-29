import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Driver, Truck, Trailer, CustomerAddress } from '../types';
import { mockDrivers, mockTrucks, mockTrailers, mockCustomerAddresses } from '../data/mockData';

interface DriverPlan {
  driverId: string;
  truckId: string;
  trailerId: string;
  planType: 'international' | 'local';
  items: any[];
  createdAt: string;
  updatedAt: string;
}

interface DataContextType {
  // Data
  drivers: Driver[];
  trucks: Truck[];
  trailers: Trailer[];
  customers: CustomerAddress[];
  savedPlans: DriverPlan[];
  
  // Driver CRUD
  addDriver: (driver: Omit<Driver, 'id'>) => void;
  updateDriver: (id: string, driver: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;
  
  // Truck CRUD
  addTruck: (truck: Omit<Truck, 'id'>) => void;
  updateTruck: (id: string, truck: Partial<Truck>) => void;
  deleteTruck: (id: string) => void;
  
  // Trailer CRUD
  addTrailer: (trailer: Omit<Trailer, 'id'>) => void;
  updateTrailer: (id: string, trailer: Partial<Trailer>) => void;
  deleteTrailer: (id: string) => void;
  
  // Customer CRUD
  addCustomer: (customer: Omit<CustomerAddress, 'id'>) => void;
  updateCustomer: (id: string, customer: Partial<CustomerAddress>) => void;
  deleteCustomer: (id: string) => void;
  
  // Plans
  setSavedPlans: (plans: DriverPlan[]) => void;
  getDriverPlans: (driverId: string) => DriverPlan[];
  
  // Resource Schedule Management
  updateResourceSchedule: (resourceType: 'driver' | 'truck' | 'trailer', resourceId: string, scheduleEntry: any) => void;
  removeResourceSchedule: (resourceType: 'driver' | 'truck' | 'trailer', resourceId: string, planId: string) => void;
  updateDriverStatus: (driverId: string, isAvailable: boolean) => void;
  
  // Shift Management (Planner functions)
  setPlannedShiftTime: (driverId: string, startTime: string, endTime: string) => void;
  clearPlannedShiftTime: (driverId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [drivers, setDrivers] = useState<Driver[]>(mockDrivers);
  const [trucks, setTrucks] = useState<Truck[]>(mockTrucks);
  const [trailers, setTrailers] = useState<Trailer[]>(mockTrailers);
  const [customers, setCustomers] = useState<CustomerAddress[]>(mockCustomerAddresses);
  const [savedPlans, setSavedPlans] = useState<DriverPlan[]>([]);

  // Generate unique ID
  const generateId = () => Date.now().toString();

  // Driver CRUD
  const addDriver = (driver: Omit<Driver, 'id'>) => {
    const newDriver = { 
      ...driver, 
      id: generateId(),
      workingHours: {
        dailyHoursWorked: 0,
        weeklyHoursWorked: 0,
        lastWorkDate: new Date().toISOString().split('T')[0],
        maxDailyHours: 900, // 15 hours
        maxWeeklyHours: 3600 // 60 hours
      }
    };
    setDrivers(prev => [...prev, newDriver]);
  };

  const updateDriver = (id: string, updates: Partial<Driver>) => {
    setDrivers(prev => prev.map(driver => 
      driver.id === id ? { ...driver, ...updates } : driver
    ));
  };

  const deleteDriver = (id: string) => {
    setDrivers(prev => prev.filter(driver => driver.id !== id));
  };

  // Truck CRUD
  const addTruck = (truck: Omit<Truck, 'id'>) => {
    const newTruck = { ...truck, id: generateId() };
    setTrucks(prev => [...prev, newTruck]);
  };

  const updateTruck = (id: string, updates: Partial<Truck>) => {
    setTrucks(prev => prev.map(truck => 
      truck.id === id ? { ...truck, ...updates } : truck
    ));
  };

  const deleteTruck = (id: string) => {
    setTrucks(prev => prev.filter(truck => truck.id !== id));
  };

  // Trailer CRUD
  const addTrailer = (trailer: Omit<Trailer, 'id'>) => {
    const newTrailer = { ...trailer, id: generateId() };
    setTrailers(prev => [...prev, newTrailer]);
  };

  const updateTrailer = (id: string, updates: Partial<Trailer>) => {
    setTrailers(prev => prev.map(trailer => 
      trailer.id === id ? { ...trailer, ...updates } : trailer
    ));
  };

  const deleteTrailer = (id: string) => {
    setTrailers(prev => prev.filter(trailer => trailer.id !== id));
  };

  // Customer CRUD
  const addCustomer = (customer: Omit<CustomerAddress, 'id'>) => {
    const newCustomer = { ...customer, id: generateId() };
    setCustomers(prev => [...prev, newCustomer]);
  };

  const updateCustomer = (id: string, updates: Partial<CustomerAddress>) => {
    setCustomers(prev => prev.map(customer => 
      customer.id === id ? { ...customer, ...updates } : customer
    ));
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(customer => customer.id !== id));
  };

  // Get driver plans
  const getDriverPlans = (driverId: string) => {
    return savedPlans.filter(plan => plan.driverId === driverId);
  };

  // Resource schedule management
  const updateResourceSchedule = (resourceType: 'driver' | 'truck' | 'trailer', resourceId: string, scheduleEntry: any) => {
    if (resourceType === 'driver') {
      setDrivers(drivers.map((driver: any) => 
        driver.id === resourceId 
          ? { ...driver, schedule: [...driver.schedule, scheduleEntry] }
          : driver
      ));
    } else if (resourceType === 'truck') {
      setTrucks(trucks.map((truck: any) => 
        truck.id === resourceId 
          ? { ...truck, schedule: [...truck.schedule, scheduleEntry] }
          : truck
      ));
    } else if (resourceType === 'trailer') {
      setTrailers(trailers.map((trailer: any) => 
        trailer.id === resourceId 
          ? { ...trailer, schedule: [...trailer.schedule, scheduleEntry] }
          : trailer
      ));
    }
  };

  const removeResourceSchedule = (resourceType: 'driver' | 'truck' | 'trailer', resourceId: string, planId: string) => {
    if (resourceType === 'driver') {
      setDrivers(drivers.map((driver: any) => 
        driver.id === resourceId 
          ? { ...driver, schedule: driver.schedule.filter((s: any) => s.planId !== planId) }
          : driver
      ));
    } else if (resourceType === 'truck') {
      setTrucks(trucks.map((truck: any) => 
        truck.id === resourceId 
          ? { ...truck, schedule: truck.schedule.filter((s: any) => s.planId !== planId) }
          : truck
      ));
    } else if (resourceType === 'trailer') {
      setTrailers(trailers.map((trailer: any) => 
        trailer.id === resourceId 
          ? { ...trailer, schedule: trailer.schedule.filter((s: any) => s.planId !== planId) }
          : trailer
      ));
    }
  };

  const updateDriverStatus = (driverId: string, isAvailable: boolean) => {
    setDrivers(drivers.map((driver: any) => 
      driver.id === driverId 
        ? { ...driver, isAvailable }
        : driver
    ));
  };

  // Shift management functions
  const setPlannedShiftTime = (driverId: string, startTime: string, endTime: string) => {
    setDrivers(drivers.map((driver: any) => 
      driver.id === driverId 
        ? { 
            ...driver, 
            workingHours: {
              ...driver.workingHours,
              plannedShiftStartTime: startTime,
              plannedShiftEndTime: endTime
            }
          }
        : driver
    ));
  };

  const clearPlannedShiftTime = (driverId: string) => {
    setDrivers(drivers.map((driver: any) => 
      driver.id === driverId 
        ? { 
            ...driver, 
            workingHours: {
              ...driver.workingHours,
              plannedShiftStartTime: undefined,
              plannedShiftEndTime: undefined
            }
          }
        : driver
    ));
  };

  const value: DataContextType = {
    drivers,
    trucks,
    trailers,
    customers,
    savedPlans,
    addDriver,
    updateDriver,
    deleteDriver,
    addTruck,
    updateTruck,
    deleteTruck,
    addTrailer,
    updateTrailer,
    deleteTrailer,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    setSavedPlans,
    getDriverPlans,
    updateResourceSchedule,
    removeResourceSchedule,
    updateDriverStatus,
    setPlannedShiftTime,
    clearPlannedShiftTime,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}; 