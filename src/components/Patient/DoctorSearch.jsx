import React, { useState, useEffect } from 'react';
import DoctorCard from './DoctorCard';

const DoctorSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [availability, setAvailability] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  const specializations = [
    'cardiology', 'dermatology', 'neurology', 'orthopedics', 
    'pediatrics', 'psychiatry', 'general'
  ];

  const fetchDoctors = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (specialization) params.set('specialty', specialization);
    if (availability) params.set('availability', availability);
    const url = `/api/doctors${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    const data = res.ok ? await res.json() : [];
    const mapped = data.map((d) => ({
      id: d.id,
      name: d.name || 'Doctor',
      specialization: d.specialty,
      hospital: d.hospital,
      consultationFee: d.consultation_fee,
      languages: (d.languages || '').split(',').map(s => s.trim()).filter(Boolean),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(d.name || 'Doctor')}&background=3b82f6&color=fff`,
      availability: d.availability,
      rating: d.rating,
      nextAvailable: d.availability === 'today' ? 'Today' : d.availability === 'this-week' ? 'This Week' : 'Next Week'
    }));
    setFilteredDoctors(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchDoctors();
  }, [specialization, availability]);

  // search by name locally on the list fetched above
  const visibleDoctors = filteredDoctors.filter(doctor => 
    searchTerm ? (
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : true
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Doctor</h1>
        <p className="text-gray-600">Search and book appointments with qualified healthcare professionals</p>
      </div>

      {/* Search Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by name or condition
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g., Dr. Smith or heart condition"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specialization
            </label>
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Specializations</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>
                  {spec.charAt(0).toUpperCase() + spec.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Availability
            </label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any Time</option>
              <option value="today">Available Today</option>
              <option value="this-week">Available This Week</option>
              <option value="next-week">Available Next Week</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleDoctors.map(doctor => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      )}

      {(!loading && visibleDoctors.length === 0) && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🏥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
          <p className="text-gray-500">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
};

export default DoctorSearch;