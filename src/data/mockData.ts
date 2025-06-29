import { Driver, Truck, Trailer, CustomerAddress, ResourceSchedule } from '../types';

export const mockDrivers: Driver[] = [
  {
    id: '1',
    name: 'John Smith',
    licenseNumber: 'CDL123456',
    phone: '+1 555-0101',
    email: 'john.smith@email.com',
    isAvailable: true,
    experienceYears: 8,
    schedule: [],
    workingHours: {
      dailyHoursWorked: 0,
      weeklyHoursWorked: 0,
      lastWorkDate: new Date().toISOString().split('T')[0],
      maxDailyHours: 900, // 15 hours
      maxWeeklyHours: 3600, // 60 hours
      plannedShiftStartTime: undefined,
      plannedShiftEndTime: undefined
    }
  },
  {
    id: '2',
    name: 'Maria Garcia',
    licenseNumber: 'CDL789012',
    phone: '+1 555-0102',
    email: 'maria.garcia@email.com',
    isAvailable: true,
    experienceYears: 12,
    schedule: [],
    workingHours: {
      dailyHoursWorked: 480, // 8 hours already worked today
      weeklyHoursWorked: 2400, // 40 hours this week
      shiftStartTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // Started 8 hours ago
      lastWorkDate: new Date().toISOString().split('T')[0],
      maxDailyHours: 900, // 15 hours
      maxWeeklyHours: 3600, // 60 hours
      plannedShiftStartTime: undefined,
      plannedShiftEndTime: undefined
    }
  },
  {
    id: '3',
    name: 'David Johnson',
    licenseNumber: 'CDL345678',
    phone: '+1 555-0103',
    email: 'david.johnson@email.com',
    isAvailable: false,
    experienceYears: 5,
    schedule: [
      {
        id: 'sched-1',
        startTime: '2024-01-15T07:00:00Z',
        endTime: '2024-01-15T15:00:00Z',
        planId: 'maintenance-1',
        driverId: '3',
        status: 'in-progress',
        notes: 'Vehicle maintenance and inspection'
      }
    ],
    workingHours: {
      dailyHoursWorked: 480, // 8 hours already worked
      weeklyHoursWorked: 2880, // 48 hours this week
      shiftStartTime: '2024-01-15T07:00:00Z',
      lastWorkDate: new Date().toISOString().split('T')[0],
      maxDailyHours: 900, // 15 hours
      maxWeeklyHours: 3600, // 60 hours
      plannedShiftStartTime: undefined,
      plannedShiftEndTime: undefined
    }
  },
  {
    id: '4',
    name: 'Sarah Williams',
    licenseNumber: 'CDL901234',
    phone: '+1 555-0104',
    email: 'sarah.williams@email.com',
    isAvailable: true,
    experienceYears: 15,
    schedule: [],
    workingHours: {
      dailyHoursWorked: 0,
      weeklyHoursWorked: 1800, // 30 hours this week
      lastWorkDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last worked yesterday
      maxDailyHours: 900, // 15 hours
      maxWeeklyHours: 3600, // 60 hours
      plannedShiftStartTime: undefined,
      plannedShiftEndTime: undefined
    }
  },
];

export const mockTrucks: Truck[] = [
  {
    id: '1',
    plateNumber: 'TRK-001',
    model: 'Volvo FH16',
    year: 2022,
    capacity: 40,
    isAvailable: true,
    fuelType: 'diesel',
    schedule: [],
  },
  {
    id: '2',
    plateNumber: 'TRK-002',
    model: 'Mercedes Actros',
    year: 2021,
    capacity: 44,
    isAvailable: true,
    fuelType: 'diesel',
    schedule: [],
  },
  {
    id: '3',
    plateNumber: 'TRK-003',
    model: 'Tesla Semi',
    year: 2023,
    capacity: 36,
    isAvailable: false,
    fuelType: 'electric',
    schedule: [
      {
        id: 'sched-2',
        startTime: '2024-01-15T08:00:00Z',
        endTime: '2024-01-15T16:00:00Z',
        planId: 'service-1',
        driverId: '3',
        status: 'scheduled',
        notes: 'Scheduled maintenance - battery check'
      }
    ],
  },
  {
    id: '4',
    plateNumber: 'TRK-004',
    model: 'Scania R-Series',
    year: 2020,
    capacity: 42,
    isAvailable: true,
    fuelType: 'diesel',
    schedule: [],
  },
];

