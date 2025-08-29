import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('today');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reschedule, setReschedule] = useState(null); // { id, date, time }

  const { fetchWithAuth } = useAuth();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchWithAuth('/api/appointments');
        if (!res.ok) throw new Error('Failed to load appointments');
        const data = await res.json();
        // Normalize into the shape expected by the UI
        const mapped = data.map(a => ({
          id: a.id,
          patientName: a.patient_name || 'Unknown',
          // Age not available directly; optional improvement: fetch patient profile
          patientAge: undefined,
          time: new Date(a.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: a.start_time,
          type: a.appointment_type || 'in-person',
          reason: a.reason,
          status: a.status === 'scheduled' ? 'confirmed' : (a.status || 'scheduled'),
          phone: '',
        }));
        setAppointments(mapped);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchWithAuth]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const endpoint = newStatus === 'cancelled' ? `/api/appointments/${appointmentId}/cancel` : `/api/appointments/${appointmentId}/status`;
      const options = newStatus === 'cancelled'
        ? { method: 'POST' }
        : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) };
      const res = await fetchWithAuth(endpoint, options);
      if (!res.ok) throw new Error('Failed to update');
      setAppointments(prev => prev.map(apt => apt.id === appointmentId ? { ...apt, status: newStatus } : apt));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Appointments</h1>
          <p className="text-gray-600">Manage your patient appointments and consultations</p>
        </div>

        <div className="flex space-x-2">
          {['today', 'this-week', 'all'].map(filterType => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === filterType
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {filterType === 'today' ? 'Today' :
               filterType === 'this-week' ? 'This Week' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments scheduled</h3>
          <p className="text-gray-500">Your appointment list will appear here when patients book with you.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map(appointment => (
            <div key={appointment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {appointment.patientName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {appointment.patientName}
                    </h3>
                    <p className="text-sm text-gray-600">Age: {appointment.patientAge}</p>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">🕒</span>
                        {appointment.time} - {new Date(appointment.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">📱</span>
                        {appointment.type === 'video' ? 'Video Call' :
                         appointment.type === 'phone' ? 'Phone Call' : 'In-Person'}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">📞</span>
                        {appointment.phone}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </span>

                  <div className="flex space-x-2">
                    {appointment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {appointment.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(appointment.id, 'completed')}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Mark Complete
                        </button>
                        <button className="text-gray-600 hover:text-gray-800 text-sm font-medium" onClick={() => setReschedule({ id: appointment.id, date: appointment.date })}>
                          Reschedule
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {appointment.reason && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Reason for visit: </span>
                    {appointment.reason}
                  </p>
                </div>
              )}

              {appointment.type === 'video' && appointment.status === 'confirmed' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium">
                    Start Video Call
                  </button>
                </div>
              )}
            </div>
          ))}

      {reschedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Reschedule Appointment</h3>
              <button onClick={() => setReschedule(null)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
                <input type="date" value={reschedule.date?.split('T')[0] || ''} min={new Date().toISOString().split('T')[0]}
                  onChange={e => setReschedule(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Time</label>
                <input type="time" onChange={e => setReschedule(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={async () => {
                  if (!reschedule.date || !reschedule.time) return;
                  const d = new Date(`${reschedule.date}T${reschedule.time}:00`);
                  const startISO = d.toISOString();
                  const endISO = new Date(d.getTime() + 30 * 60 * 1000).toISOString();
                  const resp = await fetchWithAuth(`/api/appointments/${reschedule.id}/reschedule`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ start_time: startISO, end_time: endISO })
                  });
                  if (resp.ok) {
                    setAppointments(prev => prev.map(a => a.id === reschedule.id ? { ...a, date: startISO, time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : a));
                    setReschedule(null);
                  } else {
                    alert('Failed to reschedule');
                  }
                }} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Save</button>
                <button onClick={() => setReschedule(null)} className="flex-1 px-4 py-2 border rounded-md">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;