import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Truck, Users, Package2, Home, MapPin } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Delivver</h1>
              <nav style={{ display: 'flex', gap: '0.25rem' }}>
                <Link
                  to="/"
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textDecoration: 'none',
                    backgroundColor: isActive('/') ? '#dbeafe' : 'transparent',
                    color: isActive('/') ? '#1d4ed8' : '#6b7280',
                  }}
                >
                  <Home size={16} />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/drivers"
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textDecoration: 'none',
                    backgroundColor: isActive('/drivers') ? '#dbeafe' : 'transparent',
                    color: isActive('/drivers') ? '#1d4ed8' : '#6b7280',
                  }}
                >
                  <Users size={16} />
                  <span>Drivers</span>
                </Link>
                <Link
                  to="/trucks"
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textDecoration: 'none',
                    backgroundColor: isActive('/trucks') ? '#dbeafe' : 'transparent',
                    color: isActive('/trucks') ? '#1d4ed8' : '#6b7280',
                  }}
                >
                  <Truck size={16} />
                  <span>Trucks</span>
                </Link>
                <Link
                  to="/trailers"
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textDecoration: 'none',
                    backgroundColor: isActive('/trailers') ? '#dbeafe' : 'transparent',
                    color: isActive('/trailers') ? '#1d4ed8' : '#6b7280',
                  }}
                >
                  <Package2 size={16} />
                  <span>Trailers</span>
                </Link>
                <Link
                  to="/customers"
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textDecoration: 'none',
                    backgroundColor: isActive('/customers') ? '#dbeafe' : 'transparent',
                    color: isActive('/customers') ? '#1d4ed8' : '#6b7280',
                  }}
                >
                  <MapPin size={16} />
                  <span>Customers</span>
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>
      <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout; 