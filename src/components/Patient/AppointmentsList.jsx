import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AppointmentsList = () => {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past', 'cancelled'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { fetchWithAuth } = useAuth();

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth('/api/appointments');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to load appointments');
      }
      const data = await res.json();
      // Map to UI shape if needed
      const mapped = data.map((a) => ({
        id: a.id,
        doctorId: a.doctor_id,
        date: a.start_time,
        time: new Date(a.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: a.appointment_type,
        reason: a.reason || a.notes,
        status: a.status,
        fee: a.fee,
        doctorName: a.doctor_name,
        doctorSpecialization: a.doctor_specialty,
        doctorAvatar: a.doctor_avatar,
      }));
      setAppointments(mapped);
    } catch (e) {
      setError(e.message);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // Make refresh function globally available
    window.refreshAppointments = fetchAppointments;
    
    // Cleanup
    return () => {
      delete window.refreshAppointments;
    };
  }, []);

  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return appointment.status === 'booked' || appointment.status === 'scheduled' || appointment.status === 'confirmed';
    if (filter === 'past') return appointment.status === 'completed';
    if (filter === 'cancelled') return appointment.status === 'cancelled';
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
      case 'booked':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      try {
        const res = await fetchWithAuth(`/api/appointments/${appointmentId}/cancel`, {
          method: 'POST',
        });
        if (res.ok) {
          fetchAppointments();
        } else {
          const errorData = await res.json().catch(() => ({}));
          setError(errorData.message || 'Failed to cancel appointment');
        }
      } catch (e) {
        setError(e.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Appointments</h1>
          <p className="text-gray-600">Manage your upcoming and past appointments</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchAppointments}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading...
              </>
            ) : (
              <>🔄 Refresh</>
            )}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-xl w-fit">
        {[
          { key: 'all', label: 'All', icon: '📋' },
          { key: 'upcoming', label: 'Upcoming', icon: '⏰' },
          { key: 'past', label: 'Past', icon: '✅' },
          { key: 'cancelled', label: 'Cancelled', icon: '❌' }
        ].map(filterType => (
          <button
            key={filterType.key}
            onClick={() => setFilter(filterType.key)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === filterType.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <span>{filterType.icon}</span>
            <span>{filterType.label}</span>
          </button>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-500">Loading your appointments...</span>
          </div>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {filter !== 'all' ? filter : ''} appointments found
          </h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all' 
              ? "You haven't booked any appointments yet." 
              : `You don't have any ${filter} appointments.`
            }
          </p>
          {filter === 'all' && (
            <button
              onClick={() => window.location.hash = 'patient-search'}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
            >
              🔍 Find Doctors
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAppointments.map(appointment => {
            const appointmentDate = new Date(appointment.date);
            const isUpcoming = appointmentDate > new Date();
            const isToday = appointmentDate.toDateString() === new Date().toDateString();
            
            return (
              <div key={appointment.id} className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all duration-200 hover:shadow-lg ${
                isToday ? 'border-orange-200 bg-orange-50' : 'border-gray-200 hover:border-blue-200'
              }`}>
                {isToday && (
                  <div className="bg-orange-100 text-orange-800 text-xs font-medium px-3 py-1 rounded-full mb-4 w-fit">
                    📅 Today's Appointment
                  </div>
                )}
                
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      {appointment.doctorAvatar ? (
                        <img
                          src={appointment.doctorAvatar}
                          alt={appointment.doctorName}
                          className="w-16 h-16 rounded-full object-cover ring-4 ring-blue-50"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                          {(appointment.doctorName || 'Dr').charAt(0)}
                        </div>
                      )}
                      {['booked', 'confirmed', 'scheduled'].includes(appointment.status) && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {appointment.doctorName || `Doctor #${appointment.doctorId}`}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </div>
                      
                      {appointment.doctorSpecialization && (
                        <p className="text-sm text-gray-600 capitalize font-medium">
                          {appointment.doctorSpecialization}
                        </p>
                      )}
                      
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                          <span className="mr-2">📅</span>
                          <span className="font-medium">
                            {appointmentDate.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                          <span className="mr-2">🕒</span>
                          <span className="font-medium">{appointment.time}</span>
                        </div>
                        
                        {appointment.type && (
                          <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                            <span className="mr-2">
                              {appointment.type === 'video' ? '💻' : 
                               appointment.type === 'phone' ? '📞' : '🏥'}
                            </span>
                            <span className="font-medium">
                              {appointment.type === 'video' ? 'Video Call' : 
                               appointment.type === 'phone' ? 'Phone Call' : 'In-Person'}
                            </span>
                          </div>
                        )}
                        
                        {appointment.fee && (
                          <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                            <span className="mr-2">💰</span>
                            <span className="font-medium">${appointment.fee}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 lg:items-end">
                    {['booked', 'confirmed', 'scheduled'].includes(appointment.status) && (
                      <div className="flex space-x-2">
                        {appointment.type === 'video' && (
                          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium">
                            📹 Join Call
                          </button>
                        )}
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {appointment.reason && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium text-blue-800">Reason for visit: </span>
                        {appointment.reason}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AppointmentsList;