import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../Sidebar';
import DoctorSearch from './DoctorSearch';
import ConsentsPanel from '../Consents/ConsentsPanel';
import FeedbackPanel from '../Feedback/FeedbackPanel';
import PartnersPanel from '../Partners/PartnersPanel';
import AppointmentsList from './AppointmentsList';
import PatientProfile from './PatientProfile';
import ProgressTracking from './ProgressTrackingSimple';
import HealthRecommendations from './HealthRecommendations';
import HealthDashboard from './HealthDashboard';
import AdvancedHealthDashboard from './AdvancedHealthDashboard';
import TreatmentPlansAnalytics from './TreatmentPlansAnalytics';
import AIPredictions from './AIPredictions';
import DataQualityDashboard from './DataQualityDashboard';
import LeapFrogRecommendations from './LeapFrogRecommendations';
import MedicalRecords from './MedicalRecords';
import ChatbotWidget from '../Chatbot/ChatbotWidget';
import ChatbotPage from '../Chatbot/ChatbotPage';

const PatientDashboard = () => {
  const { fetchWithAuth, user } = useAuth();
  
  const nav = [
    { id: 'patient-dashboard', label: 'Health Dashboard', icon: '🏠' },
    { id: 'patient-advanced-dashboard', label: 'Advanced Analytics', icon: '📈' },
    { id: 'patient-treatment-analytics', label: 'Treatment Analytics', icon: '📊' },
    { id: 'patient-ai-predictions', label: 'AI Predictions', icon: '🔮' },
    { id: 'patient-data-quality', label: 'Data Quality', icon: '📊' },
    { id: 'patient-search', label: 'Find Doctors', icon: '🔍' },
    { id: 'patient-appointments', label: 'My Appointments', icon: '📅' },
    { id: 'patient-recommendations', label: 'AI Recommendations', icon: '🧠' },
    { id: 'patient-leapfrog', label: 'LeapFrog AI', icon: '🚀' },
    { id: 'patient-chatbot', label: 'Health Assistant', icon: '🤖' },
    { id: 'patient-records', label: 'Medical Records', icon: '📋' },
    { id: 'patient-progress', label: 'Progress Tracking', icon: '📊' },
    { id: 'patient-profile', label: 'Profile', icon: '👤' },
    { id: 'patient-consents', label: 'Privacy & Consent', icon: '✅' },
    { id: 'patient-feedback', label: 'Feedback', icon: '💬' },
    { id: 'patient-partners', label: 'Partners', icon: '🤝' },
  ];

  const getInitial = () => {
    if (typeof window === 'undefined') return nav[0].id;
    const h = window.location.hash.replace('#', '');
    return nav.some((n) => n.id === h) ? h : nav[0].id;
  };
  const [active, setActive] = useState(getInitial);

  useEffect(() => {
    const onHash = () => {
      const id = window.location.hash.replace('#', '');
      if (nav.some((n) => n.id === id)) setActive(id);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const handleNavigation = (itemId) => {
    setActive(itemId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar activeItem={active} onNavigate={handleNavigation} />
      <div className="md:ml-56">
        <main className="pt-14">
          
          {active === 'patient-dashboard' && (
            <section className="animate-fade-in">
              <HealthDashboard />
            </section>
          )}

          {active === 'patient-advanced-dashboard' && (
            <section className="animate-fade-in">
              <AdvancedHealthDashboard />
            </section>
          )}

          {active === 'patient-treatment-analytics' && (
            <section className="animate-fade-in">
              <TreatmentPlansAnalytics />
            </section>
          )}

          {active === 'patient-ai-predictions' && (
            <section className="animate-fade-in">
              <AIPredictions />
            </section>
          )}

          {active === 'patient-data-quality' && (
            <section className="animate-fade-in">
              <DataQualityDashboard />
            </section>
          )}

          {active === 'patient-leapfrog' && (
            <section className="animate-fade-in">
              <LeapFrogRecommendations />
            </section>
          )}

          {active === 'patient-search' && (
            <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4 animate-fade-in">
              <DoctorSearch />
            </section>
          )}

          {active === 'patient-appointments' && (
            <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4 animate-fade-in">
              <AppointmentsList />
            </section>
          )}

          {active === 'patient-recommendations' && (
            <section className="animate-fade-in">
              <HealthRecommendations />
            </section>
          )}

          {active === 'patient-chatbot' && (
            <section className="animate-fade-in">
              <ChatbotPage />
            </section>
          )}

          {active === 'patient-records' && (
            <section className="animate-fade-in">
              <MedicalRecords />
            </section>
          )}

          {active === 'patient-profile' && (
            <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4 animate-fade-in">
              <PatientProfile />
            </section>
          )}

          {active === 'patient-consents' && (
            <section className="animate-fade-in">
              <ConsentsPanel />
            </section>
          )}

          {active === 'patient-feedback' && (
            <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4 animate-fade-in">
              <FeedbackPanel />
            </section>
          )}

          {active === 'patient-partners' && (
            <section className="animate-fade-in">
              <PartnersPanel />
            </section>
          )}

          {active === 'patient-progress' && (
            <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4 animate-fade-in">
              <ProgressTracking />
            </section>
          )}
        </main>
      </div>
      
      {/* Floating Chatbot Widget */}
      {active !== 'patient-chatbot' && <ChatbotWidget />}
    </div>
  );
};

export default PatientDashboard;