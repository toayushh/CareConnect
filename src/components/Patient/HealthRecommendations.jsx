import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE = 'http://localhost:9000/api';

const HealthRecommendations = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    dashboard: null,
    recommendations: [],
    insights: [],
    riskAssessments: [],
    predictions: [],
    metrics: [],
    interventions: []
  });

  const { fetchWithAuth } = useAuth();

  // Fetch all recommendation data
  const fetchAllData = async () => {
    setLoading(true);
    setError('');

    try {
      const endpoints = [
        { key: 'dashboard', url: '/recommendations/dashboard' },
        { key: 'recommendations', url: '/recommendations/recommendations?limit=20' },
        { key: 'insights', url: '/recommendations/insights?limit=10' },
        { key: 'riskAssessments', url: '/recommendations/risk-assessments?limit=10' },
        { key: 'predictions', url: '/recommendations/predictions?limit=10' },
        { key: 'metrics', url: '/recommendations/metrics' },
        { key: 'interventions', url: '/recommendations/interventions?limit=10' }
      ];

      const results = {};
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetchWithAuth(`${API_BASE}${endpoint.url}`);
          
          if (response.ok) {
            results[endpoint.key] = await response.json();
          } else {
            console.warn(`${endpoint.key} endpoint returned ${response.status}`);
            results[endpoint.key] = endpoint.key === 'dashboard' ? null : [];
          }
        } catch (err) {
          console.warn(`Failed to fetch ${endpoint.key}:`, err);
          results[endpoint.key] = endpoint.key === 'dashboard' ? null : [];
        }
      }

      setData(results);
    } catch (err) {
      setError('Failed to load recommendation data');
      console.error('Recommendation data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate new recommendations
  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_BASE}/recommendations/generate`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ AI Recommendations Generated!\n\n${result.summary.recommendations_count} recommendations\n${result.summary.insights_count} insights\n${result.summary.risk_assessments_count} risk assessments\n${result.summary.predictions_count} predictions`);
        fetchAllData(); // Refresh data
      } else {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to generate recommendations');
      }
    } catch (err) {
      alert(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Update recommendation status
  const updateRecommendationStatus = async (recommendationId, status, notes = '') => {
    try {
      const response = await fetchWithAuth(`${API_BASE}/recommendations/recommendations/${recommendationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes })
      });

      if (response.ok) {
        alert(`✅ Recommendation ${status} successfully!`);
        fetchAllData(); // Refresh data
      } else {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to update recommendation');
      }
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500">Please log in to access AI health recommendations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🧠 AI Health Recommendations</h1>
            <p className="text-gray-600">Personalized health insights powered by LeapFrog AI</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchAllData}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              🔄 Refresh
            </button>
            <button
              onClick={generateRecommendations}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              ✨ Generate AI Recommendations
            </button>
          </div>
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
            <p className="text-gray-600 mt-2">Loading AI recommendations...</p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-2 bg-white rounded-lg p-1 shadow-sm border border-gray-100 mb-6">
          {[
            { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
            { id: 'recommendations', label: '💡 Recommendations', icon: '💡' },
            { id: 'insights', label: '🔍 Insights', icon: '🔍' },
            { id: 'risks', label: '⚠️ Risk Assessment', icon: '⚠️' },
            { id: 'predictions', label: '🔮 Predictions', icon: '🔮' },
            { id: 'metrics', label: '📈 Personal Metrics', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm rounded-md transition ${
                activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'dashboard' && (
            <DashboardView 
              dashboard={data.dashboard} 
              onGenerateRecommendations={generateRecommendations}
            />
          )}

          {activeTab === 'recommendations' && (
            <RecommendationsView 
              recommendations={data.recommendations} 
              onUpdateStatus={updateRecommendationStatus}
            />
          )}

          {activeTab === 'insights' && (
            <InsightsView insights={data.insights} />
          )}

          {activeTab === 'risks' && (
            <RiskAssessmentView riskAssessments={data.riskAssessments} />
          )}

          {activeTab === 'predictions' && (
            <PredictionsView predictions={data.predictions} />
          )}

          {activeTab === 'metrics' && (
            <MetricsView metrics={data.metrics} />
          )}
        </div>
      </div>
    </div>
  );
};

// Dashboard View Component
const DashboardView = ({ dashboard, onGenerateRecommendations }) => {
  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🤖</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Analysis Available</h3>
        <p className="text-gray-600 mb-4">Generate your first AI health recommendations to get started</p>
        <button
          onClick={onGenerateRecommendations}
          className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700"
        >
          ✨ Generate AI Recommendations
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Score */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-blue-500 to-green-500 rounded-full text-white">
          <span className="text-3xl font-bold">{dashboard.health_score}</span>
        </div>
        <h3 className="text-xl font-semibold mt-4">Overall Health Score</h3>
        <p className="text-gray-600">Based on AI analysis of your health data</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Active Recommendations" value={dashboard.recommendations?.length || 0} icon="💡" />
        <StatCard title="Health Insights" value={dashboard.insights?.length || 0} icon="🔍" />
        <StatCard title="Risk Assessments" value={dashboard.risk_assessments?.length || 0} icon="⚠️" />
        <StatCard title="Predictions" value={dashboard.predictions?.length || 0} icon="🔮" />
      </div>

      {/* Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Recommendations */}
        <div>
          <h4 className="text-lg font-semibold mb-3">📋 Recent Recommendations</h4>
          {dashboard.recommendations?.length > 0 ? (
            <div className="space-y-2">
              {dashboard.recommendations.slice(0, 3).map((rec) => (
                <div key={rec.id} className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900">{rec.title}</h5>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(rec.priority)}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {Math.round(rec.confidence_score * 100)}% confidence
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No recommendations available</p>
          )}
        </div>

        {/* Recent Insights */}
        <div>
          <h4 className="text-lg font-semibold mb-3">🔍 Latest Insights</h4>
          {dashboard.insights?.length > 0 ? (
            <div className="space-y-2">
              {dashboard.insights.slice(0, 3).map((insight) => (
                <div key={insight.id} className="p-3 bg-green-50 rounded-lg">
                  <h5 className="font-medium text-gray-900">{insight.title}</h5>
                  <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(insight.severity)}`}>
                    {insight.severity}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No insights available</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Recommendations View Component
const RecommendationsView = ({ recommendations, onUpdateStatus }) => (
  <div>
    <h3 className="text-lg font-medium text-gray-900 mb-4">💡 AI Health Recommendations</h3>
    {recommendations.length === 0 ? (
      <p className="text-gray-500">No recommendations available. Generate some using the AI button above.</p>
    ) : (
      <div className="space-y-4">
        {recommendations.map((rec) => (
          <RecommendationCard 
            key={rec.id} 
            recommendation={rec} 
            onUpdateStatus={onUpdateStatus}
          />
        ))}
      </div>
    )}
  </div>
);

// Insights View Component
const InsightsView = ({ insights }) => (
  <div>
    <h3 className="text-lg font-medium text-gray-900 mb-4">🔍 Health Insights</h3>
    {insights.length === 0 ? (
      <p className="text-gray-500">No insights available yet.</p>
    ) : (
      <div className="space-y-4">
        {insights.map((insight) => (
          <div key={insight.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-gray-900">{insight.title}</h4>
              <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(insight.severity)}`}>
                {insight.severity}
              </span>
            </div>
            <p className="text-gray-700 mb-2">{insight.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Type: {insight.insight_type}</span>
              <span>Period: {insight.time_period}</span>
              {insight.correlation_strength && (
                <span>Correlation: {Math.round(insight.correlation_strength * 100)}%</span>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Risk Assessment View Component
const RiskAssessmentView = ({ riskAssessments }) => (
  <div>
    <h3 className="text-lg font-medium text-gray-900 mb-4">⚠️ Risk Assessments</h3>
    {riskAssessments.length === 0 ? (
      <p className="text-gray-500">No risk assessments available yet.</p>
    ) : (
      <div className="space-y-4">
        {riskAssessments.map((risk) => (
          <div key={risk.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-gray-900 capitalize">{risk.risk_category} Risk</h4>
              <span className={`text-xs px-2 py-1 rounded-full ${getRiskLevelColor(risk.risk_level)}`}>
                {risk.risk_level}
              </span>
            </div>
            <p className="text-gray-700 mb-3">{risk.description}</p>
            
            {risk.risk_factors.length > 0 && (
              <div className="mb-3">
                <h5 className="font-medium text-red-600 mb-1">Risk Factors:</h5>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {risk.risk_factors.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {risk.protective_factors.length > 0 && (
              <div className="mb-3">
                <h5 className="font-medium text-green-600 mb-1">Protective Factors:</h5>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {risk.protective_factors.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="text-sm text-gray-500">
              Risk Score: {Math.round(risk.risk_score * 100)}%
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Predictions View Component
const PredictionsView = ({ predictions }) => (
  <div>
    <h3 className="text-lg font-medium text-gray-900 mb-4">🔮 Health Predictions</h3>
    {predictions.length === 0 ? (
      <p className="text-gray-500">No predictions available yet.</p>
    ) : (
      <div className="space-y-4">
        {predictions.map((prediction) => (
          <div key={prediction.id} className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">{prediction.outcome}</h4>
            <p className="text-gray-700 mb-3">{prediction.explanation}</p>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span>Probability: </span>
                <span className="font-medium text-blue-600">
                  {Math.round(prediction.probability * 100)}%
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Horizon: {prediction.prediction_horizon}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Metrics View Component
const MetricsView = ({ metrics }) => (
  <div>
    <h3 className="text-lg font-medium text-gray-900 mb-4">📈 Personal Health Metrics</h3>
    {metrics.length === 0 ? (
      <p className="text-gray-500">No personalized metrics available yet.</p>
    ) : (
      <div className="space-y-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>
    )}
  </div>
);

// Helper Components
const StatCard = ({ title, value, icon }) => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 text-center">
    <div className="text-2xl mb-2">{icon}</div>
    <div className="text-2xl font-bold text-blue-600">{value}</div>
    <div className="text-sm text-gray-600">{title}</div>
  </div>
);

const RecommendationCard = ({ recommendation, onUpdateStatus }) => (
  <div className="border border-gray-200 rounded-lg p-4">
    <div className="flex items-start justify-between mb-2">
      <h4 className="font-semibold text-gray-900">{recommendation.title}</h4>
      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(recommendation.priority)}`}>
        {recommendation.priority}
      </span>
    </div>
    
    <p className="text-gray-700 mb-3">{recommendation.description}</p>
    
    <div className="text-sm text-gray-600 mb-3">
      <span>Category: {recommendation.category}</span>
      <span className="mx-2">•</span>
      <span>Confidence: {Math.round(recommendation.confidence_score * 100)}%</span>
      {recommendation.target_date && (
        <>
          <span className="mx-2">•</span>
          <span>Target: {new Date(recommendation.target_date).toLocaleDateString()}</span>
        </>
      )}
    </div>
    
    {recommendation.reasoning && (
      <div className="text-sm text-gray-600 mb-3 italic">
        "Why: {recommendation.reasoning}"
      </div>
    )}
    
    {recommendation.status === 'pending' && (
      <div className="flex space-x-2">
        <button
          onClick={() => onUpdateStatus(recommendation.id, 'accepted')}
          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
        >
          ✅ Accept
        </button>
        <button
          onClick={() => onUpdateStatus(recommendation.id, 'completed')}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
        >
          ✔️ Mark Complete
        </button>
        <button
          onClick={() => onUpdateStatus(recommendation.id, 'rejected')}
          className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
        >
          ❌ Reject
        </button>
      </div>
    )}
    
    {recommendation.status !== 'pending' && (
      <div className="text-sm text-gray-500 italic">
        Status: {recommendation.status}
      </div>
    )}
  </div>
);

const MetricCard = ({ metric }) => {
  const progressPercentage = metric.progress_percentage || 0;
  
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 capitalize">
          {metric.metric_name.replace(/_/g, ' ')}
        </h4>
        <span className={`text-xs px-2 py-1 rounded-full ${
          metric.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {metric.status}
        </span>
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold text-blue-600">
          {metric.current_value} {metric.unit}
        </span>
        <span className="text-sm text-gray-600">
          Target: {metric.target_value} {metric.unit}
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
        ></div>
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Progress: {Math.round(progressPercentage)}%</span>
        <span>Difficulty: {metric.difficulty_level}</span>
      </div>
      
      {metric.optimal_range_min && metric.optimal_range_max && (
        <div className="text-xs text-gray-500 mt-1">
          Optimal range: {metric.optimal_range_min} - {metric.optimal_range_max} {metric.unit}
        </div>
      )}
    </div>
  );
};

// Helper Functions
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800';
    case 'alert': return 'bg-orange-100 text-orange-800';
    case 'warning': return 'bg-yellow-100 text-yellow-800';
    case 'info': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getRiskLevelColor = (level) => {
  switch (level) {
    case 'very_high': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'moderate': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default HealthRecommendations;
