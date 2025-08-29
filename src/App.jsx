import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ApiProvider, useApi } from './contexts/ApiContext';
import AuthPage from './components/Auth/AuthPage';
import PatientDashboard from './components/Patient/PatientDashboard';
import DoctorDashboard from './components/Doctor/DoctorDashboard';
import Header from './components/Header';
import LandingPage from './components/Landing/LandingPage';
import BackendStatus from './components/BackendStatus';

function AppContent() {
  const { user, userType, loading } = useAuth();
  const { isConnected, connectionStatus } = useApi();
  const [showAuth, setShowAuth] = useState(false);

  // Check for expired tokens on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        if (payload.exp < currentTime) {
          console.log('Token expired on app mount, clearing authentication');
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          setShowAuth(true);
        }
      } catch (error) {
        console.log('Invalid token format, clearing authentication');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        setShowAuth(true);
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading LeapFrog...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return showAuth ? (
      <AuthPage />
    ) : (
      <LandingPage onSignIn={() => setShowAuth(true)} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BackendStatus />
      <Header />
      {userType === 'patient' ? <PatientDashboard /> : <DoctorDashboard />}
    </div>
  );
}

function App() {
  return (
    <ApiProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ApiProvider>
  );
}

export default App;