import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthPage = () => {
  const [userType, setUserType] = useState('patient'); // 'patient' or 'doctor'
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* User Type Toggle */}
        <div className="bg-white rounded-lg p-2 mb-6 shadow-sm">
          <div className="flex">
            <button
              onClick={() => setUserType('patient')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                userType === 'patient'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              I'm a Patient
            </button>
            <button
              onClick={() => setUserType('doctor')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                userType === 'doctor'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              I'm a Doctor
            </button>
          </div>
        </div>

        {/* LeapFrog Logo/Branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">🐸 LeapFrog</h1>
          <p className="text-gray-600">Connecting Patients with the Right Doctors</p>
        </div>

        {/* Auth Forms */}
        {isLogin ? (
          <LoginForm 
            userType={userType} 
            onSwitchToRegister={() => setIsLogin(false)} 
          />
        ) : (
          <RegisterForm 
            userType={userType} 
            onSwitchToLogin={() => setIsLogin(true)} 
          />
        )}
      </div>
    </div>
  );
};

export default AuthPage;