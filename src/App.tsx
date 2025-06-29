import React, { useState, useEffect, useRef } from 'react';
import { Truck, Users, Package2, Home, MapPin } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import DriversPage from './pages/DriversPage';
import TrucksPage from './pages/TrucksPage';
import TrailersPage from './pages/TrailersPage';
import CustomersPage from './pages/CustomersPage';
import { DataProvider } from './context/DataContext';
import './App.css';

type TabType = 'dashboard' | 'drivers' | 'trucks' | 'trailers' | 'customers';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const scrollPositions = useRef<Record<TabType, number>>({
    dashboard: 0,
    drivers: 0,
    trucks: 0,
    trailers: 0,
    customers: 0
  });

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: Home },
    { id: 'drivers' as TabType, label: 'Drivers', icon: Users },
    { id: 'trucks' as TabType, label: 'Trucks', icon: Truck },
    { id: 'trailers' as TabType, label: 'Trailers', icon: Package2 },
    { id: 'customers' as TabType, label: 'Customers', icon: MapPin },
  ];

  // Save scroll position when switching tabs
  const handleTabChange = (newTab: TabType) => {
    // Save current scroll position
    scrollPositions.current[activeTab] = window.scrollY;
    setActiveTab(newTab);
  };

  // Restore scroll position when tab becomes active
  useEffect(() => {
    // Small delay to ensure content is rendered
    const timeoutId = setTimeout(() => {
      window.scrollTo(0, scrollPositions.current[activeTab]);
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [activeTab]);

  return (
    <DataProvider>
      <div className="App" style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        {/* Header with Tab Navigation */}
        <header style={{ 
          backgroundColor: 'white', 
          borderBottom: '1px solid #e5e7eb', 
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Delivver</h1>
                <nav style={{ display: 'flex', gap: '0.25rem' }}>
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          backgroundColor: activeTab === tab.id ? '#dbeafe' : 'transparent',
                          color: activeTab === tab.id ? '#1d4ed8' : '#6b7280',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <Icon size={16} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Content - All components stay mounted */}
        <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
          <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>
            <Dashboard />
          </div>
          <div style={{ display: activeTab === 'drivers' ? 'block' : 'none' }}>
            <DriversPage />
          </div>
          <div style={{ display: activeTab === 'trucks' ? 'block' : 'none' }}>
            <TrucksPage />
          </div>
          <div style={{ display: activeTab === 'trailers' ? 'block' : 'none' }}>
            <TrailersPage />
          </div>
          <div style={{ display: activeTab === 'customers' ? 'block' : 'none' }}>
            <CustomersPage />
          </div>
        </main>
      </div>
    </DataProvider>
  );
}

export default App;
