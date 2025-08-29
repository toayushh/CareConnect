import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  BoltIcon,
  CalendarIcon,
  UserIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  SparklesIcon,
  TrophyIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const AdvancedPatientProgress = () => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [progressData, setProgressData] = useState({
    symptoms: [],
    mood: [],
    activities: [],
    vitals: [],
    correlations: [],
    summary: null
  });
  const [timeFilter, setTimeFilter] = useState('week');
  const [viewMode, setViewMode] = useState('overview'); // overview, details, insights, alerts
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const { fetchWithAuth } = useAuth();

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      loadPatientProgress();
    }
  }, [selectedPatient, timeFilter]);

  const loadPatients = async () => {
    try {
      const res = await fetchWithAuth('/api/doctors/patients');
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
        if (data.length > 0) {
          setSelectedPatient(data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadPatientProgress = async () => {
    if (!selectedPatient) return;
    
    setLoading(true);
    try {
      const endpoints = [
        `/api/patient-progress/symptoms?patient_id=${selectedPatient.id}&timeframe=${timeFilter}`,
        `/api/patient-progress/mood?patient_id=${selectedPatient.id}&timeframe=${timeFilter}`,
        `/api/patient-progress/activities?patient_id=${selectedPatient.id}&timeframe=${timeFilter}`,
        `/api/patient-progress/vitals?patient_id=${selectedPatient.id}&timeframe=${timeFilter}`,
        `/api/patient-progress/correlations?patient_id=${selectedPatient.id}`,
        `/api/patient-progress/summary?patient_id=${selectedPatient.id}&timeframe=${timeFilter}`
      ];

      const responses = await Promise.all(
        endpoints.map(url => fetchWithAuth(url).catch(() => ({ ok: false })))
      );

      const [symptomsRes, moodRes, activitiesRes, vitalsRes, correlationsRes, summaryRes] = responses;

      const newProgressData = {
        symptoms: symptomsRes.ok ? await symptomsRes.json() : [],
        mood: moodRes.ok ? await moodRes.json() : [],
        activities: activitiesRes.ok ? await activitiesRes.json() : [],
        vitals: vitalsRes.ok ? await vitalsRes.json() : [],
        correlations: correlationsRes.ok ? await correlationsRes.json() : [],
        summary: summaryRes.ok ? await summaryRes.json() : null
      };

      setProgressData(newProgressData);
    } catch (error) {
      console.error('Error loading patient progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    const chartData = [];
    const dates = new Set();

    // Collect all dates
    [...progressData.symptoms, ...progressData.mood, ...progressData.activities].forEach(item => {
      if (item.created_at) {
        dates.add(new Date(item.created_at).toISOString().split('T')[0]);
      }
    });

    // Sort dates
    const sortedDates = Array.from(dates).sort().slice(-14); // Last 14 days

    sortedDates.forEach(date => {
      const dayData = { date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };

      // Average pain for the day
      const daySymptoms = progressData.symptoms.filter(s => 
        new Date(s.created_at).toISOString().split('T')[0] === date
      );
      dayData.avgPain = daySymptoms.length > 0 
        ? daySymptoms.reduce((sum, s) => sum + s.severity, 0) / daySymptoms.length 
        : null;

      // Average mood for the day
      const dayMood = progressData.mood.filter(m => 
        new Date(m.created_at).toISOString().split('T')[0] === date
      );
      dayData.avgMood = dayMood.length > 0 
        ? dayMood.reduce((sum, m) => sum + m.mood_score, 0) / dayMood.length 
        : null;

      // Total activity minutes
      const dayActivities = progressData.activities.filter(a => 
        new Date(a.created_at).toISOString().split('T')[0] === date
      );
      dayData.totalActivity = dayActivities.reduce((sum, a) => sum + (a.duration || 0), 0);

      chartData.push(dayData);
    });

    return chartData;
  };

  const getActivityDistribution = () => {
    const activityTypes = {};
    progressData.activities.forEach(activity => {
      activityTypes[activity.activity_type] = (activityTypes[activity.activity_type] || 0) + 1;
    });

    return Object.entries(activityTypes).map(([name, value]) => ({ name, value }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.condition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const chartData = prepareChartData();
  const activityData = getActivityDistribution();

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-white min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">🏥</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-blue-900 mb-2">Loading Patient Progress</h3>
                <p className="text-blue-600">Analyzing patient data and generating insights...</p>
                <div className="mt-4 flex justify-center">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Patient Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <SparklesIcon className="w-8 h-8 text-blue-600 mr-3" />
              AI-Powered Patient Progress
            </h1>
            <p className="text-gray-600 mt-1">Real-time insights and correlation analysis</p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Patient Search & Select */}
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={selectedPatient?.id || ''}
              onChange={(e) => {
                const patient = patients.find(p => p.id === parseInt(e.target.value));
                setSelectedPatient(patient);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {filteredPatients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} - {patient.condition}
                </option>
              ))}
            </select>

            {/* Time Filter */}
            <div className="flex space-x-1">
              {['week', 'month', 'quarter'].map(period => (
                <button
                  key={period}
                  onClick={() => setTimeFilter(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeFilter === period
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedPatient && (
        <>
          {/* Patient Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Patient Info Card */}
            <div className={`bg-white rounded-xl p-6 border-l-4 ${getPriorityColor(selectedPatient.priority)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedPatient.name}</h3>
                  <p className="text-gray-600">{selectedPatient.condition}</p>
                  <p className="text-sm text-gray-500 mt-1">Age: {selectedPatient.age}</p>
                </div>
                <UserIcon className="w-12 h-12 text-blue-600" />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  selectedPatient.status === 'active' ? 'bg-green-100 text-green-800' :
                  selectedPatient.status === 'needs_attention' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedPatient.status.replace('_', ' ')}
                </span>
                <span className="text-sm text-gray-500">
                  {selectedPatient.priority} priority
                </span>
              </div>
            </div>

            {/* Summary Cards */}
            {progressData.summary && (
              <>
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Average Pain Level</h4>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {progressData.summary.key_metrics.avg_pain_level}/10
                      </p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <ArrowTrendingDownIcon className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">12% improvement</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Average Mood</h4>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {progressData.summary.key_metrics.avg_mood_score}/10
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <HeartIcon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">8% improvement</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Activity Goals</h4>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {progressData.summary.key_metrics.total_activities}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <BoltIcon className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-sm text-gray-600">
                      {Math.round(progressData.summary.key_metrics.medication_adherence * 100)}% adherence
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* View Mode Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {[
                  { id: 'overview', label: 'Overview', icon: ChartBarIcon },
                  { id: 'insights', label: 'AI Insights', icon: SparklesIcon },
                  { id: 'alerts', label: 'Alerts', icon: ExclamationTriangleIcon },
                  { id: 'achievements', label: 'Achievements', icon: TrophyIcon }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setViewMode(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      viewMode === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {viewMode === 'overview' && (
                <div className="space-y-8">
                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Pain & Mood Trends */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Pain & Mood Trends</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 10]} />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="avgPain" 
                            stroke="#EF4444" 
                            strokeWidth={3}
                            name="Avg Pain"
                            connectNulls={false}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="avgMood" 
                            stroke="#3B82F6" 
                            strokeWidth={3}
                            name="Avg Mood"
                            connectNulls={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Activity Distribution */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Distribution</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={activityData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {activityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Daily Activity Chart */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity Minutes</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="totalActivity" 
                          stroke="#10B981" 
                          fill="#10B981" 
                          fillOpacity={0.3}
                          name="Activity Minutes"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {viewMode === 'insights' && progressData.correlations && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <LightBulbIcon className="w-6 h-6 text-yellow-500 mr-2" />
                    AI-Powered Insights
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {progressData.correlations.map((correlation, index) => (
                      <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-lg font-semibold text-gray-900">{correlation.title}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            correlation.confidence === 'Very High' ? 'bg-green-100 text-green-800' :
                            correlation.confidence === 'High' ? 'bg-blue-100 text-blue-800' :
                            correlation.confidence === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {correlation.confidence} Confidence
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{correlation.insight}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${Math.abs(correlation.correlation) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {(correlation.correlation * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                          <p className="text-sm text-gray-700">
                            <strong>Recommendation:</strong> {correlation.recommendation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewMode === 'alerts' && progressData.summary?.alerts && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mr-2" />
                    Active Alerts
                  </h3>
                  
                  <div className="space-y-4">
                    {progressData.summary.alerts.map((alert, index) => (
                      <div key={index} className={`rounded-xl p-6 border ${getAlertColor(alert.severity)}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">{alert.type.replace('_', ' ').toUpperCase()}</h4>
                            <p className="text-gray-700">{alert.message}</p>
                            <p className="text-sm text-gray-600 mt-2">
                              {new Date(alert.timestamp).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                            alert.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {alert.severity.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewMode === 'achievements' && progressData.summary?.achievements && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <TrophyIcon className="w-6 h-6 text-yellow-500 mr-2" />
                    Patient Achievements
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {progressData.summary.achievements.map((achievement, index) => (
                      <div key={index} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                        <div className="flex items-center">
                          <div className="text-4xl mr-4">{achievement.icon}</div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {achievement.type.replace('_', ' ').toUpperCase()}
                            </h4>
                            <p className="text-gray-700">{achievement.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {progressData.summary.recommendations && (
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                        <LightBulbIcon className="w-5 h-5 mr-2" />
                        Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {progressData.summary.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <span className="text-blue-800">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdvancedPatientProgress;
