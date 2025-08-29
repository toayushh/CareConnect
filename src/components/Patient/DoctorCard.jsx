import React, { useState } from 'react';
import BookingModal from './BookingModal';

const DoctorCard = ({ doctor }) => {
  const [showBookingModal, setShowBookingModal] = useState(false);

  const handleBookAppointment = () => {
    setShowBookingModal(true);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-4">
          <img
            src={doctor.avatar}
            alt={doctor.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {doctor.name}
            </h3>
            <p className="text-sm text-gray-600 capitalize">
              {doctor.specialization}
            </p>
            <div className="flex items-center mt-1">
              <div className="flex items-center">
                <span className="text-yellow-400">⭐</span>
                <span className="ml-1 text-sm text-gray-600">
                  {doctor.rating} ({doctor.reviews} reviews)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">🏥</span>
            {doctor.hospital}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">💰</span>
            ${doctor.consultationFee} consultation fee
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">🕒</span>
            Next available: {doctor.nextAvailable}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">🗣️</span>
            Languages: {doctor.languages.join(', ')}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex space-x-2">
            <button
              onClick={handleBookAppointment}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            >
              Book Appointment
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm font-medium">
              View Profile
            </button>
          </div>
        </div>
      </div>

      {showBookingModal && (
        <BookingModal
          doctor={doctor}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </>
  );
};

export default DoctorCard;