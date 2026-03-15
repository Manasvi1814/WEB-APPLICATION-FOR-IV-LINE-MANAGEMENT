import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Users, FileText, Calendar, Package, Shield, Settings, LogOut } from 'lucide-react';
import NotificationSystem from './NotificationSystem';

const Layout: React.FC = () => {
  const { department, logout } = useAuth();
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'warning' as const,
      title: 'High Phlebitis Score Alert',
      message: 'Patient P001 has a phlebitis score of 3. Consider IV removal.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      read: false,
      action: { label: 'View Patient', onClick: () => console.log('Navigate to patient') }
    },
    {
      id: '2',
      type: 'info' as const,
      title: 'IV Line Duration Alert',
      message: 'Peripheral IV for Patient P002 has been in place for 4 days.',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      read: false
    },
    {
      id: '3',
      type: 'success' as const,
      title: 'Inventory Restocked',
      message: 'IV Cannula 20G inventory has been restocked to 150 units.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true
    }
  ]);

  const navigationItems = [
    { icon: Activity, label: 'Dashboard', href: '/dashboard' },
    { icon: Users, label: 'Patients', href: '/patients' },
    { icon: FileText, label: 'Reports', href: '/reports' },
    { icon: Calendar, label: 'Schedule', href: '/schedule' },
    { icon: Package, label: 'Inventory', href: '/inventory' },
    { icon: Shield, label: 'Audit Log', href: '/audit' },
    { icon: Settings, label: 'Admin', href: '/admin' },
  ];

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleClearAll = () => setNotifications([]);

  if (!department) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full"></div>
    </div>;
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg relative">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">IV Management</h1>
          <p className="text-xs text-gray-500">Hospital System</p>
          <p className="mt-2 text-sm font-medium text-gray-700">Dept: {department.name}</p>
        </div>

        <nav className="mt-6">
          {navigationItems.map(item => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-6 py-3 transition-colors duration-200 ${
                  isActive ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                }`
              }
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 w-64 p-6 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{department.name}</p>
              <p className="text-xs text-gray-500">Department</p>
            </div>
            <button onClick={logout} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">{department.name} Dashboard</h2>
            <NotificationSystem notifications={notifications} onMarkAsRead={handleMarkAsRead} onClearAll={handleClearAll} />
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet /> {/* Nested route content */}
        </main>
      </div>
    </div>
  );
};

export default Layout;