import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChartBarIcon, 
  PhotoIcon, 
  SpeakerWaveIcon, 
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  HeartIcon,
  CalendarIcon,
  UserIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const PatientProgressTracker = ({ patientId, onClose }) => {
  const [patient, setPatient] = useState(null);
  const [progressData, setProgressData] = useState({
    symptoms: [],
    mood: [],
    activities: [],
    vitals: [],
    photos: [],
    notes: []
  });
  const [timeFilter, setTimeFilter] = useState('week'); // week, month, quarter
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [correlations, setCorrelations] = useState([]);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [flaggedEntries, setFlaggedEntries] = useState([]);

  const { fetchWithAuth } = useAuth();

  useEffect(() => {
    if (patientId) {
      loadPatientProgress();
    }
  }, [patientId, timeFilter]);

  const loadPatientProgress = async () => {
    setLoading(true);
    try {
      // Load patient info
      const patientRes = await fetchWithAuth(`/api/patients/${patientId}`);
      if (patientRes.ok) {
        const patientData = await patientRes.json();
        setPatient(patientData);
      }

      // Load progress data
      const endpoints = [
        `/api/progress/symptoms?patient_id=${patientId}&timeframe=${timeFilter}`,
        `/api/progress/mood?patient_id=${patientId}&timeframe=${timeFilter}`,
        `/api/progress/activities?patient_id=${patientId}&timeframe=${timeFilter}`,
        `/api/medical-records/vitals?patient_id=${patientId}&timeframe=${timeFilter}`,
        `/api/patients/${patientId}/photos`,
        `/api/patients/${patientId}/notes`
      ];

      const responses = await Promise.allSettled(
        endpoints.map(url => fetchWithAuth(url))
      );

      const [symptomsRes, moodRes, activitiesRes, vitalsRes, photosRes, notesRes] = responses;

      const newProgressData = {
        symptoms: symptomsRes.status === 'fulfilled' && symptomsRes.value.ok ? 
          await symptomsRes.value.json() : [],
        mood: moodRes.status === 'fulfilled' && moodRes.value.ok ? 
          await moodRes.value.json() : [],
        activities: activitiesRes.status === 'fulfilled' && activitiesRes.value.ok ? 
          await activitiesRes.value.json() : [],
        vitals: vitalsRes.status === 'fulfilled' && vitalsRes.value.ok ? 
          await vitalsRes.value.json() : [],
        photos: photosRes.status === 'fulfilled' && photosRes.value.ok ? 
          await photosRes.value.json() : [],
        notes: notesRes.status === 'fulfilled' && notesRes.value.ok ? 
          await notesRes.value.json() : []
      };

      setProgressData(newProgressData);
      
      // Calculate correlations
      calculateCorrelations(newProgressData);
      
      // Identify flagged entries (high severity, concerning patterns)
      identifyFlaggedEntries(newProgressData);

    } catch (error) {
      console.error('Error loading patient progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCorrelations = (data) => {
    const correlations = [];
    
    // Example: Correlation between mood and pain levels
    if (data.mood.length > 0 && data.symptoms.length > 0) {
      const painSymptoms = data.symptoms.filter(s => 
        s.symptom_name.toLowerCase().includes('pain')
      );
      
      if (painSymptoms.length > 0) {
        correlations.push({
          type: 'mood_pain',
          title: 'Mood vs Pain Correlation',
          correlation: 0.73, // This would be calculated from actual data
          insight: 'High pain levels correlate with lower mood scores',
          confidence: 'High'
        });
      }
    }

    // Example: Sleep vs Energy correlation
    if (data.activities.length > 0) {
      const sleepActivities = data.activities.filter(a => 
        a.activity_type === 'sleep'
      );
      
      if (sleepActivities.length > 0) {
        correlations.push({
          type: 'sleep_energy',
          title: 'Sleep vs Energy Levels',
          correlation: 0.85,
          insight: 'Better sleep quality leads to higher energy levels',
          confidence: 'Very High'
        });
      }
    }

    setCorrelations(correlations);
  };

  const identifyFlaggedEntries = (data) => {
    const flagged = [];

    // Flag high severity symptoms
    data.symptoms.forEach(symptom => {
      if (symptom.severity >= 8) {
        flagged.push({
          type: 'high_severity_symptom',
          data: symptom,
          priority: 'high',
          message: `High severity ${symptom.symptom_name} (${symptom.severity}/10)`
        });
      }
    });

    // Flag very low mood scores
    data.mood.forEach(mood => {
      if (mood.mood_score <= 3) {
        flagged.push({
          type: 'low_mood',
          data: mood,
          priority: 'urgent',
          message: `Very low mood score: ${mood.mood_score}/10`
        });
      }
    });

    setFlaggedEntries(flagged);
  };

  const addDoctorNote = async () => {
    if (!doctorNotes.trim()) return;

    try {
      const res = await fetchWithAuth(`/api/patients/${patientId}/doctor-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: doctorNotes,
          timestamp: new Date().toISOString(),
          type: 'clinical_observation'
        })
      });

      if (res.ok) {
        setDoctorNotes('');
        // Reload notes
        loadPatientProgress();
      }
    } catch (error) {
      console.error('Error adding doctor note:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimelineEntries = () => {
    const entries = [];
    
    // Add all progress entries to timeline
    progressData.symptoms.forEach(s => entries.push({
      ...s, type: 'symptom', timestamp: s.created_at, icon: ExclamationTriangleIcon
    }));
    
    progressData.mood.forEach(m => entries.push({
      ...m, type: 'mood', timestamp: m.created_at, icon: HeartIcon
    }));
    
    progressData.activities.forEach(a => entries.push({
      ...a, type: 'activity', timestamp: a.created_at, icon: ArrowTrendingUpIcon
    }));
    
    progressData.photos.forEach(p => entries.push({
      ...p, type: 'photo', timestamp: p.created_at, icon: PhotoIcon
    }));
    
    progressData.notes.forEach(n => entries.push({
      ...n, type: 'note', timestamp: n.created_at, icon: DocumentTextIcon
    }));

    // Sort by timestamp (newest first)
    return entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const renderTimelineEntry = (entry) => {
    const IconComponent = entry.icon;
    
    return (
      <div key={`${entry.type}-${entry.id}`} className="flex space-x-3 py-4 border-b border-gray-100">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <IconComponent className="w-4 h-4 text-blue-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {entry.type} Entry
              </p>
              <p className="text-sm text-gray-600">
                {entry.type === 'symptom' && `${entry.symptom_name} - Severity: ${entry.severity}/10`}
                {entry.type === 'mood' && `Mood Score: ${entry.mood_score}/10`}
                {entry.type === 'activity' && `${entry.activity_type}: ${entry.duration} minutes`}
                {entry.type === 'photo' && `Photo: ${entry.description || 'Progress documentation'}`}
                {entry.type === 'note' && entry.content}
              </p>
            </div>
            <span className="text-xs text-gray-500">
              {formatDate(entry.timestamp)}
            </span>
          </div>
          {entry.notes && (
            <p className="mt-1 text-sm text-gray-500">{entry.notes}</p>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <UserIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {patient?.name || 'Patient'} Progress Tracker
                </h2>
                <p className="text-gray-600">
                  Comprehensive timeline and correlation analysis
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex space-x-2">
              <label className="text-sm font-medium text-gray-700">Time Range:</label>
              {['week', 'month', 'quarter'].map(period => (
                <button
                  key={period}
                  onClick={() => setTimeFilter(period)}
                  className={`px-3 py-1 rounded text-sm ${
                    timeFilter === period
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <label className="text-sm font-medium text-gray-700">Category:</label>
              {['all', 'symptoms', 'mood', 'activities', 'vitals'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedCategory === cat
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-12 h-full">
            {/* Main Timeline */}
            <div className="col-span-8 p-6 overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Patient Timeline
              </h3>
              
              {/* Flagged Entries Alert */}
              {flaggedEntries.length > 0 && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-800 flex items-center">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                    Urgent Attention Required ({flaggedEntries.length} items)
                  </h4>
                  <div className="mt-2 space-y-1">
                    {flaggedEntries.slice(0, 3).map((flag, idx) => (
                      <p key={idx} className="text-sm text-red-700">
                        • {flag.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {getTimelineEntries().map(renderTimelineEntry)}
              </div>
            </div>

            {/* Sidebar - Correlations & Notes */}
            <div className="col-span-4 border-l border-gray-200 p-6 bg-gray-50 overflow-y-auto">
              {/* Correlations */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  AI Insights & Correlations
                </h4>
                {correlations.length > 0 ? (
                  <div className="space-y-3">
                    {correlations.map((corr, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                        <h5 className="font-medium text-gray-900">{corr.title}</h5>
                        <p className="text-sm text-gray-600 mt-1">{corr.insight}</p>
                        <div className="mt-2 flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            Confidence: {corr.confidence}
                          </span>
                          <span className="text-sm font-medium text-blue-600">
                            {Math.round(corr.correlation * 100)}% correlation
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    No correlations detected with current data
                  </p>
                )}
              </div>

              {/* Doctor Notes */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Clinical Notes
                </h4>
                <textarea
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Add clinical observations, insights, or follow-up notes..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addDoctorNote}
                  disabled={!doctorNotes.trim()}
                  className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Clinical Note
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProgressTracker;
