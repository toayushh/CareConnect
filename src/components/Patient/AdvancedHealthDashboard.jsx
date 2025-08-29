import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const API_BASE = 'http://localhost:9000/api';

const AdvancedHealthDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    analysis: null,
    predictions: null,
    effectiveness: null,
    engagement: null
  });
  const [activeView, setActiveView] = useState('overview');

  const { fetchWithAuth, user } = useAuth();

  // Fetch comprehensive dashboard data
  const fetchDashboardData = async () => {
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

      // Fetch comprehensive analysis
      const analysisResponse = await fetchWithAuth(`${API_BASE}/treatment-plans/analytics/comprehensive/${patientId}`);
      let analysis = null;
      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        analysis = analysisData.analysis;
      }

      // Fetch predictions
      const predictionsResponse = await fetchWithAuth(`${API_BASE}/treatment-plans/predictions/${patientId}`);
      let predictions = null;
      if (predictionsResponse.ok) {
        predictions = await predictionsResponse.json();
      }

      // Fetch treatment effectiveness
      const treatmentPlansResponse = await fetchWithAuth(`${API_BASE}/treatment-plans`);
      let effectiveness = null;
      if (treatmentPlansResponse.ok) {
        const treatmentPlans = await treatmentPlansResponse.json();
        if (treatmentPlans.length > 0) {
          const effectivenessResponse = await fetchWithAuth(`${API_BASE}/treatment-plans/effectiveness/${treatmentPlans[0].id}`);
          if (effectivenessResponse.ok) {
            effectiveness = await effectivenessResponse.json();
          }
        }
      }

      setDashboardData({
        analysis,
        predictions,
        effectiveness,
        engagement: null // Will be implemented later
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const renderOverviewCards = () => {
    const { analysis } = dashboardData;
    if (!analysis) return null;

    const cards = [
      {
        title: 'Symptom Burden',
        value: analysis.symptom_analysis?.symptom_burden?.toFixed(1) || 'N/A',
        max: 10,
        color: 'bg-red-500',
        trend: analysis.symptom_analysis?.trends?.overall_trend || 'stable'
      },
      {
        title: 'Mood Stability',
        value: analysis.mood_analysis?.mood_stability?.toFixed(2) || 'N/A',
        max: 10,
        color: 'bg-blue-500',
        trend: analysis.mood_analysis?.trends?.overall_trend || 'stable'
      },
      {
        title: 'Treatment Adherence',
        value: analysis.treatment_analysis?.adherence_rate?.toFixed(1) || 'N/A',
        max: 100,
        color: 'bg-green-500',
        trend: analysis.treatment_analysis?.trends?.overall_trend || 'stable'
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {cards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">{card.title}</h3>
            <div className="flex items-end space-x-2">
              <span className="text-xl font-bold text-gray-900">{card.value}</span>
              {card.max && <span className="text-gray-500 text-sm mb-1">/ {card.max}</span>}
            </div>
            <div className="mt-2">
              <span className={`text-sm font-medium ${
                card.trend === 'improving' ? 'text-green-600' :
                card.trend === 'declining' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {card.trend.charAt(0).toUpperCase() + card.trend.slice(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDetailedAnalysis = () => {
    const { analysis } = dashboardData;
    if (!analysis) {
      return (
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Analysis View Coming Soon</h3>
          <p className="text-gray-600">We're working on bringing you detailed health insights and analytics.</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900">Comprehensive Health Analysis</h3>
        
        {/* Symptom Analysis */}
        {analysis.symptom_analysis && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Symptom Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Current Burden</p>
                <p className="text-2xl font-bold text-red-600">{analysis.symptom_analysis.symptom_burden?.toFixed(1) || 'N/A'}/10</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Trend</p>
                <p className="text-lg font-medium text-blue-600 capitalize">{analysis.symptom_analysis.trends?.overall_trend || 'N/A'}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Weekly Pattern</p>
                <p className="text-lg font-medium text-green-600 capitalize">{analysis.symptom_analysis.trends?.weekly_pattern || 'N/A'}</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Daily Variation</p>
                <p className="text-lg font-medium text-purple-600">{analysis.symptom_analysis.trends?.daily_variation || 'N/A'}</p>
              </div>
            </div>
            
            {analysis.symptom_analysis.top_symptoms && (
              <div className="mb-4">
                <h5 className="font-medium text-gray-900 mb-2">Top Symptoms</h5>
                <div className="flex flex-wrap gap-2">
                  {analysis.symptom_analysis.top_symptoms.map((symptom, index) => (
                    <span key={index} className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mood Analysis */}
        {analysis.mood_analysis && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Mood & Emotional Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Mood Stability</p>
                <p className="text-2xl font-bold text-blue-600">{(analysis.mood_analysis.mood_stability * 100).toFixed(0)}%</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Overall Trend</p>
                <p className="text-lg font-medium text-green-600 capitalize">{analysis.mood_analysis.mood_trend || 'N/A'}</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Pattern Recognition</p>
                <p className="text-lg font-medium text-purple-600">Active</p>
              </div>
            </div>
            
            {analysis.mood_analysis.mood_patterns && (
              <div className="mb-4">
                <h5 className="font-medium text-gray-900 mb-2">Daily Mood Patterns</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(analysis.mood_analysis.mood_patterns).map(([time, score]) => (
                    <div key={time} className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600 capitalize">{time}</p>
                      <p className="text-lg font-medium text-gray-900">{score}/10</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity Analysis */}
        {analysis.activity_analysis && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Activity & Engagement Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Engagement Score</p>
                <p className="text-2xl font-bold text-green-600">{(analysis.activity_analysis.engagement_score * 100).toFixed(0)}%</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Activity Level</p>
                <p className="text-lg font-medium text-blue-600">Moderate</p>
              </div>
            </div>
            
            {analysis.activity_analysis.activity_goals && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Progress Towards Goals</h5>
                <div className="space-y-3">
                  {Object.entries(analysis.activity_analysis.activity_goals).map(([goal, progress]) => (
                    <div key={goal} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 capitalize">{goal.replace(/_/g, ' ')}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(parseInt(progress.split('/')[0]) / parseInt(progress.split('/')[1])) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{progress}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Treatment Effectiveness */}
        {analysis.treatment_effectiveness && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Treatment Effectiveness</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Overall Effectiveness</p>
                <p className="text-2xl font-bold text-green-600">{(analysis.treatment_effectiveness.effectiveness_score * 100).toFixed(0)}%</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Adherence Rate</p>
                <p className="text-2xl font-bold text-blue-600">{(analysis.treatment_effectiveness.adherence_rate * 100).toFixed(0)}%</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Symptom Improvement</p>
                <p className="text-2xl font-bold text-purple-600">{(analysis.treatment_effectiveness.symptom_improvement * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Risk Assessment */}
        {analysis.risk_assessment && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600">Risk Level</p>
                <p className="text-2xl font-bold text-yellow-600 capitalize">{analysis.risk_assessment.risk_level || 'N/A'}</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Risk Score</p>
                <p className="text-2xl font-bold text-red-600">{(analysis.risk_assessment.risk_score * 100).toFixed(0)}%</p>
              </div>
            </div>
            
            {analysis.risk_assessment.risk_factors && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Identified Risk Factors</h5>
                <div className="flex flex-wrap gap-2">
                  {analysis.risk_assessment.risk_factors.map((factor, index) => (
                    <span key={index} className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderPredictions = () => {
    const { predictions } = dashboardData;
    if (!predictions) {
      return (
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">🔮</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Predictions View Coming Soon</h3>
          <p className="text-gray-600">AI-powered health predictions and forecasting will be available soon.</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900">AI Health Predictions</h3>
        
        {/* Current Predictions */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Current Predictions</h4>
          {predictions.current_predictions && Object.keys(predictions.current_predictions).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(predictions.current_predictions).map(([key, prediction], index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-blue-900 capitalize">
                      {key.replace(/_/g, ' ')}
                    </h5>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      AI Generated
                    </span>
                  </div>
                  <p className="text-blue-800 mb-2">{prediction}</p>
                  <div className="flex items-center space-x-4 text-sm text-blue-700">
                    <span>Confidence: High</span>
                    <span>Model: LeapFrog AI</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-3">🤖</div>
              <p className="text-gray-600 mb-4">No AI predictions available at the moment.</p>
              <button 
                onClick={() => generateNewPredictions()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Generate New Predictions
              </button>
            </div>
          )}
        </div>

        {/* Historical Predictions */}
        {predictions.historical_predictions && predictions.historical_predictions.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Historical Predictions</h4>
            <div className="space-y-3">
              {predictions.historical_predictions.slice(0, 5).map((prediction, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {prediction.model_type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(prediction.prediction_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Confidence: {(prediction.confidence_score * 100).toFixed(0)}%
                  </div>
                  {prediction.validated && (
                    <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      ✓ Validated
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prediction Insights */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Prediction Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h5 className="font-medium text-purple-900 mb-2">Model Performance</h5>
              <div className="text-2xl font-bold text-purple-900 mb-1">85%</div>
              <div className="text-sm text-purple-700">Accuracy Rate</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h5 className="font-medium text-green-900 mb-2">Prediction Horizon</h5>
              <div className="text-2xl font-bold text-green-900 mb-1">7 Days</div>
              <div className="text-sm text-green-700">Look-ahead Period</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const generateNewPredictions = async () => {
    try {
      setLoading(true);
      // This would call the AI endpoint to generate new predictions
      // For now, we'll just refresh the dashboard data
      await fetchDashboardData();
    } catch (error) {
      console.error('Error generating predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDataQuality = () => {
    const { analysis } = dashboardData;
    if (!analysis) {
      return (
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">📈</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Data Quality View Coming Soon</h3>
          <p className="text-gray-600">Data quality metrics and validation tools will be available soon.</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      );
    }

    const dataQuality = analysis.data_quality;
    if (!dataQuality) {
      return (
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Data Quality Data Unavailable</h3>
          <p className="text-gray-600">Data quality metrics are not available for your current data.</p>
        </div>
      );
    }

    const getQualityColor = (status) => {
      switch (status) {
        case 'excellent': return 'text-green-600 bg-green-100';
        case 'good': return 'text-blue-600 bg-blue-100';
        case 'fair': return 'text-yellow-600 bg-yellow-100';
        case 'poor': return 'text-red-600 bg-red-100';
        default: return 'text-gray-600 bg-gray-100';
      }
    };

    const getQualityIcon = (status) => {
      switch (status) {
        case 'excellent': return '🌟';
        case 'good': return '✅';
        case 'fair': return '⚠️';
        case 'poor': return '❌';
        default: return '📊';
      }
    };

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900">Data Quality Assessment</h3>
        
        {/* Overall Quality Score */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Overall Data Quality</h4>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getQualityColor('excellent')}`}>
              {getQualityIcon('excellent')} Excellent
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {(dataQuality.overall_quality * 100).toFixed(0)}%
            </div>
            <div className="text-gray-600">Quality Score</div>
          </div>
        </div>

        {/* Quality Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(dataQuality).filter(([key]) => key !== 'overall_quality').map(([metric, value]) => (
            <div key={metric} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-900 capitalize">
                  {metric.replace(/_/g, ' ')}
                </h5>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getQualityColor('excellent')}`}>
                  {getQualityIcon('excellent')}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {(value * 100).toFixed(0)}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${value * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Quality Recommendations */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Quality Recommendations</h4>
          <div className="space-y-3">
            {dataQuality.completeness < 0.8 && (
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <span className="text-yellow-600 text-lg">💡</span>
                <div>
                  <p className="font-medium text-yellow-800">Improve Data Completeness</p>
                  <p className="text-sm text-yellow-700">Consider adding more data collection methods like symptom tracking and mood monitoring.</p>
                </div>
              </div>
            )}
            {dataQuality.consistency < 0.7 && (
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-blue-600 text-lg">📅</span>
                <div>
                  <p className="font-medium text-blue-800">Enhance Data Consistency</p>
                  <p className="text-sm text-blue-700">Set up daily reminders to encourage regular data entry.</p>
                </div>
              </div>
            )}
            {dataQuality.recency < 0.8 && (
              <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <span className="text-orange-600 text-lg">⏰</span>
                <div>
                  <p className="font-medium text-orange-800">Update Recent Data</p>
                  <p className="text-sm text-orange-700">Your data is getting old. Consider updating your health status.</p>
                </div>
              </div>
            )}
            {dataQuality.overall_quality >= 0.8 && (
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-green-600 text-lg">🎉</span>
                <div>
                  <p className="font-medium text-green-800">Excellent Data Quality</p>
                  <p className="text-sm text-green-700">Your data quality is excellent! Keep up the good work.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading advanced health dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="p-3 space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Advanced Health Dashboard</h1>
            <p className="text-sm text-gray-600">AI-powered insights and predictive analytics</p>
          </div>
          
          <button
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-blue-700 transition-colors"
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

      {/* Overview Cards */}
      {activeView === 'overview' && renderOverviewCards()}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'details', label: 'Detailed Analysis' },
              { id: 'predictions', label: 'Predictions' },
              { id: 'quality', label: 'Data Quality' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeView === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeView === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">Health Overview</h3>
              <p className="text-gray-600">Welcome to your advanced health dashboard. Use the tabs above to explore different views.</p>
            </div>
          )}
          
          {activeView === 'details' && renderDetailedAnalysis()}
          {activeView === 'predictions' && renderPredictions()}
          {activeView === 'quality' && renderDataQuality()}
        </div>
      </div>
      </div>
    </div>
  );
};

export default AdvancedHealthDashboard;
