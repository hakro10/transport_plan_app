# Delivver Transport Management App 🚛

A comprehensive React TypeScript application for managing transport operations including drivers, trucks, trailers, and delivery planning with real-time tracking and resource scheduling.

## ✨ Features

### 🎯 **Dashboard - Command Center**
- **Driver Shift Planning**: Set planned shift times for drivers
- **Delivery Plan Creation**: Drag-and-drop interface for creating delivery routes
- **Resource Management**: Real-time truck, trailer, and driver assignment
- **Working Hours Tracking**: 15-hour daily limits with visual progress bars
- **Resource Conflict Prevention**: Automatic validation to prevent double-booking

### 👥 **Driver Management**
- Full CRUD operations (Create, Read, Update, Delete)
- **Controlled Shift System**: 
  - Planners set shift times via Dashboard
  - Drivers clock in/out in real-time
  - Validation prevents early clock-ins or work without plans
- Real-time status tracking (Available, Working, Busy)
- Complete schedule history with detailed breakdowns
- Working hours enforcement with daily/weekly limits

### 🚚 **Fleet Management**
- **Trucks**: Manage fleet with capacity, fuel type, model tracking
- **Trailers**: Location tracking, capacity management, availability status
- Resource scheduling with conflict detection
- Real-time availability indicators

### 📍 **Delivery Planning**
- Drag-and-drop address assignment
- Support for both local (USA) and international deliveries
- Job types: Deliveries, Collections, Trailer Changes
- **Smart Trailer Management**: Automatic trailer change jobs when switching trailers
- Location selection for trailer drop-off/pickup points
- Comprehensive notes system for all job types

### ⏰ **Advanced Scheduling**
- Resource availability validation during planned time periods
- Schedule arrays for all resources (drivers, trucks, trailers)
- Automatic status updates based on current time vs schedules
- Plan editing with resource conflict checking

### 📝 **Notes & Documentation**
- Editable notes for all delivery/collection/trailer change jobs
- Reference numbers and special instructions
- Notes persist even after plans are saved

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/hakro10/transport_plan_app.git
   cd transport_plan_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Layout.tsx      # Main app layout with navigation
├── context/            # React Context for state management
│   └── DataContext.tsx # Central data store and actions
├── data/               # Mock data and constants
│   └── mockData.ts     # Sample drivers, trucks, trailers, customers
├── pages/              # Main application pages
│   ├── Dashboard.tsx   # Shift planning & delivery creation
│   ├── DriversPage.tsx # Driver management & clock in/out
│   ├── TrucksPage.tsx  # Truck fleet management
│   ├── TrailersPage.tsx # Trailer management
│   └── CustomersPage.tsx # Customer address management
├── types/              # TypeScript type definitions
│   └── index.ts        # All interface definitions
└── App.tsx             # Main application component
```

## 🎮 How to Use

### For Planners 📋

1. **Set Driver Shifts** (Dashboard)
   - Go to Dashboard → Driver Shift Planning section
   - Click "Set Shift Times" for any driver
   - Set planned start and end times
   - Drivers can only clock in after planned start time

2. **Create Delivery Plans** (Dashboard)
   - Select Driver, Truck, and Trailer
   - Choose job type (Delivery/Collection)
   - Set booking time and plan type (Local/International)
   - Drag customer addresses to create route
   - System automatically validates working hours and resource availability

3. **Manage Resources** (Trucks/Trailers/Customers pages)
   - Add/edit/delete trucks and trailers
   - Track locations and capacity
   - View availability status

### For Drivers 🚛

1. **Clock In/Out** (Drivers page)
   - Go to Drivers page
   - Find your driver card
   - Click "Clock In" when starting work (only available if planner set shift times and you have assigned plans)
   - Click "Clock Out" when finishing shift

2. **View Your Schedule**
   - Click "Schedule" to see all your assigned plans
   - View detailed stop breakdowns with timing and notes

## 🛠️ Technology Stack

- **Frontend**: React 19 with TypeScript
- **UI Components**: Lucide React icons
- **Drag & Drop**: @hello-pangea/dnd
- **Routing**: React Router v6
- **Styling**: Inline styles (for maximum compatibility)
- **State Management**: React Context API
- **Package Manager**: npm

## 📊 Sample Data

The app comes pre-loaded with:
- **4 Drivers**: With various experience levels and availability
- **4 Trucks**: Different models, capacities, and fuel types
- **4 Trailers**: Various types and locations
- **6 Customer Addresses**: Mix of USA and international locations
- **3 Depot Locations**: For trailer management

## 🔒 Validation & Safety Features

- **Working Hours Limits**: 15-hour daily maximum with warnings
- **Resource Conflicts**: Prevents double-booking of drivers, trucks, trailers
- **Shift Validation**: Drivers cannot clock in without plans or before scheduled time
- **Real-time Updates**: Status updates every minute based on active schedules
- **Data Persistence**: All changes maintained during session

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

If you have any questions or need help, please:
1. Check the existing issues on GitHub
2. Create a new issue with detailed description
3. Provide steps to reproduce any bugs

## 🎯 Future Enhancements

- [ ] Database integration for data persistence
- [ ] User authentication and role-based access
- [ ] Mobile responsive design
- [ ] GPS tracking integration
- [ ] Automated route optimization
- [ ] Email/SMS notifications
- [ ] Reporting and analytics dashboard
- [ ] Multi-language support

---

**Delivver Transport Management App** - Streamlining transport operations with intelligent planning and real-time tracking! 🚛✨
