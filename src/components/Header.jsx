import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { user, userType, logout } = useAuth();

  const getProfileLink = () => {
    if (userType === 'patient') {
      return '#patient-profile';
    }
    return '#doc-profile';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-600 to-blue-600 shadow-lg border-b border-emerald-300">
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between h-14">
          <div className="flex items-center">
            <div className="flex items-center space-x-3 group">
              {/* Enhanced Frog Logo */}
              <div className="relative">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105 animate-breathe">
                  <span className="text-2xl filter drop-shadow-sm">🐸</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-xs">✨</span>
                </div>
              </div>
              
              {/* Logo Text */}
              <div className="flex flex-col">
                <div className="flex items-center space-x-1">
                  <h1 className="text-xl font-black text-white tracking-tight">LeapFrog</h1>
                  <span className="px-2 py-0.5 bg-yellow-400 text-emerald-800 text-xs font-bold rounded-full uppercase tracking-wide shadow-sm animate-pulse-glow">
                    AI
                  </span>
                </div>
                <span className="text-xs text-emerald-100 font-medium hidden sm:block -mt-0.5">
                  {userType === 'patient' ? '🏥 Patient Portal' : '👩‍⚕️ Doctor Portal'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button className="bg-white/20 backdrop-blur-sm p-2 rounded-full text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 hover:scale-105">
                <span className="sr-only">View notifications</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5-5 5h5z" />
                </svg>
              </button>
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-md">
                3
              </span>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <a href={getProfileLink()} className="flex items-center space-x-3 group bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 hover:bg-white/20 transition-all duration-200">
                <img
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-white/30 group-hover:ring-white/60 transition-all duration-200"
                  src={user?.avatar}
                  alt={user?.name}
                />
                <div className="hidden md:block">
                  <span className="text-sm font-semibold text-white group-hover:text-yellow-100">{user?.name}</span>
                  <p className="text-xs text-emerald-100 capitalize font-medium">{userType}</p>
                </div>
              </a>
              
              {/* Logout Button */}
              <button
                onClick={logout}
                className="bg-white/20 backdrop-blur-sm p-2 rounded-full text-white hover:bg-red-500/80 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 hover:scale-105 group"
                title="Logout"
              >
                <svg className="h-5 w-5 group-hover:rotate-12 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;