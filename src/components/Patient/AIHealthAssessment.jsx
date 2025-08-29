import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AIHealthAssessment = () => {
  const { fetchWithAuth } = useAuth();
  const [healthData, setHealthData] = useState({
    age: 30,
    bmi: 24,
    systolic_bp: 120,
    diastolic_bp: 80,
    glucose: 90,
    cholesterol: 180,
    fatigue: 3,
    chest_pain: 0,
    shortness_breath: 1,
    headache: 2,
    exercise_hours: 3,
    smoking: 0,
    alcohol_units: 2
  });
  
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('assessment');

  const handleInputChange = (field, value) => {
    setHealthData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const getRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth('/api/ai/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(healthData)
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data);
        setActiveTab('results');
      } else {
        throw new Error('Failed to get recommendations');
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      alert('Failed to get AI recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Health Assessment</h1>
        <p className="text-gray-600">Get personalized health recommendations powered by machine learning</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('assessment')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'assessment'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Health Assessment
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'results'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            disabled={!recommendations}
          >
            AI Recommendations
          </button>
        </nav>
      </div>

      {activeTab === 'assessment' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Demographics & Vitals */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Demographics & Vitals</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={healthData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
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
                    onChange={(e) => handleInputChange('bmi', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="15"
                    max="50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={healthData.systolic_bp}
                    onChange={(e) => handleInputChange('systolic_bp', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="80"
                    max="250"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={healthData.diastolic_bp}
                    onChange={(e) => handleInputChange('diastolic_bp', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="40"
                    max="150"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Glucose (mg/dL)</label>
                  <input
                    type="number"
                    value={healthData.glucose}
                    onChange={(e) => handleInputChange('glucose', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="50"
                    max="400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cholesterol (mg/dL)</label>
                  <input
                    type="number"
                    value={healthData.cholesterol}
                    onChange={(e) => handleInputChange('cholesterol', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="100"
                    max="400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Symptoms */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Symptoms (0-10 scale)</h3>
            <div className="space-y-4">
              {[
                { key: 'fatigue', label: 'Fatigue' },
                { key: 'chest_pain', label: 'Chest Pain' },
                { key: 'shortness_breath', label: 'Shortness of Breath' },
                { key: 'headache', label: 'Headache' }
              ].map(symptom => (
                <div key={symptom.key}>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">{symptom.label}</label>
                    <span className="text-sm text-gray-500">{healthData[symptom.key]}/10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={healthData[symptom.key]}
                    onChange={(e) => handleInputChange(symptom.key, e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Lifestyle Factors */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lifestyle Factors</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exercise (hours/week)</label>
                <input
                  type="number"
                  step="0.5"
                  value={healthData.exercise_hours}
                  onChange={(e) => handleInputChange('exercise_hours', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Smoking</label>
                <select
                  value={healthData.smoking}
                  onChange={(e) => handleInputChange('smoking', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="0">Non-smoker</option>
                  <option value="1">Smoker</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alcohol (units/week)</label>
                <input
                  type="number"
                  step="0.5"
                  value={healthData.alcohol_units}
                  onChange={(e) => handleInputChange('alcohol_units', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="30"
                />
              </div>
            </div>
          </div>

          {/* Get Recommendations Button */}
          <div className="lg:col-span-2">
            <button
              onClick={getRecommendations}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Analyzing Your Health Data...
                </div>
              ) : (
                '🧠 Get AI Health Recommendations'
              )}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'results' && recommendations && (
        <div className="space-y-6">
          {/* Health Score */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Your Health Score</h3>
                <p className="text-gray-600">{recommendations.summary}</p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${getHealthScoreColor(recommendations.health_score)}`}>
                  {recommendations.health_score}/100
                </div>
                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(recommendations.risk_level)}`}>
                  {recommendations.risk_level} Risk
                </div>
              </div>
            </div>
          </div>

          {/* Primary Recommendation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Recommendation</h3>
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-green-900">{recommendations.primary_treatment}</h4>
                <p className="text-green-700">
                  Confidence: {(recommendations.confidence * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* All Recommendations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Recommendations</h3>
            <div className="space-y-4">
              {recommendations.recommendations.map((rec, index) => (
                <div key={rec.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{rec.treatment}</h4>
                      <div className="w-48 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{width: `${rec.confidence * 100}%`}}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {(rec.confidence * 100).toFixed(1)}%
                    </span>
                    <p className="text-xs text-gray-500">confidence</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Analysis Details</h4>
            <p className="text-sm text-gray-600 mb-2">
              This assessment was generated using our AI model trained on healthcare data.
              Model confidence: {(recommendations.metadata.model_confidence * 100).toFixed(1)}%
            </p>
            <div className="flex flex-wrap gap-2">
              {recommendations.metadata.factors_analyzed.map(factor => (
                <span key={factor} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {factor.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('assessment')}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Retake Assessment
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Save Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIHealthAssessment;
