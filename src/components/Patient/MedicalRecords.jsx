import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const MedicalRecords = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [records, setRecords] = useState({
    allergies: [],
    medications: [],
    conditions: [],
    labResults: [],
    procedures: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, fetchWithAuth } = useAuth();

  const fetchMedicalRecords = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch all medical records data from API
      const overviewRes = await fetchWithAuth('/api/medical-records/overview');
      
      if (overviewRes.ok) {
        const data = await overviewRes.json();
        
        // Transform the data to match frontend expectations
        setRecords({
          allergies: data.allergies.map(allergy => ({
            id: allergy.id,
            name: allergy.name,
            severity: allergy.severity,
            reaction: allergy.reaction,
            dateAdded: allergy.date_added
          })),
          medications: data.medications.map(med => ({
            id: med.id,
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            prescribedBy: med.prescribed_by,
            startDate: med.start_date,
            status: med.status
          })),
          conditions: data.conditions.map(condition => ({
            id: condition.id,
            name: condition.name,
            diagnosedDate: condition.diagnosed_date,
            status: condition.status,
            severity: condition.severity,
            notes: condition.notes
          })),
          labResults: data.lab_results.map(result => ({
            id: result.id,
            test: result.test_name,
            value: result.value,
            range: result.reference_range,
            status: result.status,
            date: result.test_date,
            orderedBy: result.ordered_by
          })),
          procedures: data.procedures.map(proc => ({
            id: proc.id,
            name: proc.name,
            date: proc.procedure_date,
            provider: proc.provider_name,
            location: proc.location,
            outcome: proc.outcome
          }))
        });
      } else {
        throw new Error('Failed to fetch medical records');
      }
    } catch (err) {
      console.error('Error fetching medical records:', err);
      setError(err.message);
      // Keep empty arrays as fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMedicalRecords();
    }
  }, [user]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'allergies', label: 'Allergies', icon: '⚠️' },
    { id: 'medications', label: 'Medications', icon: '💊' },
    { id: 'conditions', label: 'Conditions', icon: '🏥' },
    { id: 'labs', label: 'Lab Results', icon: '🧪' },
    { id: 'procedures', label: 'Procedures', icon: '🔬' }
  ];

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'severe':
        return 'bg-red-100 text-red-800';
      case 'medium':
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
      case 'mild':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'managed':
      case 'normal':
        return 'bg-green-100 text-green-800';
      case 'inactive':
      case 'resolved':
        return 'bg-gray-100 text-gray-800';
      case 'slightly high':
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Authentication Required</h3>
          <p className="text-gray-500">Please log in to view your medical records</p>
        </div>
      </div>
    );
  }

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">Active Allergies</p>
              <p className="text-2xl font-bold text-red-900">{records.allergies.length}</p>
            </div>
            <div className="text-2xl">⚠️</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Current Medications</p>
              <p className="text-2xl font-bold text-blue-900">{records.medications.filter(m => m.status === 'Active').length}</p>
            </div>
            <div className="text-2xl">💊</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Managed Conditions</p>
              <p className="text-2xl font-bold text-green-900">{records.conditions.filter(c => c.status === 'Managed').length}</p>
            </div>
            <div className="text-2xl">🏥</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Recent Tests</p>
              <p className="text-2xl font-bold text-purple-900">{records.labResults.length}</p>
            </div>
            <div className="text-2xl">🧪</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Medical Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              { type: 'lab', title: 'HbA1c Test Results', date: '2024-01-15', status: 'Normal', icon: '🧪' },
              { type: 'procedure', title: 'Annual Physical Exam', date: '2024-01-10', status: 'Completed', icon: '🔬' },
              { type: 'medication', title: 'Lisinopril Prescription Renewed', date: '2024-01-05', status: 'Active', icon: '💊' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-xl">{activity.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const AllergiesTab = () => (
    <div className="space-y-4">
      {records.allergies.map((allergy) => (
        <div key={allergy.id} className="bg-white rounded-lg shadow-sm border-l-4 border-red-500 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{allergy.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(allergy.severity)}`}>
                  {allergy.severity} Risk
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{allergy.reaction}</p>
              <p className="text-xs text-gray-500">Added: {new Date(allergy.dateAdded).toLocaleDateString()}</p>
            </div>
            <div className="text-2xl">⚠️</div>
          </div>
        </div>
      ))}
    </div>
  );

  const MedicationsTab = () => (
    <div className="space-y-4">
      {records.medications.map((medication) => (
        <div key={medication.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{medication.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(medication.status)}`}>
                  {medication.status}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Dosage</p>
                  <p className="text-gray-600">{medication.dosage}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Frequency</p>
                  <p className="text-gray-600">{medication.frequency}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Prescribed By</p>
                  <p className="text-gray-600">{medication.prescribedBy}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Started: {new Date(medication.startDate).toLocaleDateString()}</p>
            </div>
            <div className="text-2xl">💊</div>
          </div>
        </div>
      ))}
    </div>
  );

  const ConditionsTab = () => (
    <div className="space-y-4">
      {records.conditions.map((condition) => (
        <div key={condition.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{condition.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(condition.status)}`}>
                  {condition.status}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(condition.severity)}`}>
                  {condition.severity}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{condition.notes}</p>
              <p className="text-xs text-gray-500">Diagnosed: {new Date(condition.diagnosedDate).toLocaleDateString()}</p>
            </div>
            <div className="text-2xl">🏥</div>
          </div>
        </div>
      ))}
    </div>
  );

  const LabsTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference Range</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered By</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.labResults.map((result) => (
              <tr key={result.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.test}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{result.value}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.range}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                    {result.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(result.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.orderedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const ProceduresTab = () => (
    <div className="space-y-4">
      {records.procedures.map((procedure) => (
        <div key={procedure.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{procedure.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Provider</p>
                  <p className="text-gray-600">{procedure.provider}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Location</p>
                  <p className="text-gray-600">{procedure.location}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Date</p>
                  <p className="text-gray-600">{new Date(procedure.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="font-medium text-gray-700 text-sm">Outcome</p>
                <p className="text-gray-600 text-sm">{procedure.outcome}</p>
              </div>
            </div>
            <div className="text-2xl">🔬</div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
          <p className="text-gray-600 mt-2">Comprehensive view of your medical history and health information</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={fetchMedicalRecords}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                Refreshing...
              </>
            ) : (
              <>🔄 Refresh</>
            )}
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg">
            📄 Export Records
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'allergies' && <AllergiesTab />}
        {activeTab === 'medications' && <MedicationsTab />}
        {activeTab === 'conditions' && <ConditionsTab />}
        {activeTab === 'labs' && <LabsTab />}
        {activeTab === 'procedures' && <ProceduresTab />}
      </div>
    </div>
  );
};

export default MedicalRecords;
