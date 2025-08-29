import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AIHealthAssessment from './AIHealthAssessment';

const API_BASE = 'http://localhost:9000/api';

const LeapFrogRecommendations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [activeTab, setActiveTab] = useState('current');
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);

  const { fetchWithAuth } = useAuth();

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');

    try {
      // Get AI suggestions
      const response = await fetchWithAuth(`${API_BASE}/ai/suggestions`);
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data.suggestions || []);
        setRecommendations(list);
      } else {
        throw new Error('Failed to fetch recommendations');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const generateNewRecommendations = async () => {
    setLoading(true);
    try {
      // Need patient_id for POST; fetch from /users/me
      const meRes = await fetchWithAuth(`${API_BASE}/users/me`);
      if (!meRes.ok) throw new Error('Failed to resolve profile');
      const me = await meRes.json();
      const patientId = me?.patient_profile?.id;
      if (!patientId) throw new Error('No patient profile found');

      const response = await fetchWithAuth(`${API_BASE}/ai/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generate_new: true, patient_id: patientId })
      });

      if (response.ok) {
        await fetchRecommendations();
      } else {
        throw new Error('Failed to generate recommendations');
      }
    } catch (err) {
      console.error('Error generating recommendations:', err);
      setError('Failed to generate new recommendations');
    } finally {
      setLoading(false);
    }
  };

  const provideFeedback = async (suggestionId, feedback) => {
    try {
      const response = await fetchWithAuth(`${API_BASE}/treatment-plans/suggestions/${suggestionId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_feedback: feedback })
      });

      if (response.ok) {
        await fetchRecommendations();
        setSelectedRecommendation(null);
      }
    } catch (err) {
      console.error('Error providing feedback:', err);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderRecommendationCard = (rec) => (
    <div key={rec.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
              {rec.priority?.toUpperCase()}
            </span>
          </div>
          <p className="text-gray-600 mb-3">{rec.description}</p>
          
          {rec.reasoning && (
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-1">AI Reasoning:</p>
              <p className="text-sm text-gray-600 italic">{rec.reasoning}</p>
            </div>
          )}
        </div>
        
        <div className="text-right ml-4">
          <div className="text-sm text-gray-500 mb-1">Confidence</div>
          <div className={`text-lg font-bold ${getConfidenceColor(rec.confidence_score)}`}>
            {(rec.confidence_score * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {rec.implementation_steps && rec.implementation_steps.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Implementation Steps:</h4>
          <ul className="space-y-1">
            {rec.implementation_steps.map((step, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <span className="text-indigo-500 mr-2 mt-0.5">•</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}

      {rec.expected_outcomes && rec.expected_outcomes.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Expected Outcomes:</h4>
          <ul className="space-y-1">
            {rec.expected_outcomes.map((outcome, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <span className="text-green-500 mr-2 mt-0.5">✓</span>
                {outcome}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            Type: {rec.suggestion_type?.replace('_', ' ')}
          </span>
          {rec.status && (
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              rec.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              rec.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
              rec.status === 'implemented' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {rec.status}
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedRecommendation(rec)}
            className="px-3 py-1 text-sm bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors"
          >
            View Details
          </button>
          {rec.status === 'pending' && (
            <button
              onClick={() => provideFeedback(rec.id, 'interested')}
              className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
            >
              I'm Interested
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderDetailModal = () => {
    if (!selectedRecommendation) return null;

    const rec = selectedRecommendation;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{rec.title}</h2>
              <button
                onClick={() => setSelectedRecommendation(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{rec.description}</p>
              </div>

              {rec.reasoning && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">AI Reasoning</h3>
                  <p className="text-gray-600 italic">{rec.reasoning}</p>
                </div>
              )}

              {rec.implementation_steps && rec.implementation_steps.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Implementation Steps</h3>
                  <ol className="list-decimal list-inside space-y-1">
                    {rec.implementation_steps.map((step, index) => (
                      <li key={index} className="text-gray-600">{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {rec.expected_outcomes && rec.expected_outcomes.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Expected Outcomes</h3>
                  <ul className="space-y-1">
                    {rec.expected_outcomes.map((outcome, index) => (
                      <li key={index} className="text-gray-600 flex items-start">
                        <span className="text-green-500 mr-2 mt-0.5">✓</span>
                        {outcome}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {rec.monitoring_parameters && rec.monitoring_parameters.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Monitoring Parameters</h3>
                  <ul className="space-y-1">
                    {rec.monitoring_parameters.map((param, index) => (
                      <li key={index} className="text-gray-600 flex items-start">
                        <span className="text-blue-500 mr-2 mt-0.5">📊</span>
                        {param}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Confidence: <span className={`font-medium ${getConfidenceColor(rec.confidence_score)}`}>
                    {(rec.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => provideFeedback(rec.id, 'not_interested')}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    Not Interested
                  </button>
                  <button
                    onClick={() => provideFeedback(rec.id, 'interested')}
                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    I'm Interested
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && recommendations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">LeapFrog AI Recommendations</h2>
          {activeTab === 'current' && (
            <button
              onClick={generateNewRecommendations}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Generating...' : 'Generate New Recommendations'}
            </button>
          )}
        </div>
        
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('current')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'current'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Current Recommendations
          </button>
          <button
            onClick={() => setActiveTab('ai-assessment')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ai-assessment'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🧠 AI Health Assessment
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'ai-assessment' && (
        <AIHealthAssessment />
      )}

      {activeTab === 'current' && (
        <>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {recommendations.length === 0 && !loading ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">No recommendations available yet.</p>
          <button
            onClick={generateNewRecommendations}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Generate Recommendations
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map(renderRecommendationCard)}
        </div>
      )}
        </>
      )}

      {renderDetailModal()}
    </div>
  );
};

export default LeapFrogRecommendations;
