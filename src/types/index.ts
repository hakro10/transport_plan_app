export interface ResourceSchedule {
  id: string;
  startTime: string;
  endTime: string;
  planId: string;
  driverId: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  notes?: string;
}

export interface WorkingHours {
  dailyHoursWorked: number; // current day hours in minutes
  weeklyHoursWorked: number; // current week hours in minutes
  shiftStartTime?: string; // when current shift started (actual clock-in time)
  plannedShiftStartTime?: string; // when planner scheduled shift to start
  plannedShiftEndTime?: string; // when planner scheduled shift to end
  lastWorkDate: string; // last date driver worked
  maxDailyHours: number; // default 15 hours = 900 minutes
  maxWeeklyHours: number; // default 60 hours = 3600 minutes
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phone: string;
  email: string;
  isAvailable: boolean;
  experienceYears: number;
  schedule: ResourceSchedule[];
  workingHours: WorkingHours;
}

export interface Truck {
  id: string;
  plateNumber: string;
  model: string;
  year: number;
  capacity: number; // in tons
  isAvailable: boolean;
  fuelType: 'diesel' | 'electric' | 'hybrid';
  schedule: ResourceSchedule[];
}

export interface Trailer {
  id: string;
  plateNumber: string;
  type: 'flatbed' | 'enclosed' | 'refrigerated' | 'tanker';
  capacity: number; // in tons
  isAvailable: boolean;
  currentLocation: string; // depot or customer address ID
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  schedule: ResourceSchedule[];
}

export interface CustomerAddress {
  id: string;
  companyName: string;
  contactPerson: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface PlanItem {
  id: string;
  addressId: string;
  address: CustomerAddress;
  sequence: number;
  estimatedArrival?: string;
  startTime: string;
  endTime: string;
  estimatedDuration: number; // in minutes
  actualDuration?: number; // in minutes (for completed jobs)
  notes?: string;
  jobType: 'delivery' | 'collection' | 'trailer_change';
  bookingTime: string;
  assignedTrailer?: string;
  driverId?: string;
  truckId?: string;
  // For trailer changes
  previousTrailer?: string;
  newTrailer?: string;
  dropOffLocation?: CustomerAddress; // Where to drop old trailer
  pickUpLocation?: CustomerAddress; // Where to pick up new trailer
}

export interface DeliveryPlan {
  id: string;
  type: 'international' | 'local';
  driverId?: string;
  truckId?: string;
  trailerId?: string;
  items: PlanItem[];
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'confirmed' | 'in-progress' | 'completed';
}

export type PlanType = 'international' | 'local'; 