import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE = 'http://localhost:9000/api';

const LeapFrogDoctorDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientAnalysis, setPatientAnalysis] = useState(null);
  const [treatmentPlans, setTreatmentPlans] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  const { fetchWithAuth } = useAuth();

  const fetchPatients = async () => {
    setLoading(true);
    try {
      // Get treatment plans to find patients
      const response = await fetchWithAuth(`${API_BASE}/treatment-plans`);
      if (response.ok) {
        const plans = await response.json();
        setTreatmentPlans(plans);
        
        // Extract unique patients
        const uniquePatients = plans.reduce((acc, plan) => {
          if (!acc.find(p => p.id === plan.patient_id)) {
            acc.push({
              id: plan.patient_id,
              name: plan.patient_name || `Patient ${plan.patient_id}`,
              activeTreatments: plans.filter(p => p.patient_id === plan.patient_id && p.status === 'active').length,
              lastUpdate: plan.updated_at
            });
          }
          return acc;
        }, []);
        
        setPatients(uniquePatients);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientAnalysis = async (patientId) => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_BASE}/treatment-plans/analytics/comprehensive/${patientId}`);
      if (response.ok) {
        const data = await response.json();
        setPatientAnalysis(data.analysis);
      } else {
        throw new Error('Failed to fetch patient analysis');
      }
    } catch (err) {
      console.error('Error fetching patient analysis:', err);
      setError('Failed to load patient analysis');
    } finally {
      setLoading(false);
    }
  };

  const optimizeTreatment = async (treatmentId) => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_BASE}/treatment-plans/leapfrog/optimize/${treatmentId}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const optimization = await response.json();
        // Handle optimization results
        console.log('Optimization results:', optimization);
        // Refresh patient analysis
        if (selectedPatient) {
          await fetchPatientAnalysis(selectedPatient.id);
        }
      }
    } catch (err) {
      console.error('Error optimizing treatment:', err);
      setError('Failed to optimize treatment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientAnalysis(selectedPatient.id);
    }
  }, [selectedPatient]);

  const renderPatientList = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">My Patients</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {patients.map((patient) => (
          <div
            key={patient.id}
            onClick={() => setSelectedPatient(patient)}
            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedPatient?.id === patient.id ? 'bg-indigo-50 border-r-4 border-indigo-500' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{patient.name}</h4>
                <p className="text-sm text-gray-600">
                  {patient.activeTreatments} active treatment{patient.activeTreatments !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Last updated</p>
                <p className="text-xs text-gray-600">
                  {new Date(patient.lastUpdate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPatientOverview = () => {
    if (!patientAnalysis) return null;

    const analysis = patientAnalysis;
    const riskLevel = analysis.risk_assessment?.risk_level || 'unknown';
    const effectiveness = analysis.treatment_effectiveness?.effectiveness_score || 0;

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Risk Level</h4>
            <p className={`text-2xl font-bold ${
              riskLevel === 'high' ? 'text-red-600' :
              riskLevel === 'moderate' ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {riskLevel.toUpperCase()}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Treatment Effectiveness</h4>
            <p className="text-2xl font-bold text-gray-900">
              {(effectiveness * 100).toFixed(0)}%
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Data Quality</h4>
            <p className="text-2xl font-bold text-gray-900">
              {analysis.data_quality ? (analysis.data_quality.overall_quality * 100).toFixed(0) : 'N/A'}%
            </p>
          </div>
        </div>

        {/* Risk Assessment Details */}
        {analysis.risk_assessment && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h4>
            <div className="space-y-3">
              {analysis.risk_assessment.recommendations?.map((rec, index) => (
                <div key={index} className="flex items-start">
                  <span className="text-red-500 mr-2 mt-0.5">⚠</span>
                  <p className="text-sm text-gray-700">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Predictive Insights */}
        {analysis.predictive_insights && Object.keys(analysis.predictive_insights).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Predictive Insights</h4>
            <div className="space-y-4">
              {analysis.predictive_insights.symptom_prediction && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-900">Symptom Trajectory</h5>
                  <p className="text-sm text-blue-700 mt-1">
                    {analysis.predictive_insights.symptom_prediction.trajectory} trend predicted
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Confidence: {(analysis.predictive_insights.symptom_prediction.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              )}
              
              {analysis.predictive_insights.mood_prediction && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h5 className="font-medium text-green-900">Mood Stability</h5>
                  <p className="text-sm text-green-700 mt-1">
                    Mood stability: {analysis.predictive_insights.mood_prediction.stability}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Confidence: {(analysis.predictive_insights.mood_prediction.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Treatment Optimization */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Treatment Optimization</h4>
            <button
              onClick={() => {
                const activeTreatment = treatmentPlans.find(
                  t => t.patient_id === selectedPatient.id && t.status === 'active'
                );
                if (activeTreatment) {
                  optimizeTreatment(activeTreatment.id);
                }
              }}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Optimizing...' : 'Run LeapFrog Optimization'}
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>Current effectiveness: <span className="font-medium">{(effectiveness * 100).toFixed(0)}%</span></p>
            <p className="mt-1">
              {effectiveness < 0.6 ? 
                'Treatment effectiveness is below optimal. Consider running optimization.' :
                'Treatment is performing well. Optimization can help identify further improvements.'
              }
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderPatientDetails = () => {
    if (!selectedPatient) {
      return (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">Select a patient to view detailed analysis</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{selectedPatient.name}</h2>
          <div className="flex gap-2">
            {['overview', 'trends', 'interventions'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  activeTab === tab
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && renderPatientOverview()}
        
        {activeTab !== 'overview' && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} view coming soon...
            </p>
          </div>
        )}
      </div>
    );
  };

  if (loading && patients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">LeapFrog Doctor Dashboard</h1>
        <button
          onClick={fetchPatients}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          {renderPatientList()}
        </div>
        <div className="lg:col-span-2">
          {renderPatientDetails()}
        </div>
      </div>
    </div>
  );
};

export default LeapFrogDoctorDashboard;
