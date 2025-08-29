import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const DoctorProfile = () => {
  const { user, fetchWithAuth } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    specialization: 'general',
    licenseNumber: '',
    experience: '',
    education: '',
    hospital: '',
    consultationFee: 0,
    languages: [],
    about: '',
    certifications: [],
    awards: []
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        // Basic user fields
        const meRes = await fetchWithAuth('/api/users/me');
        if (!meRes.ok) throw new Error('Failed to load user');
        const me = await meRes.json();
        // Doctor details
        const dRes = await fetchWithAuth('/api/doctors/me');
        const doctor = dRes.ok ? await dRes.json() : {};
        setProfile(prev => ({
          ...prev,
          name: me.full_name || prev.name,
          email: me.email || prev.email,
          specialization: doctor.specialty || prev.specialization,
          hospital: doctor.hospital || '',
          consultationFee: doctor.consultation_fee || 0,
          languages: doctor.languages ? String(doctor.languages).split(',').map(s => s.trim()).filter(Boolean) : [],
          about: doctor.bio || '',
        }));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchWithAuth]);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      // Send updates to backend (update doctor resource)
      // We need the doctor id; fetch from /users/me
      const meRes = await fetchWithAuth('/api/users/me');
      if (!meRes.ok) throw new Error('Failed to resolve profile');
      const me = await meRes.json();
      const doctorId = me?.doctor_profile?.id;
      if (!doctorId) throw new Error('Doctor profile not found');
      const payload = {
        specialty: profile.specialization,
        hospital: profile.hospital,
        languages: profile.languages.join(', '),
        bio: profile.about,
        consultation_fee: profile.consultationFee,
        availability: 'available',
      };
      // Update via dedicated endpoint
      const res = await fetchWithAuth('/api/doctors/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save profile');
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, index, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setProfile(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setProfile(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Profile</h1>
          <p className="text-gray-600">Manage your professional information and settings</p>
        </div>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Picture and Quick Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=3b82f6&color=fff`}
              alt={profile.name}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
            />
            <h2 className="text-xl font-semibold text-gray-900">{profile.name}</h2>
            <p className="text-gray-600 capitalize">{profile.specialization}</p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Experience:</span>
                  <span className="font-medium">{profile.experience}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">License:</span>
                  <span className="font-medium">{profile.licenseNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rating:</span>
                  <span className="font-medium flex items-center">
                    4.8 <span className="text-yellow-400 ml-1">⭐</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="py-2 text-gray-900">{profile.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="py-2 text-gray-900">{profile.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="py-2 text-gray-900">{profile.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization
                </label>
                {isEditing ? (
                  <select
                    value={profile.specialization}
                    onChange={(e) => handleChange('specialization', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cardiology">Cardiology</option>
                    <option value="dermatology">Dermatology</option>
                    <option value="neurology">Neurology</option>
                    <option value="orthopedics">Orthopedics</option>
                    <option value="pediatrics">Pediatrics</option>
                    <option value="psychiatry">Psychiatry</option>
                    <option value="general">General Practice</option>
                  </select>
                ) : (
                  <p className="py-2 text-gray-900 capitalize">{profile.specialization}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.licenseNumber}
                    onChange={(e) => handleChange('licenseNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="py-2 text-gray-900">{profile.licenseNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.experience}
                    onChange={(e) => handleChange('experience', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="py-2 text-gray-900">{profile.experience}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Education
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.education}
                    onChange={(e) => handleChange('education', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="py-2 text-gray-900">{profile.education}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital/Clinic
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.hospital}
                    onChange={(e) => handleChange('hospital', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="py-2 text-gray-900">{profile.hospital}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consultation Fee ($)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={profile.consultationFee}
                    onChange={(e) => handleChange('consultationFee', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="py-2 text-gray-900">${profile.consultationFee}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  About Me
                </label>
                {isEditing ? (
                  <textarea
                    value={profile.about}
                    onChange={(e) => handleChange('about', e.target.value)}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="py-2 text-gray-900">{profile.about}</p>
                )}
              </div>
            </div>
          </div>

          {/* Languages */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Languages</h3>
            {isEditing ? (
              <div className="space-y-2">
                {profile.languages.map((language, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={language}
                      onChange={(e) => handleArrayChange('languages', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeArrayItem('languages', index)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem('languages')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  + Add Language
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((language, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {language}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;