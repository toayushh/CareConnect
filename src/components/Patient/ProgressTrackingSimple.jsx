import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE = 'http://localhost:9000/api';

// Simple progress tracking component with proper error handling
const ProgressTracking = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [data, setData] = useState({
    symptoms: [],
    moods: [],
    activities: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(null);

  const { fetchWithAuth } = useAuth();

  // Fetch all progress data
  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      // Try to fetch data, but don't fail if endpoints return 422
      const endpoints = [
        { key: 'symptoms', url: '/progress/symptoms' },
        { key: 'moods', url: '/progress/mood' },
        { key: 'activities', url: '/progress/activities' }
      ];

      const results = {};
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetchWithAuth(`${API_BASE}${endpoint.url}`);
          
          if (response.ok) {
            results[endpoint.key] = await response.json();
          } else {
            console.warn(`${endpoint.key} endpoint returned ${response.status}`);
            results[endpoint.key] = [];
          }
        } catch (err) {
          console.warn(`Failed to fetch ${endpoint.key}:`, err);
          results[endpoint.key] = [];
        }
      }

      setData(results);
    } catch (err) {
      setError('Failed to load progress data');
      console.error('Progress data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Add new symptom
  const addSymptom = async (symptomData) => {
    try {
      const response = await fetchWithAuth(`${API_BASE}/progress/symptoms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(symptomData)
      });

      if (response.ok) {
        alert('✅ Symptom logged successfully!');
        fetchData(); // Refresh data
        setShowModal(null);
      } else {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to log symptom');
      }
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  };

  // Add new mood entry
  const addMood = async (moodData) => {
    try {
      const response = await fetchWithAuth(`${API_BASE}/progress/mood`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moodData)
      });

      if (response.ok) {
        alert('✅ Mood recorded successfully!');
        fetchData(); // Refresh data
        setShowModal(null);
      } else {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to record mood');
      }
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  };

  // Add new activity
  const addActivity = async (activityData) => {
    try {
      const response = await fetchWithAuth(`${API_BASE}/progress/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData)
      });

      if (response.ok) {
        alert('✅ Activity logged successfully!');
        fetchData(); // Refresh data
        setShowModal(null);
      } else {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to log activity');
      }
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  };

  // UI-level guard is not necessary; fetchWithAuth handles auth. Keep UI informative.
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500">Please log in to access progress tracking</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Progress Tracking</h1>
          <button
            onClick={fetchData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard title="Symptoms Logged" value={data.symptoms?.length || 0} />
          <StatCard title="Mood Entries" value={data.moods?.length || 0} />
          <StatCard title="Activities" value={data.activities?.length || 0} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading...</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Content Area */}
          <div className="lg:col-span-9">
            {/* Tabs */}
            <div className="flex space-x-2 bg-white rounded-lg p-1 shadow-sm border border-gray-100 mb-4">
              {['Overview', 'Symptoms', 'Mood', 'Activities'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-sm rounded-md transition ${
                    activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              {activeTab === 'Overview' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Your Health Overview</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-800">Recent Symptoms</h4>
                      <div className="mt-2 space-y-1">
                        {data.symptoms?.slice(0, 3).map((symptom, idx) => (
                          <div key={idx} className="text-sm text-gray-600">
                            {symptom.symptom_name} (Severity: {symptom.severity}/10)
                          </div>
                        )) || <div className="text-sm text-gray-500">No symptoms logged yet</div>}
                      </div>
                    </div>
                    
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-800">Recent Moods</h4>
                      <div className="mt-2 space-y-1">
                        {data.moods?.slice(0, 3).map((mood, idx) => (
                          <div key={idx} className="text-sm text-gray-600">
                            Mood: {mood.mood_score}/10
                          </div>
                        )) || <div className="text-sm text-gray-500">No mood entries yet</div>}
                      </div>
                    </div>
                    
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-800">Recent Activities</h4>
                      <div className="mt-2 space-y-1">
                        {data.activities?.slice(0, 3).map((activity, idx) => (
                          <div key={idx} className="text-sm text-gray-600">
                            {activity.activity_name} ({activity.duration} min)
                          </div>
                        )) || <div className="text-sm text-gray-500">No activities logged yet</div>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Symptoms' && (
                <SymptomsList symptoms={data.symptoms || []} />
              )}

              {activeTab === 'Mood' && (
                <MoodsList moods={data.moods || []} />
              )}

              {activeTab === 'Activities' && (
                <ActivitiesList activities={data.activities || []} />
              )}
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <h3 className="font-medium text-gray-800 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <QuickActionButton
                  icon="📝"
                  label="Log Symptom"
                  onClick={() => setShowModal('symptom')}
                />
                <QuickActionButton
                  icon="😊"
                  label="Record Mood"
                  onClick={() => setShowModal('mood')}
                />
                <QuickActionButton
                  icon="🏃"
                  label="Add Activity"
                  onClick={() => setShowModal('activity')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showModal === 'symptom' && (
        <SymptomModal
          onClose={() => setShowModal(null)}
          onSave={addSymptom}
        />
      )}
      
      {showModal === 'mood' && (
        <MoodModal
          onClose={() => setShowModal(null)}
          onSave={addMood}
        />
      )}
      
      {showModal === 'activity' && (
        <ActivityModal
          onClose={() => setShowModal(null)}
          onSave={addActivity}
        />
      )}
    </div>
  );
};

// Helper Components
const StatCard = ({ title, value }) => (
  <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
    <p className="text-xs text-gray-500">{title}</p>
    <p className="text-2xl font-semibold mt-1 text-blue-600">{value}</p>
  </div>
);

const QuickActionButton = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-100 rounded-md shadow-sm text-sm hover:bg-gray-50"
  >
    <span className="flex items-center space-x-2">
      <span>{icon}</span>
      <span>{label}</span>
    </span>
    <span className="text-blue-600">New</span>
  </button>
);

const SymptomsList = ({ symptoms }) => (
  <div>
    <h3 className="text-lg font-medium text-gray-900 mb-4">Symptoms Log</h3>
    {symptoms.length === 0 ? (
      <p className="text-gray-500">No symptoms logged yet. Click "Log Symptom" to start tracking.</p>
    ) : (
      <div className="space-y-3">
        {symptoms.slice(0, 10).map((symptom) => (
          <div key={symptom.id} className="p-3 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{symptom.symptom_name}</h4>
                <p className="text-sm text-gray-600">Severity: {symptom.severity}/10</p>
                {symptom.location && <p className="text-sm text-gray-600">Location: {symptom.location}</p>}
              </div>
              <span className="text-xs text-gray-500">
                {new Date(symptom.created_at).toLocaleDateString()}
              </span>
            </div>
            {symptom.notes && <p className="text-sm text-gray-600 mt-2">{symptom.notes}</p>}
          </div>
        ))}
      </div>
    )}
  </div>
);

const MoodsList = ({ moods }) => (
  <div>
    <h3 className="text-lg font-medium text-gray-900 mb-4">Mood Entries</h3>
    {moods.length === 0 ? (
      <p className="text-gray-500">No mood entries yet. Click "Record Mood" to start tracking.</p>
    ) : (
      <div className="space-y-3">
        {moods.slice(0, 10).map((mood) => (
          <div key={mood.id} className="p-3 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">Mood: {mood.mood_score}/10</h4>
                {mood.energy_level && <p className="text-sm text-gray-600">Energy: {mood.energy_level}/10</p>}
                {mood.stress_level && <p className="text-sm text-gray-600">Stress: {mood.stress_level}/10</p>}
              </div>
              <span className="text-xs text-gray-500">
                {new Date(mood.created_at).toLocaleDateString()}
              </span>
            </div>
            {mood.notes && <p className="text-sm text-gray-600 mt-2">{mood.notes}</p>}
          </div>
        ))}
      </div>
    )}
  </div>
);

const ActivitiesList = ({ activities }) => (
  <div>
    <h3 className="text-lg font-medium text-gray-900 mb-4">Activities Log</h3>
    {activities.length === 0 ? (
      <p className="text-gray-500">No activities logged yet. Click "Add Activity" to start tracking.</p>
    ) : (
      <div className="space-y-3">
        {activities.slice(0, 10).map((activity) => (
          <div key={activity.id} className="p-3 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{activity.activity_name}</h4>
                <p className="text-sm text-gray-600">Type: {activity.activity_type}</p>
                {activity.duration && <p className="text-sm text-gray-600">Duration: {activity.duration} min</p>}
              </div>
              <span className="text-xs text-gray-500">
                {new Date(activity.created_at).toLocaleDateString()}
              </span>
            </div>
            {activity.notes && <p className="text-sm text-gray-600 mt-2">{activity.notes}</p>}
          </div>
        ))}
      </div>
    )}
  </div>
);

// Modal Components
const SymptomModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    symptom_name: '',
    severity: 5,
    location: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal title="Log Symptom" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Symptom Name</label>
          <input
            type="text"
            value={formData.symptom_name}
            onChange={(e) => setFormData({...formData, symptom_name: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Severity: {formData.severity}</label>
          <input
            type="range"
            min="1"
            max="10"
            value={formData.severity}
            onChange={(e) => setFormData({...formData, severity: parseInt(e.target.value)})}
            className="mt-1 w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Location (optional)</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            rows="3"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">
            Save Symptom
          </button>
        </div>
      </form>
    </Modal>
  );
};

const MoodModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    mood_score: 5,
    energy_level: 5,
    stress_level: 5,
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal title="Record Mood" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Mood: {formData.mood_score}</label>
          <input
            type="range"
            min="1"
            max="10"
            value={formData.mood_score}
            onChange={(e) => setFormData({...formData, mood_score: parseInt(e.target.value)})}
            className="mt-1 w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Energy Level: {formData.energy_level}</label>
          <input
            type="range"
            min="1"
            max="10"
            value={formData.energy_level}
            onChange={(e) => setFormData({...formData, energy_level: parseInt(e.target.value)})}
            className="mt-1 w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Stress Level: {formData.stress_level}</label>
          <input
            type="range"
            min="1"
            max="10"
            value={formData.stress_level}
            onChange={(e) => setFormData({...formData, stress_level: parseInt(e.target.value)})}
            className="mt-1 w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            rows="3"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">
            Save Mood
          </button>
        </div>
      </form>
    </Modal>
  );
};

const ActivityModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    activity_type: 'exercise',
    activity_name: '',
    duration: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      duration: parseInt(formData.duration) || 0
    });
  };

  return (
    <Modal title="Add Activity" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Activity Type</label>
          <select
            value={formData.activity_type}
            onChange={(e) => setFormData({...formData, activity_type: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="exercise">Exercise</option>
            <option value="medication">Medication</option>
            <option value="therapy">Therapy</option>
            <option value="social">Social</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Activity Name</label>
          <input
            type="text"
            value={formData.activity_name}
            onChange={(e) => setFormData({...formData, activity_name: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
          <input
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({...formData, duration: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            min="0"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            rows="3"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">
            Save Activity
          </button>
        </div>
      </form>
    </Modal>
  );
};

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/30" onClick={onClose} />
    <div className="relative bg-white w-full max-w-md mx-auto rounded-lg shadow-lg p-6 m-4 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default ProgressTracking;
