import React from 'react';
import { MapPin, Phone, Mail, Building2, Plus } from 'lucide-react';
import { useData } from '../context/DataContext';

const CustomersPage: React.FC = () => {
  const { customers } = useData();
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>Customer Addresses</h2>
            <p style={{ color: '#6b7280', margin: 0 }}>Manage all customer locations and contact information</p>
          </div>
          <button
            onClick={() => alert('Add customer functionality (quick implementation)')}
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
            Add Customer
          </button>
        </div>
      </div>

      {/* Local Customers */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>Local</span>
          USA Customers
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem' }}>
          {customers.filter(addr => addr.country === 'USA').map((customer, index) => (
            <div key={customer.id} style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '0.5rem', 
              padding: '1.25rem',
              backgroundColor: '#f9fafb'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0 0 0.25rem 0' }}>
                    {customer.companyName}
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Building2 style={{ width: '1rem', height: '1rem' }} />
                    {customer.contactPerson}
                  </p>
                </div>
                <span style={{ 
                  backgroundColor: '#dcfce7', 
                  color: '#166534', 
                  fontSize: '0.75rem', 
                  fontWeight: '500', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '0.25rem' 
                }}>
                  #{index + 1}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  <MapPin style={{ width: '1rem', height: '1rem', marginTop: '0.125rem', flexShrink: 0 }} />
                  <span>{customer.address}, {customer.city}, {customer.country}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  <Phone style={{ width: '1rem', height: '1rem' }} />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  <Mail style={{ width: '1rem', height: '1rem' }} />
                  <span>{customer.contactPerson.toLowerCase().replace(' ', '.')}@{customer.companyName.toLowerCase().replace(' ', '')}.com</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* International Customers */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>International</span>
          Global Customers
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem' }}>
          {customers.filter(addr => addr.country !== 'USA').map((customer, index) => (
            <div key={customer.id} style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '0.5rem', 
              padding: '1.25rem',
              backgroundColor: '#f9fafb'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0 0 0.25rem 0' }}>
                    {customer.companyName}
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Building2 style={{ width: '1rem', height: '1rem' }} />
                    {customer.contactPerson}
                  </p>
                </div>
                <span style={{ 
                  backgroundColor: '#fef3c7', 
                  color: '#92400e', 
                  fontSize: '0.75rem', 
                  fontWeight: '500', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '0.25rem' 
                }}>
                  #{index + 1}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  <MapPin style={{ width: '1rem', height: '1rem', marginTop: '0.125rem', flexShrink: 0 }} />
                  <span>{customer.address}, {customer.city}, {customer.country}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  <Phone style={{ width: '1rem', height: '1rem' }} />
                  <span>{customer.country === 'Germany' ? '+49 30 12345678' : 
                        customer.country === 'France' ? '+33 1 23456789' : '+44 20 12345678'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  <Mail style={{ width: '1rem', height: '1rem' }} />
                  <span>{customer.contactPerson.toLowerCase().replace(' ', '.')}@{customer.companyName.toLowerCase().replace(' ', '')}.com</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomersPage; 