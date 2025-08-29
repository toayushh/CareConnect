import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE = 'http://localhost:9000/api';

const DataQualityDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qualityData, setQualityData] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState('30d');

  const { fetchWithAuth } = useAuth();

  const fetchQualityData = async () => {
    setLoading(true);
    setError('');

    try {
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

      const qualityResponse = await fetchWithAuth(`${API_BASE}/data-quality/assessment/${patientId}?range=${selectedDateRange}`);
      if (qualityResponse.ok) {
        const quality = await qualityResponse.json();
        setQualityData(quality);
      }

    } catch (err) {
      console.error('Error fetching quality data:', err);
      setError('Failed to load data quality information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQualityData();
  }, [selectedDateRange]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading data quality dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Data Quality Dashboard</h1>
            <p className="text-gray-600 mt-1">Real-time data validation and quality scoring</p>
          </div>
          
          <div className="flex space-x-3">
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            
            <button
              onClick={fetchQualityData}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {qualityData && (
        <>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Data Quality</h3>
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-gray-900 mb-2">
                {(qualityData.overall_score * 100).toFixed(0)}%
              </div>
              <div className="text-lg text-gray-600">Quality Score</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(qualityData.quality_metrics).filter(([key]) => key !== 'overall_quality').map(([metricKey, metric]) => (
                <div key={metricKey} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 capitalize">
                      {metricKey.replace(/_/g, ' ')}
                    </h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getQualityColor(metric.status)}`}>
                      {getQualityIcon(metric.status)}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {(metric.value * 100).toFixed(0)}%
                  </div>
                  <p className="text-sm text-gray-600">{metric.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
            <div className="space-y-3">
              {qualityData.recommendations.map((rec, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-medium text-blue-900">{rec.action}</p>
                  <p className="text-sm text-blue-700">{rec.description}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DataQualityDashboard;
