import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
} from 'recharts';

const API_BASE = 'http://localhost:9000/api';

const formatDateLabel = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

// Custom hook for API calls with authentication
function useApi() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  
  const request = async (url, options = {}) => {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  };
  
  return { request };
}

// Data hooks
function useProgressData() {
  const [data, setData] = useState({
    symptoms: [],
    moods: [],
    activities: [],
    analytics: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { request } = useApi();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all progress data in parallel
        const [symptoms, moods, activities, analytics] = await Promise.all([
          request('/progress/symptoms?limit=50'),
          request('/progress/mood?limit=30'),
          request('/progress/activities?limit=50'),
          request('/progress/analytics').catch(() => null) // Analytics might fail if no data
        ]);

        setData({ symptoms, moods, activities, analytics });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading, error, refetch: () => fetchData() };
}

// Progress tracking component
const ProgressTracking = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [showModal, setShowModal] = useState(null);
  const { data, loading, error } = useProgressData();
  const { request } = useApi();

  const { symptoms, moods, activities, analytics } = data;

  // Create combined daily data for charts
  const dailyData = useMemo(() => {
    const dateMap = new Map();
    
    // Aggregate mood data by date
    moods.forEach(mood => {
      const date = mood.date_recorded;
      if (!dateMap.has(date)) {
        dateMap.set(date, { date });
      }
      dateMap.get(date).moodScore = mood.mood_score;
      dateMap.get(date).energyLevel = mood.energy_level;
      dateMap.get(date).stressLevel = mood.stress_level;
      dateMap.get(date).sleepQuality = mood.sleep_quality;
    });

    // Aggregate symptoms by date
    const symptomCounts = {};
    symptoms.forEach(symptom => {
      const date = symptom.created_at.split('T')[0];
      symptomCounts[date] = (symptomCounts[date] || 0) + 1;
    });

    Object.entries(symptomCounts).forEach(([date, count]) => {
      if (!dateMap.has(date)) {
        dateMap.set(date, { date });
      }
      dateMap.get(date).symptomsCount = count;
    });

    // Aggregate activities by date
    const activityDurations = {};
    activities.forEach(activity => {
      const date = activity.date_recorded;
      activityDurations[date] = (activityDurations[date] || 0) + (activity.duration || 0);
    });

    Object.entries(activityDurations).forEach(([date, duration]) => {
      if (!dateMap.has(date)) {
        dateMap.set(date, { date });
      }
      dateMap.get(date).activityMinutes = duration;
    });

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [symptoms, moods, activities]);

  // Modal handlers
  const handleAddSymptom = async (symptomData) => {
    try {
      await request('/progress/symptoms', {
        method: 'POST',
        body: JSON.stringify(symptomData)
      });
      setShowModal(null);
      // Refresh data
      window.location.reload();
    } catch (err) {
      alert('Failed to save symptom: ' + err.message);
    }
  };

  const handleAddMood = async (moodData) => {
    try {
      await request('/progress/mood', {
        method: 'POST',
        body: JSON.stringify(moodData)
      });
      setShowModal(null);
      window.location.reload();
    } catch (err) {
      alert('Failed to save mood: ' + err.message);
    }
  };

  const handleAddActivity = async (activityData) => {
    try {
      await request('/progress/activities', {
        method: 'POST',
        body: JSON.stringify(activityData)
      });
      setShowModal(null);
      window.location.reload();
    } catch (err) {
      alert('Failed to save activity: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading progress</h3>
          <p className="text-gray-500">{error}</p>
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
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Symptoms" value={symptoms.length} sub="Logged entries" />
          <StatCard title="Mood Entries" value={moods.length} sub="Daily check-ins" />
          <StatCard title="Activities" value={activities.length} sub="Recorded activities" />
          <StatCard title="Avg Mood" value={analytics?.average_mood_7_days || 'N/A'} sub="Last 7 days" />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Charts and Data */}
          <div className="lg:col-span-9">
            {/* Tabs */}
            <div className="flex space-x-2 bg-white rounded-lg p-1 shadow-sm border border-gray-100 mb-4">
              {['Overview', 'Symptoms', 'Mood', 'Activities', 'Insights'].map((tab) => (
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
                <OverviewTab data={dailyData} analytics={analytics} />
              )}
              
              {activeTab === 'Symptoms' && (
                <SymptomsTab symptoms={symptoms} dailyData={dailyData} />
              )}
              
              {activeTab === 'Mood' && (
                <MoodTab moods={moods} dailyData={dailyData} />
              )}
              
              {activeTab === 'Activities' && (
                <ActivitiesTab activities={activities} dailyData={dailyData} />
              )}
              
              {activeTab === 'Insights' && (
                <InsightsTab analytics={analytics} />
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
          onSave={handleAddSymptom}
        />
      )}
      
      {showModal === 'mood' && (
        <MoodModal
          onClose={() => setShowModal(null)}
          onSave={handleAddMood}
        />
      )}
      
      {showModal === 'activity' && (
        <ActivityModal
          onClose={() => setShowModal(null)}
          onSave={handleAddActivity}
        />
      )}
    </div>
  );
};

// Components
const StatCard = ({ title, value, sub, color = 'text-blue-600' }) => (
  <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
    <p className="text-xs text-gray-500">{title}</p>
    <p className={`text-2xl font-semibold mt-1 ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
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

const OverviewTab = ({ data, analytics }) => (
  <div className="space-y-6">
    <div>
      <h3 className="font-medium text-gray-800 mb-4">Combined Progress</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tickFormatter={formatDateLabel} stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip labelFormatter={formatDateLabel} />
            <Area dataKey="moodScore" name="Mood (×10)" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            <Area dataKey="energyLevel" name="Energy" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
    
    {analytics && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-800">Insights</h4>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            {analytics.insights?.map((insight, idx) => (
              <li key={idx}>• {insight}</li>
            ))}
          </ul>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-800">Symptom Frequency</h4>
          <div className="mt-2 space-y-1 text-sm">
            {Object.entries(analytics.symptom_frequency || {}).map(([symptom, count]) => (
              <div key={symptom} className="flex justify-between">
                <span>{symptom}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
);

const SymptomsTab = ({ symptoms, dailyData }) => (
  <div className="space-y-6">
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dailyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tickFormatter={formatDateLabel} stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip labelFormatter={formatDateLabel} />
          <Bar dataKey="symptomsCount" name="Symptoms" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
    
    <div>
      <h3 className="font-medium text-gray-800 mb-3">Recent Symptoms</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {symptoms.slice(0, 10).map((symptom) => (
          <div key={symptom.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium">{symptom.symptom_name}</p>
              <p className="text-sm text-gray-600">{formatDateLabel(symptom.created_at)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Severity: {symptom.severity}/10</p>
              {symptom.location && <p className="text-xs text-gray-500">{symptom.location}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const MoodTab = ({ moods, dailyData }) => (
  <div className="space-y-6">
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dailyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tickFormatter={formatDateLabel} stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" domain={[1, 10]} />
          <Tooltip labelFormatter={formatDateLabel} />
          <Line dataKey="moodScore" name="Mood" stroke="#6366f1" dot={false} />
          <Line dataKey="energyLevel" name="Energy" stroke="#10b981" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
    
    <div>
      <h3 className="font-medium text-gray-800 mb-3">Recent Mood Entries</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {moods.slice(0, 10).map((mood) => (
          <div key={mood.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium">Mood: {mood.mood_score}/10</p>
              <p className="text-sm text-gray-600">{formatDateLabel(mood.date_recorded)}</p>
            </div>
            <div className="text-right">
              {mood.energy_level && <p className="text-sm">Energy: {mood.energy_level}/10</p>}
              {mood.stress_level && <p className="text-sm">Stress: {mood.stress_level}/10</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ActivitiesTab = ({ activities, dailyData }) => (
  <div className="space-y-6">
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dailyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tickFormatter={formatDateLabel} stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip labelFormatter={formatDateLabel} />
          <Area dataKey="activityMinutes" name="Minutes" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    
    <div>
      <h3 className="font-medium text-gray-800 mb-3">Recent Activities</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {activities.slice(0, 10).map((activity) => (
          <div key={activity.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium">{activity.activity_name}</p>
              <p className="text-sm text-gray-600">{activity.activity_type}</p>
            </div>
            <div className="text-right">
              {activity.duration && <p className="text-sm">{activity.duration} min</p>}
              {activity.intensity && <p className="text-xs text-gray-500">Intensity: {activity.intensity}/10</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const InsightsTab = ({ analytics }) => (
  <div className="space-y-4">
    <h3 className="font-medium text-gray-800">Your Health Insights</h3>
    {analytics ? (
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900">Mood Trends</h4>
          <p className="text-blue-800 mt-1">
            Your average mood over the last 7 days was {analytics.average_mood_7_days}/10
          </p>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-900">Activity Summary</h4>
          <p className="text-green-800 mt-1">
            You logged {analytics.total_symptoms_30_days} symptoms in the last 30 days
          </p>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-gray-800">Personalized Insights</h4>
          {analytics.insights?.map((insight, idx) => (
            <p key={idx} className="text-gray-600">• {insight}</p>
          ))}
        </div>
      </div>
    ) : (
      <p className="text-gray-500">Start logging your symptoms and mood to see personalized insights!</p>
    )}
  </div>
);

// Modal Components
const SymptomModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    symptom_name: '',
    severity: 5,
    location: '',
    duration: '',
    triggers: '',
    notes: '',
    tags: []
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
            placeholder="e.g., head, stomach, back"
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
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-md">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md">
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
    sleep_quality: 5,
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
          <label className="block text-sm font-medium text-gray-700">Sleep Quality: {formData.sleep_quality}</label>
          <input
            type="range"
            min="1"
            max="10"
            value={formData.sleep_quality}
            onChange={(e) => setFormData({...formData, sleep_quality: parseInt(e.target.value)})}
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
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-md">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md">
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
    intensity: 5,
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
            <option value="sleep">Sleep</option>
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
            placeholder="e.g., Morning walk, Yoga session"
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
          <label className="block text-sm font-medium text-gray-700">Intensity: {formData.intensity}</label>
          <input
            type="range"
            min="1"
            max="10"
            value={formData.intensity}
            onChange={(e) => setFormData({...formData, intensity: parseInt(e.target.value)})}
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
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-md">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md">
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
