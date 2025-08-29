import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const API_BASE = 'http://localhost:9000/api';

const TreatmentPlansAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [treatmentPlans, setTreatmentPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [effectivenessData, setEffectivenessData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  const { fetchWithAuth, user } = useAuth();

  // Fetch treatment plans and analytics data
  const fetchTreatmentPlansData = async () => {
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

      // Fetch treatment plans
      const plansResponse = await fetchWithAuth(`${API_BASE}/treatment-plans`);
      if (plansResponse.ok) {
        const plans = await plansResponse.json();
        setTreatmentPlans(plans);
        
        if (plans.length > 0) {
          setSelectedPlan(plans[0]);
          await fetchPlanAnalytics(plans[0].id);
        }
      }

      // Fetch comprehensive analytics
      const analyticsResponse = await fetchWithAuth(`${API_BASE}/treatment-plans/analytics/comprehensive/${patientId}`);
      if (analyticsResponse.ok) {
        const analytics = await analyticsResponse.json();
        setAnalyticsData(analytics.analysis);
      }

    } catch (err) {
      console.error('Error fetching treatment plans data:', err);
      setError('Failed to load treatment plans data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanAnalytics = async (planId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE}/treatment-plans/effectiveness/${planId}`);
      if (response.ok) {
        const data = await response.json();
        setEffectivenessData(data);
      }
    } catch (err) {
      console.error('Error fetching plan analytics:', err);
    }
  };

  useEffect(() => {
    fetchTreatmentPlansData();
  }, []);

  const handlePlanChange = async (plan) => {
    setSelectedPlan(plan);
    await fetchPlanAnalytics(plan.id);
  };

  const renderTreatmentPlanSelector = () => {
    if (treatmentPlans.length === 0) {
      return (
        <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
          <div className="text-gray-400 text-4xl mb-3">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Treatment Plans</h3>
          <p className="text-gray-600">You don't have any active treatment plans yet.</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Treatment Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {treatmentPlans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => handlePlanChange(plan)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedPlan?.id === plan.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
            >
              <div className="text-left">
                <h4 className="font-medium text-gray-900 mb-1">{plan.plan_name}</h4>
                <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    plan.status === 'active' ? 'bg-green-100 text-green-800' :
                    plan.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {plan.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {plan.start_date ? new Date(plan.start_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderEffectivenessMetrics = () => {
    if (!effectivenessData) return null;

    const currentEffectiveness = effectivenessData.current_effectiveness;
    if (!currentEffectiveness) return null;

    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Treatment Effectiveness</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {currentEffectiveness.effectiveness_score ? (currentEffectiveness.effectiveness_score * 100).toFixed(0) : 'N/A'}%
            </div>
            <div className="text-sm text-green-700">Overall Effectiveness</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {currentEffectiveness.adherence_rate ? (currentEffectiveness.adherence_rate * 100).toFixed(0) : 'N/A'}%
            </div>
            <div className="text-sm text-blue-700">Adherence Rate</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {currentEffectiveness.symptom_improvement ? (currentEffectiveness.symptom_improvement * 100).toFixed(0) : 'N/A'}%
            </div>
            <div className="text-sm text-purple-700">Symptom Improvement</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {currentEffectiveness.quality_of_life_impact ? (currentEffectiveness.quality_of_life_impact * 100).toFixed(0) : 'N/A'}%
            </div>
            <div className="text-sm text-orange-700">Quality of Life Impact</div>
          </div>
        </div>
      </div>
    );
  };

  const renderHistoricalEffectiveness = () => {
    if (!effectivenessData?.historical_measurements || effectivenessData.historical_measurements.length === 0) {
      return null;
    }

    const chartData = effectivenessData.historical_measurements.map((record, index) => ({
      period: `Week ${index + 1}`,
      effectiveness: record.scores.overall * 100,
      adherence: record.scores.adherence * 100,
      symptoms: record.scores.symptom_improvement * 100,
      mood: record.scores.mood_stability * 100
    }));

    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Effectiveness Over Time</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              <Line type="monotone" dataKey="effectiveness" stroke="#10B981" strokeWidth={2} name="Overall Effectiveness" />
              <Line type="monotone" dataKey="adherence" stroke="#3B82F6" strokeWidth={2} name="Adherence" />
              <Line type="monotone" dataKey="symptoms" stroke="#8B5CF6" strokeWidth={2} name="Symptom Improvement" />
              <Line type="monotone" dataKey="mood" stroke="#F59E0B" strokeWidth={2} name="Mood Stability" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderTreatmentComponents = () => {
    if (!selectedPlan) return null;

    const components = [
      { key: 'medications', title: 'Medications', icon: '💊' },
      { key: 'therapies', title: 'Therapies', icon: '🏥' },
      { key: 'lifestyle_recommendations', title: 'Lifestyle', icon: '🏃‍♂️' },
      { key: 'follow_up_schedule', title: 'Follow-up', icon: '📅' }
    ];

    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Treatment Components</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {components.map(({ key, title, icon }) => {
            const items = selectedPlan[key] || [];
            return (
              <div key={key} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-2">{icon}</span>
                  <h4 className="font-medium text-gray-900">{title}</h4>
                </div>
                {items.length > 0 ? (
                  <ul className="space-y-2">
                    {items.map((item, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        {typeof item === 'string' ? item : item.name || JSON.stringify(item)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">No {title.toLowerCase()} specified</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAIInsights = () => {
    if (!analyticsData) return null;

    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Powered Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Risk Assessment</h4>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {analyticsData.risk_assessment?.risk_level || 'N/A'}
            </div>
            <p className="text-sm text-blue-700">
              Risk Score: {(analyticsData.risk_assessment?.risk_score * 100).toFixed(0)}%
            </p>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900 mb-2">Data Quality</h4>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {(analyticsData.data_quality?.overall_quality * 100).toFixed(0)}%
            </div>
            <p className="text-sm text-green-700">Overall Quality Score</p>
          </div>
        </div>
        
        {analyticsData.risk_assessment?.risk_factors && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2">Risk Factors</h4>
            <div className="flex flex-wrap gap-2">
              {analyticsData.risk_assessment.risk_factors.map((factor, index) => (
                <span key={index} className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                  {factor}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading treatment plans analytics...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Treatment Plans Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive analysis of your treatment effectiveness and progress</p>
          </div>
          
          <button
            onClick={fetchTreatmentPlansData}
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

      {/* Treatment Plan Selector */}
      {renderTreatmentPlanSelector()}

      {/* Selected Plan Details */}
      {selectedPlan && (
        <>
          {renderEffectivenessMetrics()}
          {renderHistoricalEffectiveness()}
          {renderTreatmentComponents()}
          {renderAIInsights()}
        </>
      )}

      {/* No Plans Message */}
      {treatmentPlans.length === 0 && !loading && (
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Treatment Plans Available</h3>
          <p className="text-gray-600 mb-4">
            You don't have any active treatment plans yet. Contact your healthcare provider to get started.
          </p>
          <button 
            onClick={fetchTreatmentPlansData}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Check Again
          </button>
        </div>
      )}
    </div>
  );
};

export default TreatmentPlansAnalytics;