export const mockTrailers: Trailer[] = [
  {
    id: '1',
    plateNumber: 'TRL-001',
    type: 'enclosed',
    capacity: 24,
    isAvailable: true,
    currentLocation: 'depot-1', // Main Distribution Center
    dimensions: { length: 13.6, width: 2.48, height: 2.7 },
    schedule: [],
  },
  {
    id: '2',
    plateNumber: 'TRL-002',
    type: 'refrigerated',
    capacity: 22,
    isAvailable: true,
    currentLocation: 'depot-1', // Main Distribution Center
    dimensions: { length: 13.6, width: 2.48, height: 2.6 },
    schedule: [],
  },
  {
    id: '3',
    plateNumber: 'TRL-003',
    type: 'flatbed',
    capacity: 28,
    isAvailable: false,
    currentLocation: '1', // At customer location - ABC Logistics
    dimensions: { length: 13.6, width: 2.48, height: 0.15 },
    schedule: [
      {
        id: 'sched-3',
        startTime: '2024-01-15T07:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
        planId: 'delivery-plan-1',
        driverId: '1',
        status: 'in-progress',
        notes: 'Collection from ABC Logistics'
      }
    ],
  },
  {
    id: '4',
    plateNumber: 'TRL-004',
    type: 'tanker',
    capacity: 30,
    isAvailable: true,
    currentLocation: 'depot-2', // Southwest Regional Yard
    dimensions: { length: 12, width: 2.5, height: 3.8 },
    schedule: [],
  },
];

export const mockCustomerAddresses: CustomerAddress[] = [
  {
    id: '1',
    companyName: 'ABC Logistics',
    contactPerson: 'Mike Thompson',
    address: '123 Industrial Blvd',
    city: 'Los Angeles',
    zipCode: '90210',
    country: 'USA',
    phone: '+1 310-555-0001',
    email: 'mike@abclogistics.com',
    coordinates: { lat: 34.0522, lng: -118.2437 },
  },
  {
    id: '2',
    companyName: 'XYZ Manufacturing',
    contactPerson: 'Lisa Chen',
    address: '456 Factory Street',
    city: 'Phoenix',
    zipCode: '85001',
    country: 'USA',
    phone: '+1 602-555-0002',
    email: 'lisa@xyzmfg.com',
    coordinates: { lat: 33.4484, lng: -112.0740 },
  },
  {
    id: '3',
    companyName: 'Global Imports Ltd',
    contactPerson: 'Hans Mueller',
    address: 'Industriestraße 12',
    city: 'Hamburg',
    zipCode: '20095',
    country: 'Germany',
    phone: '+49 40 555-0003',
    email: 'hans@globalimports.de',
    coordinates: { lat: 53.5511, lng: 9.9937 },
  },
  {
    id: '4',
    companyName: 'Tech Solutions Inc',
    contactPerson: 'Emily Davis',
    address: '789 Tech Park Way',
    city: 'Austin',
    zipCode: '78701',
    country: 'USA',
    phone: '+1 512-555-0004',
    email: 'emily@techsolutions.com',
    coordinates: { lat: 30.2672, lng: -97.7431 },
  },
  {
    id: '5',
    companyName: 'European Distributors',
    contactPerson: 'Pierre Dubois',
    address: '15 Rue de Commerce',
    city: 'Lyon',
    zipCode: '69002',
    country: 'France',
    phone: '+33 4 72 55 0005',
    email: 'pierre@eudist.fr',
    coordinates: { lat: 45.7640, lng: 4.8357 },
  },
  {
    id: '6',
    companyName: 'North American Supplies',
    contactPerson: 'Robert Wilson',
    address: '321 Warehouse Ave',
    city: 'Denver',
    zipCode: '80202',
    country: 'USA',
    phone: '+1 303-555-0006',
    email: 'robert@nasupplies.com',
    coordinates: { lat: 39.7392, lng: -104.9903 },
  },
];

// Depot addresses for trailer changes
export const mockDepotAddresses: CustomerAddress[] = [
  {
    id: 'depot-1',
    companyName: 'Main Distribution Center',
    contactPerson: 'Depot Manager',
    address: '1000 Logistics Drive',
    city: 'Los Angeles',
    zipCode: '90040',
    country: 'USA',
    phone: '+1 323-555-DEPOT',
    email: 'depot@delivver.com',
    coordinates: { lat: 34.0194, lng: -118.2108 },
  },
  {
    id: 'depot-2',
    companyName: 'Southwest Regional Yard',
    contactPerson: 'Yard Supervisor',
    address: '2500 Freight Terminal Rd',
    city: 'Phoenix',
    zipCode: '85034',
    country: 'USA',
    phone: '+1 602-555-YARD',
    email: 'southwest@delivver.com',
    coordinates: { lat: 33.4152, lng: -112.0442 },
  },
  {
    id: 'depot-3',
    companyName: 'Central Texas Hub',
    contactPerson: 'Operations Manager',
    address: '750 Transport Way',
    city: 'Austin',
    zipCode: '78719',
    country: 'USA',
    phone: '+1 512-555-HUB1',
    email: 'central@delivver.com',
    coordinates: { lat: 30.1833, lng: -97.6803 },
  },
  {
    id: 'depot-4',
    companyName: 'Denver Mountain Depot',
    contactPerson: 'Fleet Coordinator',
    address: '4200 Mile High Blvd',
    city: 'Denver',
    zipCode: '80249',
    country: 'USA',
    phone: '+1 303-555-MILE',
    email: 'denver@delivver.com',
    coordinates: { lat: 39.7817, lng: -104.8731 },
  },
]; 