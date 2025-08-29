import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const API_BASE = 'http://localhost:9000/api';

const AIPredictions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [predictions, setPredictions] = useState(null);
  const [healthData, setHealthData] = useState({
    age: 45,
    bmi: 26.5,
    systolic_bp: 135,
    diastolic_bp: 85,
    glucose: 110,
    cholesterol: 220,
    fatigue: 4,
    chest_pain: 2,
    shortness_breath: 3,
    headache: 2,
    exercise_hours: 3,
    smoking: 0,
    alcohol_units: 2
  });
  const [showHealthForm, setShowHealthForm] = useState(false);
  const [predictionHistory, setPredictionHistory] = useState([]);

  const { fetchWithAuth, user } = useAuth();

  // Fetch AI predictions
  const fetchPredictions = async () => {
    setLoading(true);
    setError('');

    try {
      // Get patient profile to get patient ID
      const profileResponse = await fetchWithAuth(`${API_BASE}/users/me`);
      if (!profileResponse.ok) {
        throw new Error('Failed to fetch user profile');
      }
      const profile = await profileResponse.json();
      const patientId = profile.patient_profile?.id;

      if (!patientId) {
        setError('Patient profile not found');
        return;
      }

      // Fetch predictions from treatment plans API
      const predictionsResponse = await fetchWithAuth(`${API_BASE}/treatment-plans/predictions/${patientId}`);
      if (predictionsResponse.ok) {
        const predictionsData = await predictionsResponse.json();
        setPredictions(predictionsData);
        
        if (predictionsData.historical_predictions) {
          setPredictionHistory(predictionsData.historical_predictions);
        }
      }

    } catch (err) {
      console.error('Error fetching predictions:', err);
      setError('Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  // Generate new AI predictions
  const generatePredictions = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetchWithAuth(`${API_BASE}/ai/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(healthData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Create a new prediction entry
        const newPrediction = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          health_score: result.health_score,
          primary_treatment: result.primary_treatment,
          confidence: result.confidence,
          risk_level: result.risk_level,
          recommendations: result.recommendations,
          metadata: result.metadata
        };

        setPredictionHistory(prev => [newPrediction, ...prev]);
        setPredictions(prev => ({
          ...prev,
          current_predictions: {
            health_score: result.health_score,
            risk_level: result.risk_level,
            treatment_recommendation: result.primary_treatment
          }
        }));

        setShowHealthForm(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate predictions');
      }
    } catch (err) {
      console.error('Error generating predictions:', err);
      setError('Failed to generate predictions');
    } finally {
      setLoading(false);
    }
  };

  // Update health data
  const updateHealthData = (field, value) => {
    setHealthData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const renderHealthDataForm = () => {
    if (!showHealthForm) return null;

    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Health Data for AI Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="number"
              value={healthData.age}
              onChange={(e) => updateHealthData('age', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="18"
              max="120"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">BMI</label>
            <input
              type="number"
              step="0.1"
              value={healthData.bmi}
              onChange={(e) => updateHealthData('bmi', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="15"
              max="50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Systolic BP</label>
            <input
              type="number"
              value={healthData.systolic_bp}
              onChange={(e) => updateHealthData('systolic_bp', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="80"
              max="200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diastolic BP</label>
            <input
              type="number"
              value={healthData.diastolic_bp}
              onChange={(e) => updateHealthData('diastolic_bp', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="50"
              max="130"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Glucose (mg/dL)</label>
            <input
              type="number"
              value={healthData.glucose}
              onChange={(e) => updateHealthData('glucose', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="70"
              max="400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cholesterol (mg/dL)</label>
            <input
              type="number"
              value={healthData.cholesterol}
              onChange={(e) => updateHealthData('cholesterol', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="100"
              max="500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fatigue (0-10)</label>
            <input
              type="number"
              value={healthData.fatigue}
              onChange={(e) => updateHealthData('fatigue', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="10"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chest Pain (0-10)</label>
            <input
              type="number"
              value={healthData.chest_pain}
              onChange={(e) => updateHealthData('chest_pain', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="10"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Hours/Day</label>
            <input
              type="number"
              step="0.5"
              value={healthData.exercise_hours}
              onChange={(e) => updateHealthData('exercise_hours', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="24"
            />
          </div>
        </div>
        
        <div className="flex space-x-3 mt-6">
          <button
            onClick={generatePredictions}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate AI Predictions'}
          </button>
          <button
            onClick={() => setShowHealthForm(false)}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const renderCurrentPredictions = () => {
    if (!predictions?.current_predictions) {
      return (
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">🔮</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Current Predictions</h3>
          <p className="text-gray-600 mb-4">Generate new AI predictions based on your current health data.</p>
          <button 
            onClick={() => setShowHealthForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Generate Predictions
          </button>
        </div>
      );
    }

    const current = predictions.current_predictions;
    
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Current AI Predictions</h3>
          <button 
            onClick={() => setShowHealthForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Update Data
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">{current.health_score || 'N/A'}/100</div>
            <div className="text-sm text-green-700">Health Score</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-lg font-medium text-blue-600 mb-1 capitalize">{current.risk_level || 'N/A'}</div>
            <div className="text-sm text-blue-700">Risk Level</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-lg font-medium text-purple-600 mb-1">{current.treatment_recommendation || 'N/A'}</div>
            <div className="text-sm text-purple-700">Treatment Recommendation</div>
          </div>
        </div>
      </div>
    );
  };

  const renderPredictionHistory = () => {
    if (predictionHistory.length === 0) return null;

    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Prediction History</h3>
        <div className="space-y-4">
          {predictionHistory.slice(0, 5).map((prediction) => (
            <div key={prediction.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">
                  {new Date(prediction.timestamp).toLocaleDateString()}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  prediction.risk_level === 'Low' ? 'bg-green-100 text-green-800' :
                  prediction.risk_level === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {prediction.risk_level}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div>
                  <span className="text-sm text-gray-600">Health Score:</span>
                  <span className="ml-2 font-medium">{prediction.health_score}/100</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Confidence:</span>
                  <span className="ml-2 font-medium">{(prediction.confidence * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Treatment:</span>
                  <span className="ml-2 font-medium text-sm">{prediction.primary_treatment}</span>
                </div>
              </div>
              
              {prediction.recommendations && prediction.recommendations.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Recommendations:</h5>
                  <div className="flex flex-wrap gap-2">
                    {prediction.recommendations.slice(0, 3).map((rec, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {rec.treatment}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMLModelInfo = () => {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Model Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Model Performance</h4>
            <div className="text-2xl font-bold text-blue-600 mb-1">85%</div>
            <div className="text-sm text-blue-700">Accuracy Rate</div>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900 mb-2">Features Analyzed</h4>
            <div className="text-2xl font-bold text-green-600 mb-1">13</div>
            <div className="text-sm text-green-700">Health Parameters</div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Features Used:</h4>
          <div className="flex flex-wrap gap-2">
            {Object.keys(healthData).map((feature) => (
              <span key={feature} className="px-2 py-1 bg-white text-gray-700 text-xs rounded border">
                {feature.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading && !showHealthForm) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading AI predictions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Health Predictions</h1>
            <p className="text-gray-600 mt-1">Machine learning-powered health forecasting and recommendations</p>
          </div>
          
          <button
            onClick={fetchPredictions}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Health Data Form */}
      {renderHealthDataForm()}

      {/* Current Predictions */}
      {renderCurrentPredictions()}

      {/* Prediction History */}
      {renderPredictionHistory()}

      {/* ML Model Info */}
      {renderMLModelInfo()}
    </div>
  );
};

export default AIPredictions;
