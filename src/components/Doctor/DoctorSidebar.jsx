import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const DoctorSidebar = ({ activeItem, onNavigate }) => {
  const [expandedGroups, setExpandedGroups] = useState(['patient-care']); // Only Patient Care expanded by default
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigationGroups = [
    {
      id: 'patient-care',
      label: 'Patient Care',
      icon: '👥',
      items: [
        { id: 'doc-patients', label: 'Patients', icon: '👥' },
        { id: 'doc-appointments', label: 'Appointments', icon: '📅' },
        { id: 'doc-progress', label: 'Patient Progress', icon: '📈' },
        { id: 'doc-treatment-plans', label: 'Treatment Plans', icon: '📋' },
      ]
    },
    {
      id: 'communication',
      label: 'Communication',
      icon: '💬',
      items: [
        { id: 'doc-messages', label: 'Messages', icon: '💬' },
        { id: 'doc-schedule', label: 'Schedule', icon: '🕒' },
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: '📊',
      items: [
        { id: 'doc-analytics', label: 'Analytics', icon: '📊' },
      ]
    },
    {
      id: 'professional',
      label: 'Professional',
      icon: '👨‍⚕️',
      items: [
        { id: 'doc-profile', label: 'Profile', icon: '👤' },
        { id: 'doc-workshops', label: 'Workshops', icon: '🧑‍🏫' },
        { id: 'doc-feedback', label: 'Feedback', icon: '🔄' },
      ]
    }
  ];

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleItemClick = (itemId) => {
    if (onNavigate) {
      onNavigate(itemId);
    }
    // Update URL hash for routing
    if (typeof window !== 'undefined') {
      window.location.hash = itemId;
    }
    // Close mobile menu after navigation
    setIsMobileOpen(false);
  };

  const SidebarContent = () => (
    <div className="p-4 bg-gradient-to-b from-blue-50 to-white h-full">
      <div className="mb-4 pb-3 border-b border-blue-200">
        <div className="flex items-center space-x-2 mb-1">
          <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
            <span className="text-sm">🐸</span>
          </div>
          <h2 className="text-sm font-bold text-blue-900">LeapFrog</h2>
          <span className="px-1.5 py-0.5 bg-yellow-400 text-blue-800 text-xs font-bold rounded-full uppercase tracking-wide shadow-sm">
            AI
          </span>
        </div>
        <p className="text-xs text-blue-600 ml-9 font-medium">Doctor Portal</p>
      </div>
      
      <nav className="space-y-1">
        {navigationGroups.map((group) => {
          const isExpanded = expandedGroups.includes(group.id);
          const hasActiveItem = group.items.some(item => item.id === activeItem);
          
          return (
            <div key={group.id} className="space-y-1">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center justify-between px-2 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  hasActiveItem 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <span className="mr-2">{group.icon}</span>
                  {group.label}
                </div>
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </button>
              
              {/* Group Items */}
              {isExpanded && (
                <div className="ml-3 space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = activeItem === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className={`w-full text-left flex items-center px-2 py-1.5 text-sm rounded-md transition-all ${
                          isActive
                            ? 'bg-indigo-100 text-indigo-700 border-l-2 border-indigo-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <span className="mr-2">{item.icon}</span>
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-16 left-3 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-blue-500 shadow-lg border border-white/20 hover:scale-105 transition-all duration-200"
        >
          {isMobileOpen ? (
            <XMarkIcon className="h-5 w-5 text-white" />
          ) : (
            <Bars3Icon className="h-5 w-5 text-white" />
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed top-14 bottom-0 left-0 right-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`md:hidden fixed top-14 bottom-0 left-0 z-50 w-56 bg-white transform transition-transform duration-300 ease-in-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <aside className="w-56 bg-gradient-to-b from-blue-50 to-white border-r border-blue-200 hidden md:block fixed left-0 top-14 bottom-0 z-40 shadow-lg">
        <SidebarContent />
      </aside>
    </>
  );
};

export default DoctorSidebar;
