import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AppointmentConfirmation from './AppointmentConfirmation';

const BookingModal = ({ doctor, onClose }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('in-person');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [appointmentResult, setAppointmentResult] = useState(null);
  const { user, fetchWithAuth } = useAuth();

  const availableSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];

  const toIso = (dateStr, timeLabel) => {
    const [time, meridiem] = timeLabel.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (meridiem === 'PM' && h !== 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    const d = new Date(`${dateStr}T00:00:00`);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Auth handled centrally via fetchWithAuth (auto-refreshes tokens)

      const startISO = toIso(selectedDate, selectedTime);
      const endISO = new Date(new Date(startISO).getTime() + 30 * 60 * 1000).toISOString();
      
      console.log('Booking appointment with:', {
        doctor_id: Number(doctor.id || doctor.doctorId || doctor.doctor_id),
        start_time: startISO,
        end_time: endISO,
        appointment_type: appointmentType,
        reason: reason
      });

      const res = await fetchWithAuth('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctor_id: Number(doctor.id || doctor.doctorId || doctor.doctor_id),
          start_time: startISO,
          end_time: endISO,
          notes: reason,
          reason: reason,
          appointment_type: appointmentType,
        }),
      });

      console.log('Response status:', res.status);
      
      if (!res.ok) {
        let errorMessage = 'Booking failed';
        try {
          const err = await res.json();
          errorMessage = err.message || `HTTP ${res.status}: ${res.statusText}`;
          console.error('Booking error:', err);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const result = await res.json();
      console.log('Booking successful:', result);
      
      // Show confirmation page instead of alert
      setAppointmentResult(result);
      setShowConfirmation(true);
      
    } catch (err) {
      console.error('Booking error:', err);
      alert(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAppointments = () => {
    setShowConfirmation(false);
    onClose();
    // Navigate to appointments page
    window.location.href = '/#patient-appointments';
  };

  if (showConfirmation && appointmentResult) {
    return (
      <AppointmentConfirmation
        appointment={appointmentResult.appointment}
        doctor={doctor}
        onClose={() => {
          setShowConfirmation(false);
          onClose();
        }}
        onViewAppointments={handleViewAppointments}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Book Appointment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Doctor Info */}
          <div className="flex items-center space-x-3 mb-6 p-3 bg-gray-50 rounded-lg">
            <img
              src={doctor.avatar}
              alt={doctor.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
              <p className="text-sm text-gray-600 capitalize">{doctor.specialization}</p>
              {doctor.consultationFee && (
                <p className="text-sm text-green-600 font-medium">${doctor.consultationFee}</p>
              )}
            </div>
          </div>

          <form onSubmit={handleBooking} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Time
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a time</option>
                {availableSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appointment Type
              </label>
              <select
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="in-person">In-Person Visit</option>
                <option value="video">Video Consultation</option>
                <option value="phone">Phone Consultation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Visit
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe your symptoms or reason for the appointment..."
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;