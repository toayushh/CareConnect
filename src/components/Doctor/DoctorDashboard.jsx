import React, { useEffect, useState } from 'react';
import DoctorSidebar from './DoctorSidebar';
import DoctorAppointments from './DoctorAppointments';
import DoctorProfile from './DoctorProfile';
import DoctorAnalytics from './DoctorAnalytics';
import DoctorSchedule from './DoctorSchedule';
import DoctorPatients from './DoctorPatients';
import AdvancedPatientProgress from './AdvancedPatientProgress';
import TreatmentPlanManager from './TreatmentPlanManager';
import MessageCenter from './MessageCenter';
import WorkshopsPanel from '../Workshops/WorkshopsPanel';
import FeedbackPanel from '../Feedback/FeedbackPanel';

const DoctorDashboard = () => {
  const nav = [
    { id: 'doc-appointments', label: 'Appointments', icon: '📅' },
    { id: 'doc-patients', label: 'Patients', icon: '👥' },
    { id: 'doc-progress', label: 'Patient Progress', icon: '📈' },
    { id: 'doc-treatment-plans', label: 'Treatment Plans', icon: '📋' },
    { id: 'doc-messages', label: 'Messages', icon: '💬' },
    { id: 'doc-schedule', label: 'Schedule', icon: '🕒' },
    { id: 'doc-analytics', label: 'Analytics', icon: '📊' },
    { id: 'doc-profile', label: 'Profile', icon: '👤' },
    { id: 'doc-workshops', label: 'Workshops', icon: '🧑‍🏫' },
    { id: 'doc-feedback', label: 'Feedback', icon: '🔄' },
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
      <DoctorSidebar activeItem={active} onNavigate={handleNavigation} />
      <div className="md:ml-56">
        <main className="pt-14">
          {active === 'doc-appointments' && (
            <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4 animate-fade-in">
              <DoctorAppointments />
            </section>
          )}

          {active === 'doc-schedule' && (
            <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4 animate-fade-in">
              <DoctorSchedule />
            </section>
          )}

          {active === 'doc-analytics' && (
            <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4 animate-fade-in">
              <DoctorAnalytics />
            </section>
          )}

          {active === 'doc-profile' && (
            <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4 animate-fade-in">
              <DoctorProfile />
            </section>
          )}

          {active === 'doc-workshops' && (
            <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4 animate-fade-in">
              <WorkshopsPanel />
            </section>
          )}

          {active === 'doc-feedback' && (
            <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4 animate-fade-in">
              <FeedbackPanel />
            </section>
          )}

          {active === 'doc-patients' && (
            <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4 animate-fade-in">
              <DoctorPatients />
            </section>
          )}

          {active === 'doc-progress' && (
            <section className="animate-fade-in">
              <AdvancedPatientProgress />
            </section>
          )}

          {active === 'doc-treatment-plans' && (
            <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4 animate-fade-in">
              <TreatmentPlanManager />
            </section>
          )}

          {active === 'doc-messages' && (
            <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4 animate-fade-in">
              <MessageCenter />
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;